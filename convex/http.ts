import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// GET /sync/targets — returns active fetch targets for the scraper
http.route({
  path: "/sync/targets",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const token = request.headers.get("Authorization");
    const expected = process.env.SCRAPER_TOKEN;
    if (!expected || token !== `Bearer ${expected}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Refresh fetchTargets (upsert for today's window) then return them
    const targets = await ctx.runMutation(api.fetchTargets.refreshAndList);
    return new Response(JSON.stringify(targets), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// POST /sync/quotes — receive scraper results
http.route({
  path: "/sync/quotes",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const token = request.headers.get("Authorization");
    const expected = process.env.SCRAPER_TOKEN;
    if (!expected || token !== `Bearer ${expected}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    // body = { runStartedAt, results: [{ targetId, status, quotes: [...], error? }] }

    await ctx.runMutation(api.syncQuotes.ingestResults, { payload: body });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
