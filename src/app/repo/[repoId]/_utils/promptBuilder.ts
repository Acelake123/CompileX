import { StoredRepoAnalysis } from "@/types/repo-analyzer";

/**
 * Build context-aware AI prompt based on selected file
 * If no file selected: uses full repository context
 * If file selected: uses only that file's code
 */
export function buildAIPrompt(
  userQuery: string,
  repoData: StoredRepoAnalysis,
  selectedFile: string | null
): string {
  const baseContext = `
Repository: ${repoData.metadata.name}
Owner: ${repoData.metadata.owner}
URL: ${repoData.metadata.url}
Description: ${repoData.metadata.description}

Repository Analysis:
- Summary: ${repoData.analysis.summary}
- Tech Stack: ${repoData.analysis.techStack.join(", ")}
- Key Findings: ${repoData.analysis.keyFindings}
- Strengths: ${repoData.analysis.strengths.join(", ")}
`;

  if (selectedFile) {
    // File-specific context
    return `${baseContext}

Selected File: ${selectedFile}

You are analyzing a specific file in the repository. Answer questions ONLY about this file's content and functionality.
Keep responses focused and concise.

User Question: ${userQuery}`;
  } else {
    // Repository-wide context
    return `${baseContext}

Commit Activity: ${repoData.analysis.commitActivityOverview}

You are analyzing the entire repository. Provide insights about the overall project, architecture, and patterns.

User Question: ${userQuery}`;
  }
}
