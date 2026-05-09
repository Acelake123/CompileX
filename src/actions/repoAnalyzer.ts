"use server";

import { GitHubRepo, CommitSummary, FileStructure, RepositoryFileEntry } from "@/types/repo-analyzer";

function detectLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    java: "java",
    rb: "ruby",
    go: "go",
    rs: "rust",
    cpp: "cpp",
    c: "c",
    cs: "csharp",
    php: "php",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    html: "html",
    css: "css",
    md: "markdown",
    txt: "plaintext",
    sh: "shell",
  };
  return map[ext] || "plaintext";
}

/**
 * Parse GitHub repository URL and extract owner and repo name
 */
export async function parseGitHubUrl(url: string): Promise<{ owner: string; repo: string } | null> {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split("/").filter(Boolean);

    if (parts.length < 2) {
      return null;
    }

    return {
      owner: parts[0],
      repo: parts[1].replace(".git", ""),
    };
  } catch {
    return null;
  }
}

/**
 * Fetch repository metadata from GitHub API
 */
export async function fetchRepositoryMetadata(
  owner: string,
  repo: string
): Promise<GitHubRepo> {
  const token = process.env.GITHUB_TOKEN;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };

  if (token) {
    headers.Authorization = `token ${token}`;
  }

  const response = await fetch(apiUrl, { headers });

  if (!response.ok) {
    if (response.status === 404 || response.status === 403) {
      throw new Error("PRIVATE_REPO");
    }
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json() as Record<string, unknown>;
  const ownerData = data.owner as Record<string, unknown> | undefined;
  const ownerLogin = ownerData && typeof ownerData.login === 'string' ? ownerData.login : owner;

  return {
    owner: ownerLogin,
    name: typeof data.name === 'string' ? data.name : '',
    url: typeof data.html_url === 'string' ? data.html_url : '',
    description: typeof data.description === 'string' ? data.description : '',
    stars: typeof data.stargazers_count === 'number' ? data.stargazers_count : 0,
    language: typeof data.language === 'string' ? data.language : 'Unknown',
    isPrivate: typeof data.private === 'boolean' ? data.private : false,
    defaultBranch: typeof data.default_branch === 'string' ? data.default_branch : 'main',
  };
}

/**
 * Fetch recent commits from a repository
 */
export async function fetchRecentCommits(
  owner: string,
  repo: string
): Promise<CommitSummary> {
  const token = process.env.GITHUB_TOKEN;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits`;

  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };

  if (token) {
    headers.Authorization = `token ${token}`;
  }

  // Fetch last 50 commits
  const url = new URL(apiUrl);
  url.searchParams.set("per_page", "50");

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    if (response.status === 404 || response.status === 403) {
      throw new Error("PRIVATE_REPO");
    }
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`
    );
  }

  const commits = await response.json() as Array<Record<string, unknown>>;

  const recentCommits = commits.slice(0, 50).map((commit) => {
    const commitData = commit.commit as Record<string, unknown>;
    const commitMessage = commitData.message as string || '';
    const authorData = commitData.author as Record<string, unknown> || {};
    return {
      message: commitMessage.split("\n")[0],
      author: typeof authorData.name === 'string' ? authorData.name : "Unknown",
      date: typeof authorData.date === 'string' ? authorData.date : new Date().toISOString(),
      hash: (typeof commit.sha === 'string' ? commit.sha : '').substring(0, 7),
    };
  });

  // Calculate average commits per week (rough estimate from last 50 commits)
  let averageCommitsPerWeek = 0;
  if (commits.length > 0) {
    const oldestCommitData = commits[commits.length - 1].commit as Record<string, unknown>;
    const oldestAuthorData = oldestCommitData.author as Record<string, unknown> || {};
    const oldestCommitDate = new Date(oldestAuthorData.date as string).getTime();
    
    const newestCommitData = commits[0].commit as Record<string, unknown>;
    const newestAuthorData = newestCommitData.author as Record<string, unknown> || {};
    const newestCommitDate = new Date(newestAuthorData.date as string).getTime();
    
    const weeksSpanned = (newestCommitDate - oldestCommitDate) / (7 * 24 * 60 * 60 * 1000);
    averageCommitsPerWeek =
      weeksSpanned > 0 ? (commits.length / weeksSpanned) : commits.length;
  }

  return {
    totalCommits: commits.length,
    recentCommits,
    averageCommitsPerWeek: Math.round(averageCommitsPerWeek * 100) / 100,
  };
}

/**
 * Fetch top-level file structure from repository
 */
export async function fetchFileStructure(
  owner: string,
  repo: string
): Promise<FileStructure> {
  const token = process.env.GITHUB_TOKEN;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;

  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };

  if (token) {
    headers.Authorization = `token ${token}`;
  }

  const response = await fetch(apiUrl, { headers });

  if (!response.ok) {
    if (response.status === 404 || response.status === 403) {
      throw new Error("PRIVATE_REPO");
    }
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`
    );
  }

  const contents = await response.json() as Array<Record<string, unknown>>;

  const files: string[] = [];
  const directories: string[] = [];

  (contents || []).forEach((item) => {
    if (item.type === "file") {
      files.push(typeof item.name === 'string' ? item.name : '');
    } else if (item.type === "dir") {
      directories.push(typeof item.name === 'string' ? item.name : '');
    }
  });

  return { Files: files, Directories: directories };
}

/**
 * Fetch full repository tree (recursive)
 */
export async function fetchRepositoryTree(
  owner: string,
  repo: string,
  defaultBranch: string
): Promise<RepositoryFileEntry[]> {
  const token = process.env.GITHUB_TOKEN;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}`;

  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };

  if (token) {
    headers.Authorization = `token ${token}`;
  }

  const url = new URL(apiUrl);
  url.searchParams.set("recursive", "1");

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    if (response.status === 404 || response.status === 403) {
      throw new Error("PRIVATE_REPO");
    }
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json() as {
    tree?: Array<{ path?: string; sha?: string; type?: string; size?: number }>;
  };

  const tree = data.tree || [];

  return tree
    .filter((node) => node.path && node.sha && node.type)
    .map((node) => {
      const path = node.path as string;
      const type = node.type === "tree" ? "dir" : "file";
      return {
        path,
        sha: node.sha as string,
        type,
        size: typeof node.size === "number" ? node.size : 0,
        language: type === "file" ? detectLanguageFromPath(path) : "directory",
      } as RepositoryFileEntry;
    });
}

/**
 * Fetch README file content (trimmed)
 */
export async function fetchReadme(
  owner: string,
  repo: string
): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;

  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3.raw",
  };

  if (token) {
    headers.Authorization = `token ${token}`;
  }

  try {
    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
      return null;
    }

    let content = await response.text();

    // Trim large README files (keep first 3000 chars)
    if (content.length > 3000) {
      content = content.substring(0, 3000) + "\n... (truncated)";
    }

    return content;
  } catch {
    return null;
  }
}

/**
 * Fetch and compile all repository data
 * Returns safe response object - never throws
 */
export async function analyzeGitHubRepository(
  repoUrl: string
): Promise<
  | {
      success: true;
      metadata: GitHubRepo;
      commits: CommitSummary;
      fileStructure: FileStructure;
      readme: string | null;
    }
  | { success: false; error: string }
> {
  // Parse URL
  const parsed = await parseGitHubUrl(repoUrl);
  if (!parsed) {
    return {
      success: false,
      error: "INVALID_URL",
    };
  }

  const { owner, repo } = parsed;

  try {
    // Fetch all data in parallel
    const [metadata, commits, fileStructure, readme] = await Promise.all([
      fetchRepositoryMetadata(owner, repo),
      fetchRecentCommits(owner, repo),
      fetchFileStructure(owner, repo),
      fetchReadme(owner, repo),
    ]);

    return {
      success: true,
      metadata,
      commits,
      fileStructure,
      readme,
    };
  } catch (error) {
    console.error("Repository Analysis Error:", error);

    // Extract specific error from error message
    if (error instanceof Error) {
      if (error.message.includes("PRIVATE_REPO")) {
        return { success: false, error: "PRIVATE_REPO" };
      }
    }

    return {
      success: false,
      error: "FETCH_FAILED",
    };
  }
}
