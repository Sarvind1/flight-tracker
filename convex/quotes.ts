import { query } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { deriveFetchTargets } from "./lib";

export const listByFetchTarget = query({
  args: { fetchTargetId: v.id("fetchTargets") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quotes")
      .withIndex("by_fetchTarget_fetchedAt", (q) =>
        q.eq("fetchTargetId", args.fetchTargetId)
      )
      .order("desc")
      .collect();
  },
});

export const listByRoute = query({
  args: { routeId: v.id("routes") },
  handler: async (ctx, args): Promise<Array<{
    fetchTarget: Doc<"fetchTargets">;
    quotes: Doc<"quotes">[];
  }>> => {
    const route = await ctx.db.get(args.routeId);
    if (!route) throw new Error("Route not found");

    const now = Date.now();
    const targets = deriveFetchTargets(route, now);

    const results: Array<{
      fetchTarget: Doc<"fetchTargets">;
      quotes: Doc<"quotes">[];
    }> = [];

    for (const t of targets) {
      const fetchTarget = await ctx.db
        .query("fetchTargets")
        .withIndex("by_signature", (q) => q.eq("signature", t.signature))
        .first();

      if (!fetchTarget) continue;

      // Get latest quotes for this fetch target (most recent fetch batch)
      const latestQuotes = await ctx.db
        .query("quotes")
        .withIndex("by_fetchTarget_fetchedAt", (q) =>
          q.eq("fetchTargetId", fetchTarget._id)
        )
        .order("desc")
        .take(100);

      if (latestQuotes.length > 0) {
        // Only include quotes from the most recent fetch
        const latestFetchedAt = latestQuotes[0].fetchedAt;
        const batchQuotes = latestQuotes.filter(
          (q) => q.fetchedAt === latestFetchedAt
        );
        results.push({ fetchTarget, quotes: batchQuotes });
      } else {
        results.push({ fetchTarget, quotes: [] });
      }
    }

    return results;
  },
});

export const getHistory = query({
  args: { routeId: v.id("routes") },
  handler: async (ctx, args) => {
    const route = await ctx.db.get(args.routeId);
    if (!route) throw new Error("Route not found");

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 86_400_000;
    const targets = deriveFetchTargets(route, now);

    // Collect all quotes across all fetch targets for this route
    const allQuotes: Array<{ fetchedAt: number; price: number }> = [];

    for (const t of targets) {
      const fetchTarget = await ctx.db
        .query("fetchTargets")
        .withIndex("by_signature", (q) => q.eq("signature", t.signature))
        .first();

      if (!fetchTarget) continue;

      const quotes = await ctx.db
        .query("quotes")
        .withIndex("by_fetchTarget_fetchedAt", (q) =>
          q
            .eq("fetchTargetId", fetchTarget._id)
            .gte("fetchedAt", thirtyDaysAgo)
        )
        .collect();

      for (const q of quotes) {
        allQuotes.push({ fetchedAt: q.fetchedAt, price: q.price });
      }
    }

    // Group by date (YYYY-MM-DD) and find cheapest per day
    const dailyCheapest = new Map<string, number>();
    for (const q of allQuotes) {
      const dateKey = new Date(q.fetchedAt).toISOString().split("T")[0];
      const current = dailyCheapest.get(dateKey);
      if (current === undefined || q.price < current) {
        dailyCheapest.set(dateKey, q.price);
      }
    }

    // Return sorted by date ascending
    return Array.from(dailyCheapest.entries())
      .map(([date, price]) => ({ date, price }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const getLatestRun = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("runs").order("desc").first();
  },
});
