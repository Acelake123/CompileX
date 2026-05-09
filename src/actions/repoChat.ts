"use server";

/**
 * Server-side repo chat action.
 *
 * WHY THIS EXISTS:
 * Convex actions run on Convex's cloud infrastructure.
 * They cannot reach http://localhost:11434 (Ollama on the user's machine).
 * Next.js server actions ("use server") run on the local dev/prod server
 * where Ollama IS accessible — matching the pattern used in aiAnalysis.ts.
 */

import { generateChat } from "@/config/geminiClient";
import { RepositoryFileEntry } from "@/types/repo-analyzer";

export interface RepoChatArgs {
  // Scope
  userMessage: string;
  scopeType: "repo" | "dir" | "file";
  scopePath?: string;

  // Repo identity
  repoName: string;
  repoOwner: string;
  repoDescription: string | null;
  defaultBranch: string;

  // AI context
  summary: string;
  keyFindings: string;
  readme: string | null;

  // File tree (client already has this from context)
  repositoryFiles: RepositoryFileEntry[];

  // Content for file/dir scope (client loads on demand via CodeViewer)
  selectedFileContent: string | null;
}

function trimToLimit(value: string, limit: number): string {
  if (value.length <= limit) return value;
  return value.slice(0, limit) + "\n... (truncated)";
}

export async function generateRepoChatResponse(
  args: RepoChatArgs
): Promise<{ response: string; contextFiles: string[] }> {
  const {
    userMessage,
    scopeType,
    scopePath,
    repoName,
    repoOwner,
    repoDescription,
    defaultBranch,
    summary,
    keyFindings,
    readme,
    repositoryFiles,
    selectedFileContent,
  } = args;

  // Build file-path list from the full file tree the client already has
  const filePaths = repositoryFiles
    .filter((f) => f.type === "file")
    .map((f) => f.path);

  const fileTreeSummary = trimToLimit(filePaths.slice(0, 200).join("\n"), 4000);

  let scopeContext = "";
  let contextFiles: string[] = [];

  if (scopeType === "file" && scopePath) {
    if (!selectedFileContent) {
      throw new Error(
        "Selected file content is not loaded yet. Click the file in the tree first."
      );
    }
    contextFiles = [scopePath];
    scopeContext =
      `Selected File: ${scopePath}\n\n` +
      `--- FILE CONTENT START ---\n${trimToLimit(selectedFileContent, 12000)}\n--- FILE CONTENT END ---`;
  }

  if (scopeType === "dir" && scopePath) {
    const dirPrefix = scopePath.endsWith("/") ? scopePath : `${scopePath}/`;
    const dirFiles = filePaths.filter((p) => p.startsWith(dirPrefix));
    contextFiles = dirFiles.slice(0, 50);

    // Include the currently-open file's content if it belongs to this dir
    const contentBlocks = contextFiles
      .map((path) => {
        if (path === scopePath && selectedFileContent) {
          return `File: ${path}\n${trimToLimit(selectedFileContent, 4000)}`;
        }
        return `File: ${path}\n(Content not yet loaded — ask about a specific file)`;
      })
      .join("\n\n");

    scopeContext =
      `Directory: ${scopePath}\n` +
      `Files (up to 50):\n${contextFiles.join("\n")}\n\n` +
      `--- DIRECTORY CONTENT SAMPLES ---\n${trimToLimit(contentBlocks, 12000)}`;
  }

  const prompt = `You are a code-aware assistant. Answer strictly using the provided repository context.
If the required file content is missing, ask the user to load that file first.

REPOSITORY METADATA:
- Name: ${repoName}
- Owner: ${repoOwner}
- Description: ${repoDescription ?? "N/A"}
- Default Branch: ${defaultBranch}

REPOSITORY SUMMARY:
${summary}

KEY FINDINGS:
${keyFindings}

README (truncated if long):
${readme ? trimToLimit(readme, 4000) : "No README available."}

FILE TREE (partial):
${fileTreeSummary}

${scopeContext ? `SCOPE CONTEXT:\n${scopeContext}\n` : ""}

USER QUESTION:
${userMessage}

Provide a concise, accurate answer grounded in the repository context.`;

  const response = await generateChat(prompt, 1200);

  return { response, contextFiles };
}
