"use node";

import { action } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { api } from "./_generated/api";

function getGitHubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `token ${token}`;
  }
  return headers;
}

export const fetchAndCacheFileContent = action({
  args: {
    repositoryId: v.id("repositories"),
    owner: v.string(),
    name: v.string(),
    defaultBranch: v.string(),
    path: v.string(),
    sha: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    _id: string;
    repositoryId: string;
    path: string;
    sha: string;
    content: string;
    fetchedAt: number;
  } | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("AUTH_REQUIRED");
    }

    const repo = await ctx.runQuery(api.repositories.getRepository, {
      repositoryId: args.repositoryId,
    });
    if (!repo) {
      throw new ConvexError("NOT_AUTHORIZED");
    }

    const cached = await ctx.runQuery(api.repositories.getCachedFileContent, {
      repositoryId: args.repositoryId,
      path: args.path,
    });
    if (cached) {
      return cached as {
        _id: string;
        repositoryId: string;
        path: string;
        sha: string;
        content: string;
        fetchedAt: number;
      };
    }

    const apiUrl = `https://api.github.com/repos/${args.owner}/${args.name}/contents/${args.path}?ref=${args.defaultBranch}`;
    const response = await fetch(apiUrl, {
      headers: {
        ...getGitHubHeaders(),
        Accept: "application/vnd.github.v3.raw",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const content = await response.text();
    const fileSha = args.sha || "";

    await ctx.runMutation(api.repositories.saveCachedFileContent, {
      repositoryId: args.repositoryId,
      path: args.path,
      sha: fileSha,
      content,
    });

    return await ctx.runQuery(api.repositories.getCachedFileContent, {
      repositoryId: args.repositoryId,
      path: args.path,
    }) as {
      _id: string;
      repositoryId: string;
      path: string;
      sha: string;
      content: string;
      fetchedAt: number;
    } | null;
  },
});
