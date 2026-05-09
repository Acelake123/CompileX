import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

/**
 * Save repository analysis to database
 */
export const saveRepoAnalysis = mutation({
  args: {
    repoUrl: v.string(),
    repositoryId: v.optional(v.id("repositories")),
    owner: v.string(),
    repoName: v.string(),
    metadata: v.object({
      owner: v.string(),
      name: v.string(),
      url: v.string(),
      description: v.string(),
      stars: v.number(),
      language: v.string(),
      isPrivate: v.boolean(),
      defaultBranch: v.string(),
    }),
    commits: v.object({
      totalCommits: v.number(),
      recentCommits: v.array(
        v.object({
          message: v.string(),
          author: v.string(),
          date: v.string(),
          hash: v.string(),
        })
      ),
      averageCommitsPerWeek: v.number(),
    }),
    fileStructure: v.object({
      Files: v.array(v.string()),
      Directories: v.array(v.string()),
    }),
    analysis: v.object({
      summary: v.string(),
      techStack: v.array(v.string()),
      strengths: v.array(v.string()),
      weaknesses: v.array(v.string()),
      suggestedUseCases: v.array(v.string()),
      keyFindings: v.string(),
      commitActivityOverview: v.string(),
      timelineInsights: v.string(),
    }),
    readme: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("AUTH_REQUIRED");
    }

    // Check if user already analyzed this repo
    const existing = await ctx.db
      .query("repoAnalyses")
      .withIndex("by_user_id_and_repo")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), identity.subject),
          q.eq(q.field("repoUrl"), args.repoUrl)
        )
      )
      .first();

    if (existing) {
      // Update existing analysis
      await ctx.db.patch(existing._id, {
        repositoryId: args.repositoryId,
        metadata: args.metadata,
        commits: args.commits,
        fileStructure: args.fileStructure,
        analysis: args.analysis,
        readme: args.readme,
        analyzedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new analysis
    return await ctx.db.insert("repoAnalyses", {
      userId: identity.subject,
      repoUrl: args.repoUrl,
      repositoryId: args.repositoryId,
      owner: args.owner,
      repoName: args.repoName,
      metadata: args.metadata,
      commits: args.commits,
      fileStructure: args.fileStructure,
      analysis: args.analysis,
      readme: args.readme,
      analyzedAt: Date.now(),
    });
  },
});

/**
 * Get repository analysis by ID
 */
export const getRepoAnalysis = query({
  args: {
    repoAnalysisId: v.id("repoAnalyses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const analysis = await ctx.db.get(args.repoAnalysisId);
    if (!analysis || analysis.userId !== identity.subject) {
      return null;
    }

    return analysis;
  },
});

/**
 * Get all analyses for current user
 */
export const getUserRepoAnalyses = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    return await ctx.db
      .query("repoAnalyses")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .collect();
  },
});

/**
 * Get or find existing analysis for a repo URL
 */
export const findRepoAnalysis = mutation({
  args: {
    repoUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("repoAnalyses")
      .withIndex("by_user_id_and_repo")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), identity.subject),
          q.eq(q.field("repoUrl"), args.repoUrl)
        )
      )
      .first();
  },
});

/**
 * Delete repository analysis
 */
export const deleteRepoAnalysis = mutation({
  args: {
    repoAnalysisId: v.id("repoAnalyses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("AUTH_REQUIRED");
    }

    const analysis = await ctx.db.get(args.repoAnalysisId);
    if (!analysis || analysis.userId !== identity.subject) {
      throw new ConvexError("NOT_AUTHORIZED");
    }

    // Delete all chat messages for this analysis
    const messages = await ctx.db
      .query("repoChatHistory")
      .withIndex("by_repo_analysis_id")
      .filter((q) => q.eq(q.field("repoAnalysisId"), args.repoAnalysisId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    await ctx.db.delete(args.repoAnalysisId);
  },
});

/**
 * Add chat message to repository analysis conversation
 */
export const addChatMessage = mutation({
  args: {
    repoAnalysisId: v.id("repoAnalyses"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    message: v.string(),
    scopeType: v.optional(v.union(v.literal("repo"), v.literal("dir"), v.literal("file"))),
    scopePath: v.optional(v.string()),
    contextFiles: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("AUTH_REQUIRED");
    }

    const analysis = await ctx.db.get(args.repoAnalysisId);
    if (!analysis || analysis.userId !== identity.subject) {
      throw new ConvexError("NOT_AUTHORIZED");
    }

    return await ctx.db.insert("repoChatHistory", {
      repoAnalysisId: args.repoAnalysisId,
      userId: identity.subject,
      role: args.role,
      message: args.message,
      timestamp: Date.now(),
      scopeType: args.scopeType,
      scopePath: args.scopePath,
      contextFiles: args.contextFiles,
    });
  },
});

/**
 * Get chat history for a repository analysis
 */
export const getChatHistory = query({
  args: {
    repoAnalysisId: v.id("repoAnalyses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const analysis = await ctx.db.get(args.repoAnalysisId);
    if (!analysis || analysis.userId !== identity.subject) {
      return [];
    }

    return await ctx.db
      .query("repoChatHistory")
      .withIndex("by_repo_analysis_id")
      .filter((q) => q.eq(q.field("repoAnalysisId"), args.repoAnalysisId))
      .collect();
  },
});

/**
 * Clear chat history for a repository analysis
 */
export const clearChatHistory = mutation({
  args: {
    repoAnalysisId: v.id("repoAnalyses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("AUTH_REQUIRED");
    }

    const analysis = await ctx.db.get(args.repoAnalysisId);
    if (!analysis || analysis.userId !== identity.subject) {
      throw new ConvexError("NOT_AUTHORIZED");
    }

    const messages = await ctx.db
      .query("repoChatHistory")
      .withIndex("by_repo_analysis_id")
      .filter((q) => q.eq(q.field("repoAnalysisId"), args.repoAnalysisId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
  },
});
