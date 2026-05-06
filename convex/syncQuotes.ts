import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const ingestResults = mutation({
  args: {
    payload: v.object({
      runStartedAt: v.number(),
      results: v.array(
        v.object({
          targetId: v.id("fetchTargets"),
          status: v.union(
            v.literal("ok"),
            v.literal("error"),
            v.literal("sparse")
          ),
          quotes: v.optional(
            v.array(
              v.object({
                airline: v.string(),
                flightNumber: v.optional(v.string()),
                price: v.number(),
                currency: v.string(),
                departureTime: v.string(),
                arrivalTime: v.string(),
                durationMinutes: v.number(),
                stops: v.number(),
                isBest: v.boolean(),
                rawJson: v.optional(v.any()),
              })
            )
          ),
          error: v.optional(v.string()),
        })
      ),
    }),
  },
  handler: async (ctx, args) => {
    const { runStartedAt, results } = args.payload;
    const now = Date.now();
    let succeeded = 0;
    let failed = 0;

    for (const result of results) {
      // Update fetchTarget status
      const target = await ctx.db.get(result.targetId);
      if (!target) continue;

      await ctx.db.patch(result.targetId, {
        lastFetchedAt: now,
        lastStatus: result.status,
        lastError: result.error,
      });

      if (result.status === "ok" && result.quotes) {
        for (const quote of result.quotes) {
          await ctx.db.insert("quotes", {
            fetchTargetId: result.targetId,
            fetchedAt: now,
            airline: quote.airline,
            flightNumber: quote.flightNumber,
            price: quote.price,
            currency: quote.currency,
            departureTime: quote.departureTime,
            arrivalTime: quote.arrivalTime,
            durationMinutes: quote.durationMinutes,
            stops: quote.stops,
            isBest: quote.isBest,
            rawJson: quote.rawJson,
          });
        }
        succeeded++;
      } else {
        failed++;
      }
    }

    // Insert a run record
    await ctx.db.insert("runs", {
      startedAt: runStartedAt,
      completedAt: now,
      targetsAttempted: results.length,
      targetsSucceeded: succeeded,
      targetsFailed: failed,
      source: "scraper",
    });

    // TODO: Schedule email digest action via Resend integration
    // Example: await ctx.scheduler.runAfter(0, internal.emailDigest.send, { runId });
  },
});
