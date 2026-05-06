import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreate = mutation({
  args: {
    displayName: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Look for existing user by email (indexed)
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("users", {
      displayName: args.displayName,
      email: args.email,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const get = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
