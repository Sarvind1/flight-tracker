import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { deriveFetchTargets } from "./lib";

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    // Get all active routes
    const activeRoutes = await ctx.db
      .query("routes")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();

    // Collect unique signatures across all active routes
    const now = Date.now();
    const signatureSet = new Set<string>();
    for (const route of activeRoutes) {
      const targets = deriveFetchTargets(route, now);
      for (const t of targets) {
        signatureSet.add(t.signature);
      }
    }

    // Look up each signature in the fetchTargets table
    const results = [];
    for (const sig of signatureSet) {
      const target = await ctx.db
        .query("fetchTargets")
        .withIndex("by_signature", (q) => q.eq("signature", sig))
        .first();
      if (target) {
        results.push(target);
      }
    }

    return results;
  },
});

/**
 * Called by the scraper before each run. Upserts fetchTargets for all active
 * routes (so new days are created and signatures stay fresh), then returns them.
 */
export const refreshAndList = mutation({
  args: {},
  handler: async (ctx): Promise<Doc<"fetchTargets">[]> => {
    const activeRoutes = await ctx.db
      .query("routes")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();

    const now = Date.now();
    const seen = new Map<string, Doc<"fetchTargets">>();

    for (const route of activeRoutes) {
      const derived = deriveFetchTargets(route, now);
      for (const t of derived) {
        if (seen.has(t.signature)) continue;

        let existing = await ctx.db
          .query("fetchTargets")
          .withIndex("by_signature", (q) => q.eq("signature", t.signature))
          .first();

        if (!existing) {
          const id = await ctx.db.insert("fetchTargets", t);
          existing = (await ctx.db.get(id))!;
        }

        seen.set(t.signature, existing);
      }
    }

    return Array.from(seen.values());
  },
});

/**
 * Like refreshAndList, but only returns targets that are stale
 * (never fetched, or lastFetchedAt > 24h ago).
 * This is what the extension calls on startup to do smart catch-up.
 */
export const refreshAndListStale = mutation({
  args: {},
  handler: async (ctx): Promise<Doc<"fetchTargets">[]> => {
    const activeRoutes = await ctx.db
      .query("routes")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();

    const now = Date.now();
    const staleThreshold = now - 24 * 60 * 60 * 1000; // 24 hours ago
    const seen = new Map<string, Doc<"fetchTargets">>();

    for (const route of activeRoutes) {
      const derived = deriveFetchTargets(route, now);
      for (const t of derived) {
        if (seen.has(t.signature)) continue;

        let existing = await ctx.db
          .query("fetchTargets")
          .withIndex("by_signature", (q) => q.eq("signature", t.signature))
          .first();

        if (!existing) {
          const id = await ctx.db.insert("fetchTargets", t);
          existing = (await ctx.db.get(id))!;
        }

        // Only include if stale: never fetched OR fetched more than 24h ago
        if (!existing.lastFetchedAt || existing.lastFetchedAt < staleThreshold) {
          seen.set(t.signature, existing);
        }
      }
    }

    return Array.from(seen.values());
  },
});

export const getBySignature = query({
  args: { signature: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("fetchTargets")
      .withIndex("by_signature", (q) => q.eq("signature", args.signature))
      .first();
  },
});
