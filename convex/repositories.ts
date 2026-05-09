import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

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

export const upsertRepository = mutation({
  args: {
    repoUrl: v.string(),
    owner: v.string(),
    name: v.string(),
    defaultBranch: v.string(),
    description: v.string(),
    stars: v.number(),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("AUTH_REQUIRED");
    }

    const existing = await ctx.db
      .query("repositories")
      .withIndex("by_user_id_and_repo")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), identity.subject),
          q.eq(q.field("repoUrl"), args.repoUrl)
        )
      )
      .first();

    const payload = {
      userId: identity.subject,
      repoUrl: args.repoUrl,
      owner: args.owner,
      name: args.name,
      defaultBranch: args.defaultBranch,
      description: args.description,
      stars: args.stars,
      language: args.language,
      lastSyncedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return await ctx.db.insert("repositories", payload);
  },
});

export const replaceRepositoryFiles = mutation({
  args: {
    repositoryId: v.id("repositories"),
    files: v.array(
      v.object({
        path: v.string(),
        sha: v.string(),
        type: v.union(v.literal("file"), v.literal("dir")),
        size: v.number(),
        language: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("AUTH_REQUIRED");
    }

    const repo = await ctx.db.get(args.repositoryId);
    if (!repo || repo.userId !== identity.subject) {
      throw new ConvexError("NOT_AUTHORIZED");
    }

    const existing = await ctx.db
      .query("repositoryFiles")
      .withIndex("by_repository_id")
      .filter((q) => q.eq(q.field("repositoryId"), args.repositoryId))
      .collect();

    for (const row of existing) {
      await ctx.db.delete(row._id);
    }

    for (const file of args.files) {
      await ctx.db.insert("repositoryFiles", {
        repositoryId: args.repositoryId,
        path: file.path,
        sha: file.sha,
        type: file.type,
        size: file.size,
        language: file.language,
      });
    }
  },
});

export const getRepository = query({
  args: {
    repositoryId: v.id("repositories"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const repo = await ctx.db.get(args.repositoryId);
    if (!repo || repo.userId !== identity.subject) {
      return null;
    }

    return repo;
  },
});

export const listRepositoryFiles = query({
  args: {
    repositoryId: v.id("repositories"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const repo = await ctx.db.get(args.repositoryId);
    if (!repo || repo.userId !== identity.subject) {
      return [];
    }

    return await ctx.db
      .query("repositoryFiles")
      .withIndex("by_repository_id")
      .filter((q) => q.eq(q.field("repositoryId"), args.repositoryId))
      .collect();
  },
});

export const getCachedFileContent = query({
  args: {
    repositoryId: v.id("repositories"),
    path: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const repo = await ctx.db.get(args.repositoryId);
    if (!repo || repo.userId !== identity.subject) {
      return null;
    }

    return await ctx.db
      .query("cachedFileContents")
      .withIndex("by_repository_id_and_path")
      .filter((q) =>
        q.and(
          q.eq(q.field("repositoryId"), args.repositoryId),
          q.eq(q.field("path"), args.path)
        )
      )
      .first();
  },
});

export const listCachedFileContents = query({
  args: {
    repositoryId: v.id("repositories"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const repo = await ctx.db.get(args.repositoryId);
    if (!repo || repo.userId !== identity.subject) {
      return [];
    }

    return await ctx.db
      .query("cachedFileContents")
      .withIndex("by_repository_id")
      .filter((q) => q.eq(q.field("repositoryId"), args.repositoryId))
      .collect();
  },
});

export const saveCachedFileContent = mutation({
  args: {
    repositoryId: v.id("repositories"),
    path: v.string(),
    sha: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("AUTH_REQUIRED");
    }

    const repo = await ctx.db.get(args.repositoryId);
    if (!repo || repo.userId !== identity.subject) {
      throw new ConvexError("NOT_AUTHORIZED");
    }

    const existing = await ctx.db
      .query("cachedFileContents")
      .withIndex("by_repository_id_and_path")
      .filter((q) =>
        q.and(
          q.eq(q.field("repositoryId"), args.repositoryId),
          q.eq(q.field("path"), args.path)
        )
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        sha: args.sha,
        content: args.content,
        fetchedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("cachedFileContents", {
      repositoryId: args.repositoryId,
      path: args.path,
      sha: args.sha,
      content: args.content,
      fetchedAt: Date.now(),
    });
  },
});

export const resolveFileMetadata = query({
  args: {
    repositoryId: v.id("repositories"),
    path: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const repo = await ctx.db.get(args.repositoryId);
    if (!repo || repo.userId !== identity.subject) {
      return null;
    }

    return await ctx.db
      .query("repositoryFiles")
      .withIndex("by_repository_id_and_path")
      .filter((q) =>
        q.and(
          q.eq(q.field("repositoryId"), args.repositoryId),
          q.eq(q.field("path"), args.path)
        )
      )
      .first();
  },
});

export const detectLanguage = action({
  args: {
    path: v.string(),
  },
  handler: async (_ctx, args) => {
    return detectLanguageFromPath(args.path);
  },
});
