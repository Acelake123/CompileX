import { query } from "./_generated/server";

export const getPlatformStats = query({
  handler: async (ctx) => {
    const snippets = await ctx.db.query("snippets").collect();
    const repositories = await ctx.db.query("repositories").collect();
    const users = await ctx.db.query("users").collect();

    return {
      totalSnippets: snippets.length,
      totalRepos: repositories.length,
      totalUsers: users.length,
    };
  },
});
