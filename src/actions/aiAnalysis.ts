"use server";

import { GitHubRepo, CommitSummary, FileStructure, RepositoryAnalysis, RepositoryFileEntry } from "@/types/repo-analyzer";
import { generateAnalysis, generateChat } from "@/config/geminiClient";

// ─── internal helpers ──────────────────────────────────────────────────────

function buildLanguageStats(files: RepositoryFileEntry[]): string {
  const counts: Record<string, number> = {};
  for (const f of files) {
    if (f.type === "file" && f.language && f.language !== "directory" && f.language !== "plaintext") {
      counts[f.language] = (counts[f.language] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([lang, n]) => `${lang}: ${n} file${n > 1 ? "s" : ""}`)
    .join(", ");
}

function detectProjectSignals(files: RepositoryFileEntry[]): {
  hasTests: boolean;
  hasDocs: boolean;
  hasCI: boolean;
  hasLinting: boolean;
  hasDocker: boolean;
  testFiles: string[];
  configFiles: string[];
  docFiles: string[];
} {
  const paths = files.map((f) => f.path.toLowerCase());
  const testPatterns = /(\.test\.|\.spec\.|[\/]tests?[\/]|[\/]__tests?__[\/])/;
  const testFiles = files
    .filter((f) => f.type === "file" && testPatterns.test(f.path.toLowerCase()))
    .map((f) => f.path)
    .slice(0, 8);

  const configNames = ["package.json", "tsconfig.json", ".eslintrc", ".eslintrc.js", ".eslintrc.json",
    ".prettierrc", "prettier.config.js", "jest.config.js", "jest.config.ts",
    "vite.config.ts", "vite.config.js", "webpack.config.js", "babel.config.js",
    "pyproject.toml", "setup.py", "setup.cfg", "Makefile", "requirements.txt",
    "go.mod", "cargo.toml", "pom.xml", "build.gradle"];
  const configFiles = files
    .filter((f) => f.type === "file" && configNames.some((c) => f.path.toLowerCase().endsWith(c)))
    .map((f) => f.path)
    .slice(0, 10);

  const docFiles = files
    .filter((f) => f.type === "file" && (
      f.path.toLowerCase().endsWith(".md") ||
      f.path.toLowerCase().includes("/docs/") ||
      f.path.toLowerCase() === "contributing.md" ||
      f.path.toLowerCase() === "changelog.md"
    ))
    .map((f) => f.path)
    .slice(0, 6);

  const hasCI = paths.some((p) =>
    p.includes(".github/workflows") || p.includes(".circleci") || p.includes(".travis.yml") ||
    p.includes("jenkinsfile") || p.includes(".gitlab-ci")
  );
  const hasLinting = configFiles.some((c) => c.toLowerCase().includes("eslint") || c.toLowerCase().includes("prettier"));
  const hasDocker = paths.some((p) => p.includes("dockerfile") || p === "docker-compose.yml");

  return {
    hasTests: testFiles.length > 0,
    hasDocs: docFiles.length > 0,
    hasCI,
    hasLinting,
    hasDocker,
    testFiles,
    configFiles,
    docFiles,
  };
}

function buildDirectorySnapshot(files: RepositoryFileEntry[]): string {
  // Show all top-level dirs + up to 60 representative file paths
  const topDirs = [...new Set(
    files
      .filter((f) => f.type === "dir" && !f.path.includes("/"))
      .map((f) => f.path)
  )].join(", ");

  const samplePaths = files
    .filter((f) => f.type === "file")
    .sort((a, b) => a.path.localeCompare(b.path))
    .slice(0, 60)
    .map((f) => f.path)
    .join("\n");

  return `Top-level directories: ${topDirs || "(none — flat repo)"}
Sample file paths (up to 60):
${samplePaths}`;
}

/**
 * Generate AI analysis of repository using Gemini AI.
 * Returns safe response object - never throws
 */
export async function generateRepositoryAnalysis(
  metadata: GitHubRepo,
  commits: CommitSummary,
  fileStructure: FileStructure,
  readme: string | null,
  repositoryFiles: RepositoryFileEntry[] = []
): Promise<
  | { success: true; analysis: RepositoryAnalysis }
  | { success: false; error: string }
> {

  const signals = detectProjectSignals(repositoryFiles);
  const languageStats = buildLanguageStats(repositoryFiles);
  const directorySnapshot = repositoryFiles.length > 0
    ? buildDirectorySnapshot(repositoryFiles)
    : `Files: ${fileStructure.Files.join(", ")}\nDirectories: ${fileStructure.Directories.join(", ")}`;

  const totalFiles = repositoryFiles.filter((f) => f.type === "file").length || fileStructure.Files.length;
  const totalDirs  = repositoryFiles.filter((f) => f.type === "dir").length  || fileStructure.Directories.length;

  const commitMessages = commits.recentCommits
    .map((c, i) => `${i + 1}. "${c.message}" — ${c.author} (${c.date.substring(0, 10)})`)
    .join("\n");

  const analysisPrompt = `You are a senior software engineer conducting a thorough code review of a GitHub repository.
You have been given the full file tree, commit history, and project signals. Base your analysis ONLY on the data provided — do NOT invent features or files.

== REPOSITORY IDENTITY ==
Name: ${metadata.name}
Owner: ${metadata.owner}
Description: ${metadata.description || "(not provided)"}
GitHub URL: ${metadata.url}
Primary language (GitHub reported): ${metadata.language}
Stars: ${metadata.stars}

== REPOSITORY SCALE ==
Total files: ${totalFiles}
Total directories: ${totalDirs}
Total commits (last page, up to 50): ${commits.totalCommits}
Average commits per week: ${commits.averageCommitsPerWeek}

== LANGUAGE DISTRIBUTION (from file tree) ==
${languageStats || "(insufficient data)"}

== DIRECTORY & FILE STRUCTURE ==
${directorySnapshot}

== PROJECT SIGNALS ==
Has tests: ${signals.hasTests ? `YES — e.g. ${signals.testFiles.slice(0, 3).join(", ")}` : "NO — no test files found"}
Has documentation: ${signals.hasDocs ? `YES — ${signals.docFiles.join(", ")}` : "NO — no doc files found"}
Has CI/CD: ${signals.hasCI ? "YES" : "NO"}
Has linting/formatting config: ${signals.hasLinting ? "YES" : "NO"}
Has Docker: ${signals.hasDocker ? "YES" : "NO"}
Detected config files: ${signals.configFiles.join(", ") || "none"}

== COMMIT HISTORY (most recent ${commits.recentCommits.length} commits) ==
${commitMessages}

== README (first 3000 chars) ==
${readme ? readme : "(no README found)"}

== TASK ==
Analyze the repository thoroughly. Answer all sections honestly. If something is absent, say it is absent. Do NOT use generic filler like "the project demonstrates good practices" without concrete evidence.

Respond with ONLY a valid JSON object — no markdown, no extra text:
{
  "summary": "2-4 sentences explaining what this repo actually IS, what it does, and what problem it solves. Be specific to this repo.",
  "techStack": ["specific", "libraries", "frameworks", "tools", "detected"],
  "strengths": [
    "Concrete strength with evidence from the file tree or commits",
    "..."
  ],
  "weaknesses": [
    "Concrete missing element or risk, e.g. no test files found",
    "..."
  ],
  "suggestedUseCases": ["realistic use case 1", "use case 2"],
  "keyFindings": "3-5 sentences covering: (1) what the code does structurally, (2) commit quality and activity assessment, (3) biggest gap or risk you found, (4) one specific improvement that would have the highest impact.",
  "commitActivityOverview": "Analysis of commit frequency, message quality, authorship patterns and what they indicate about project health.",
  "timelineInsights": "Is this a new project, mature project, or dormant project? Evidence from commit dates and frequency."
}`;

  try {
    const text = await generateAnalysis(analysisPrompt, 2048);

    // Parse the JSON response - extract JSON from markdown code blocks if present
    let jsonText = text;
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      // Try to find raw JSON
      const rawJsonMatch = text.match(/\{[\s\S]*\}/);
      if (rawJsonMatch) {
        jsonText = rawJsonMatch[0];
      }
    }

    // Sanitize common LLM JSON issues: trailing commas before ] or }
    jsonText = jsonText.replace(/,\s*([\]}])/g, "$1");

    const analysis = JSON.parse(jsonText) as RepositoryAnalysis;

    // Validate and normalize analysis fields to ensure correct types
    // Sometimes LLMs return objects instead of strings for certain fields
    const normalizedAnalysis: RepositoryAnalysis = {
      summary: typeof analysis.summary === 'string' ? analysis.summary : JSON.stringify(analysis.summary),
      techStack: Array.isArray(analysis.techStack) ? analysis.techStack : [],
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
      weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [],
      suggestedUseCases: Array.isArray(analysis.suggestedUseCases) ? analysis.suggestedUseCases : [],
      keyFindings: typeof analysis.keyFindings === 'string' ? analysis.keyFindings : JSON.stringify(analysis.keyFindings),
      commitActivityOverview: typeof analysis.commitActivityOverview === 'string' ? analysis.commitActivityOverview : JSON.stringify(analysis.commitActivityOverview),
      timelineInsights: typeof analysis.timelineInsights === 'string' ? analysis.timelineInsights : JSON.stringify(analysis.timelineInsights),
    };

    return {
      success: true,
      analysis: normalizedAnalysis,
    };
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      success: false,
      error: "AI_SERVICE_ERROR",
    };
  }
}

/**
 * Generate a chat response based on repository analysis using Gemini AI.
 * Returns safe response object - never throws
 */
export async function generateChatResponse(
  userMessage: string,
  repoAnalysis: RepositoryAnalysis,
  metadata: GitHubRepo,
  chatHistory: Array<{ role: "user" | "assistant"; message: string }>
): Promise<
  | { success: true; message: string }
  | { success: false; error: string }
> {
  // Build conversation history context
  const historyContext = chatHistory
    .slice(-6) // Keep last 6 messages for context
    .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.message}`)
    .join("\n");

  const chatPrompt = `You are a helpful code assistant specialized in analyzing and discussing GitHub repositories.
You are helping the user understand the repository: "${metadata.name}" by ${metadata.owner}.

REPOSITORY ANALYSIS CONTEXT:
Summary: ${repoAnalysis.summary}
Tech Stack: ${repoAnalysis.techStack.join(", ")}
Key Findings: ${repoAnalysis.keyFindings}

CONVERSATION HISTORY:
${historyContext}

USER MESSAGE: ${userMessage}

Provide a helpful, concise response that:
1. Directly answers the user's question about this repository
2. Uses the provided analysis context
3. Stays focused on the analyzed repository
4. Avoids making assumptions beyond the provided data

Keep your response to 2-4 sentences maximum unless a longer explanation is necessary.`;

  try {
    const text = await generateChat(chatPrompt, 512);
    return {
      success: true,
      message: text.trim(),
    };
  } catch (error) {
    console.error("AI Chat Error:", error);
    return {
      success: false,
      error: "AI_SERVICE_ERROR",
    };
  }
}
