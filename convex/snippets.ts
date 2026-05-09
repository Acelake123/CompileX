import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

export const createSnippet = mutation({
  args: {
    title: v.string(),
    language: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("AUTH_REQUIRED");
    }

    // Try to find user
    let user = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .first();

    // 👇 AUTO-CREATE USER IF NOT FOUND
    if (!user) {
      const userId = await ctx.db.insert("users", {
        userId: identity.subject,
        name: identity.name ?? "Anonymous",
        email: identity.email ?? "",
      });

      user = await ctx.db.get(userId);
    }

    return await ctx.db.insert("snippets", {
      userId: identity.subject,
      userName: user!.name,
      title: args.title,
      language: args.language,
      code: args.code,
    });
  },
});


export const deleteSnippet = mutation({
  args: {
    snippetId: v.id("snippets"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("AUTH_REQUIRED");
    }

    const snippet = await ctx.db.get(args.snippetId);
    if (!snippet) {
      throw new ConvexError("SNIPPET_NOT_FOUND");
    }

    if (snippet.userId !== identity.subject) {
      throw new ConvexError("NOT_AUTHORIZED");
    }

    const comments = await ctx.db
      .query("snippetComments")
      .withIndex("by_snippet_id")
      .filter((q) => q.eq(q.field("snippetId"), args.snippetId))
      .collect();

    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    const stars = await ctx.db
      .query("stars")
      .withIndex("by_snippet_id")
      .filter((q) => q.eq(q.field("snippetId"), args.snippetId))
      .collect();

    for (const star of stars) {
      await ctx.db.delete(star._id);
    }

    await ctx.db.delete(args.snippetId);
  },
});

export const starSnippet = mutation({
  args: {
    snippetId: v.id("snippets"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("AUTH_REQUIRED");
    }

    // 🔑 IMPORTANT: check star ONLY for this user + this snippet
    const existing = await ctx.db
      .query("stars")
      .withIndex("by_user_id_and_snippet_id", (q) =>
        q.eq("userId", identity.subject).eq("snippetId", args.snippetId)
      )
      .first();

    if (existing) {
      // ❌ Remove ONLY this user's star
      await ctx.db.delete(existing._id);
    } else {
      // ✅ Add star for THIS user
      await ctx.db.insert("stars", {
        userId: identity.subject,
        snippetId: args.snippetId,
      });
    }
  },
});


export const addComment = mutation({
  args: {
    snippetId: v.id("snippets"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("AUTH_REQUIRED");
    }

    // Try to find user
    let user = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .first();

    // 👇 AUTO-CREATE USER IF NOT FOUND
    if (!user) {
      const userId = await ctx.db.insert("users", {
        userId: identity.subject,
        name: identity.name ?? "Anonymous",
        email: identity.email ?? "",
      });

      user = await ctx.db.get(userId);
    }

    return await ctx.db.insert("snippetComments", {
      snippetId: args.snippetId,
      userId: identity.subject,
      userName: user!.name,
      content: args.content,
    });
  },
});


export const deleteComment = mutation({
  args: { commentId: v.id("snippetComments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false, error: "NOT_AUTHENTICATED" };
    }

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      return { success: false, error: "NOT_FOUND" };
    }

    if (comment.userId !== identity.subject) {
      return { success: false, error: "UNAUTHORIZED" };
    }

    await ctx.db.delete(args.commentId);
    return { success: true };
  },
});

export const getSnippets = query({
  handler: async (ctx) => {
    return await ctx.db.query("snippets").order("desc").collect();
  },
});

export const getSnippetById = query({
  args: { snippetId: v.id("snippets") },
  handler: async (ctx, args) => {
    const snippet = await ctx.db.get(args.snippetId);
    if (!snippet) {
      throw new ConvexError("SNIPPET_NOT_FOUND");
    }
    return snippet;
  },
});

export const getComments = query({
  args: { snippetId: v.id("snippets") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("snippetComments")
      .withIndex("by_snippet_id")
      .filter((q) => q.eq(q.field("snippetId"), args.snippetId))
      .order("desc")
      .collect();
  },
});

export const isSnippetStarred = query({
  args: {
    snippetId: v.id("snippets"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const star = await ctx.db
      .query("stars")
      .withIndex("by_user_id_and_snippet_id", (q) =>
        q.eq("userId", identity.subject).eq("snippetId", args.snippetId)
      )
      .first();

    return !!star;
  },
});





export const getSnippetStarCount = query({
  args: { snippetId: v.id("snippets") },
  handler: async (ctx, args) => {
    const stars = await ctx.db
      .query("stars")
      .withIndex("by_snippet_id")
      .filter((q) => q.eq(q.field("snippetId"), args.snippetId))
      .collect();

    return stars.length;
  },
});

export const getStarredSnippets = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const stars = await ctx.db
      .query("stars")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .collect();

    const snippets = await Promise.all(
      stars.map((star) => ctx.db.get(star.snippetId))
    );

    return snippets.filter(Boolean);
  },
});
