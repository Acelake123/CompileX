"use node";

import { action } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { api } from "./_generated/api";

interface OllamaTagsResponse {
  models?: Array<{ name: string }>;
}

let cachedModel: string | null = null;

function getOllamaBaseUrl(): string {
  return process.env.OLLAMA_BASE_URL || "http://localhost:11434";
}

async function detectOllamaModel(): Promise<string> {
  if (cachedModel) {
    return cachedModel;
  }

  const preferred = process.env.OLLAMA_MODEL;
  const response = await fetch(`${getOllamaBaseUrl()}/api/tags`);
  if (!response.ok) {
    throw new Error(`Ollama API returned ${response.status}`);
  }

  const data = (await response.json()) as OllamaTagsResponse;
  const models = data.models || [];
  if (models.length === 0) {
    throw new Error(
      "No Ollama models are installed. Run: ollama pull <model-name>."
    );
  }

  if (preferred && models.some((m) => m.name === preferred)) {
    cachedModel = preferred;
    return preferred;
  }

  cachedModel = models[0].name;
  return cachedModel;
}

async function generateWithOllama(prompt: string, maxTokens: number): Promise<string> {
  const model = await detectOllamaModel();
  const response = await fetch(`${getOllamaBaseUrl()}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      temperature: 0.2,
      top_p: 0.9,
      num_predict: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Ollama API error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as { response?: string };
  return (data.response || "").trim();
}

function trimToLimit(value: string, limit: number): string {
  if (value.length <= limit) {
    return value;
  }
  return value.slice(0, limit) + "\n... (truncated)";
}

export const generateRepoChatResponse = action({
  args: {
    repoAnalysisId: v.id("repoAnalyses"),
    repositoryId: v.id("repositories"),
    userMessage: v.string(),
    scopeType: v.union(v.literal("repo"), v.literal("dir"), v.literal("file")),
    scopePath: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("AUTH_REQUIRED");
    }

    const analysis = await ctx.runQuery(api.repoAnalyzer.getRepoAnalysis, {
      repoAnalysisId: args.repoAnalysisId,
    });
    if (!analysis) {
      throw new ConvexError("NOT_AUTHORIZED");
    }

    const repository = await ctx.runQuery(api.repositories.getRepository, {
      repositoryId: args.repositoryId,
    });
    if (!repository) {
      throw new ConvexError("NOT_AUTHORIZED");
    }

    const files = await ctx.runQuery(api.repositories.listRepositoryFiles, {
      repositoryId: args.repositoryId,
    }) as Array<{ path: string; type: "file" | "dir" }>;

    const filePaths = files
      .filter((file) => file.type === "file")
      .map((file) => file.path);

    const fileTreeSummary = trimToLimit(filePaths.slice(0, 200).join("\n"), 4000);

    let scopeContext = "";
    let contextFiles: string[] = [];

    if (args.scopeType === "file" && args.scopePath) {
      const cached = await ctx.runQuery(api.repositories.getCachedFileContent, {
        repositoryId: args.repositoryId,
        path: args.scopePath,
      }) as { content: string } | null;

      if (!cached) {
        throw new Error("Selected file content is not loaded yet.");
      }

      contextFiles = [args.scopePath];
      scopeContext = `Selected File: ${args.scopePath}\n\n` +
        `--- FILE CONTENT START ---\n${trimToLimit(cached.content, 12000)}\n--- FILE CONTENT END ---`;
    }

    if (args.scopeType === "dir" && args.scopePath) {
      const dirPrefix = args.scopePath.endsWith("/")
        ? args.scopePath
        : `${args.scopePath}/`;
      const dirFiles = filePaths.filter((path) => path.startsWith(dirPrefix));
      contextFiles = dirFiles.slice(0, 50);

      const cachedContents = await ctx.runQuery(api.repositories.listCachedFileContents, {
        repositoryId: args.repositoryId,
      }) as Array<{ path: string; content: string }>;

      const cachedMap = new Map(cachedContents.map((item) => [item.path, item]));

      const contentBlocks = contextFiles
        .map((path) => {
          const cached = cachedMap.get(path);
          if (!cached) {
            return `File: ${path}\n(No cached content)`;
          }
          return `File: ${path}\n${trimToLimit(cached.content, 4000)}`;
        })
        .join("\n\n");

      scopeContext = `Directory: ${args.scopePath}\n` +
        `Files (up to 50):\n${contextFiles.join("\n")}\n\n` +
        `--- DIRECTORY CONTENT SAMPLES ---\n${trimToLimit(contentBlocks, 12000)}`;
    }

    const prompt = `You are a code-aware assistant. Answer strictly using the provided repository context.
If the required file content is missing, ask the user to load that file first.

REPOSITORY METADATA:
- Name: ${analysis.metadata.name}
- Owner: ${analysis.metadata.owner}
- Description: ${analysis.metadata.description}
- Default Branch: ${analysis.metadata.defaultBranch}

REPOSITORY SUMMARY:
${analysis.analysis.summary}

KEY FINDINGS:
${analysis.analysis.keyFindings}

  README (truncated if long):
  ${analysis.readme ? trimToLimit(analysis.readme, 4000) : "No README available."}

FILE TREE (partial):
${fileTreeSummary}

${scopeContext ? `SCOPE CONTEXT:\n${scopeContext}\n` : ""}

USER QUESTION:
${args.userMessage}

Provide a concise, accurate answer grounded in the repository context.`;

    const response = await generateWithOllama(prompt, 1200);

    return {
      response,
      contextFiles,
    };
  },
});
