import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    userId: v.string(), // clerkId
    email: v.string(),
    name: v.string(),
  }).index("by_user_id", ["userId"]),

  codeExecutions: defineTable({
    userId: v.string(),
    language: v.string(),
    code: v.string(),
    output: v.optional(v.string()),
    error: v.optional(v.string()),
  }).index("by_user_id", ["userId"]),

  snippets: defineTable({
    userId: v.string(),
    title: v.string(),
    language: v.string(),
    code: v.string(),
    userName: v.string(), // store user's name for easy access
  }).index("by_user_id", ["userId"]),

  snippetComments: defineTable({
    snippetId: v.id("snippets"),
    userId: v.string(),
    userName: v.string(),
    content: v.string(), // This will store HTML content
  }).index("by_snippet_id", ["snippetId"]),

  stars: defineTable({
    userId: v.string(),
    snippetId: v.id("snippets"),
  })
    .index("by_user_id", ["userId"])
    .index("by_snippet_id", ["snippetId"])
    .index("by_user_id_and_snippet_id", ["userId", "snippetId"]),

  // Repo Analyzer Tables
  repoAnalyses: defineTable({
    userId: v.string(),
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
    analyzedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_id_and_repo", ["userId", "repoUrl"])
    .index("by_repository_id", ["repositoryId"]),

  repositories: defineTable({
    userId: v.string(),
    repoUrl: v.string(),
    owner: v.string(),
    name: v.string(),
    defaultBranch: v.string(),
    description: v.string(),
    stars: v.number(),
    language: v.string(),
    lastSyncedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_id_and_repo", ["userId", "repoUrl"]),

  repositoryFiles: defineTable({
    repositoryId: v.id("repositories"),
    path: v.string(),
    sha: v.string(),
    type: v.union(v.literal("file"), v.literal("dir")),
    size: v.number(),
    language: v.string(),
  })
    .index("by_repository_id", ["repositoryId"])
    .index("by_repository_id_and_path", ["repositoryId", "path"]),

  cachedFileContents: defineTable({
    repositoryId: v.id("repositories"),
    path: v.string(),
    sha: v.string(),
    content: v.string(),
    fetchedAt: v.number(),
  })
    .index("by_repository_id", ["repositoryId"])
    .index("by_repository_id_and_path", ["repositoryId", "path"]),

  repoChatHistory: defineTable({
    repoAnalysisId: v.id("repoAnalyses"),
    userId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    message: v.string(),
    timestamp: v.number(),
    scopeType: v.optional(v.union(v.literal("repo"), v.literal("dir"), v.literal("file"))),
    scopePath: v.optional(v.string()),
    contextFiles: v.optional(v.array(v.string())),
  })
    .index("by_repo_analysis_id", ["repoAnalysisId"])
    .index("by_user_id", ["userId"])
    .index("by_repo_and_user", ["repoAnalysisId", "userId"]),
});
