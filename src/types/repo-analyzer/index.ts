/**
 * GitHub repository metadata
 */
export interface GitHubRepo {
  owner: string;
  name: string;
  url: string;
  description: string;
  stars: number;
  language: string;
  isPrivate: boolean;
  defaultBranch: string;
}

/**
 * Commit summary from GitHub
 */
export interface CommitSummary {
  totalCommits: number;
  recentCommits: Array<{
    message: string;
    author: string;
    date: string;
    hash: string;
  }>;
  averageCommitsPerWeek: number;
}

/**
 * Repository file structure (top-level)
 */
export interface FileStructure {
  Files: string[];
  Directories: string[];
}

/**
 * Full repository file entry (recursive)
 */
export interface RepositoryFileEntry {
  path: string;
  sha: string;
  type: "file" | "dir";
  size: number;
  language: string;
}

/**
 * Cached file content record
 */
export interface CachedFileContent {
  _id?: string; // Id<"cachedFileContents">
  repositoryId: string; // Id<"repositories">
  path: string;
  sha: string;
  content: string;
  fetchedAt: number;
}

/**
 * AI-generated analysis of the repository
 */
export interface RepositoryAnalysis {
  summary: string;
  techStack: string[];
  strengths: string[];
  weaknesses: string[];
  suggestedUseCases: string[];
  keyFindings: string;
  commitActivityOverview: string;
  timelineInsights: string;
}

/**
 * Stored repository analysis in Convex
 */
export interface StoredRepoAnalysis {
  _id: string; // Id<"repoAnalyses">
  _creationTime: number;
  userId: string;
  repoUrl: string;
  repositoryId?: string; // Id<"repositories">
  owner: string;
  repoName: string;
  metadata: GitHubRepo;
  commits: CommitSummary;
  fileStructure: FileStructure;
  analysis: RepositoryAnalysis;
  readme?: string;
  analyzedAt: number;
}

/**
 * Chat message in repo-scoped conversation
 */
export interface RepoChat {
  _id?: string; // Id<"repoChatHistory">
  _creationTime?: number;
  repoAnalysisId: string; // Id<"repoAnalyses">
  userId: string;
  role: "user" | "assistant";
  message: string;
  timestamp: number;
  scopeType?: "repo" | "dir" | "file";
  scopePath?: string;
  contextFiles?: string[];
}

/**
 * Query result for repo analysis
 */
export interface RepoAnalysisResult extends StoredRepoAnalysis {
  messageCount?: number;
}
