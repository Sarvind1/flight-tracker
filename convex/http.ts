import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

// OPTIONS preflight for /sync/targets
http.route({
  path: "/sync/targets",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

// GET /sync/targets — returns active fetch targets
http.route({
  path: "/sync/targets",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const token = request.headers.get("Authorization");
    const expected = process.env.SCRAPER_TOKEN;
    if (!expected || token !== `Bearer ${expected}`) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const targets = await ctx.runMutation(api.fetchTargets.refreshAndList);
    return new Response(JSON.stringify(targets), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

// OPTIONS preflight for /sync/stale-targets
http.route({
  path: "/sync/stale-targets",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

// GET /sync/stale-targets — returns only stale fetch targets
http.route({
  path: "/sync/stale-targets",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const token = request.headers.get("Authorization");
    const expected = process.env.SCRAPER_TOKEN;
    if (!expected || token !== `Bearer ${expected}`) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const targets = await ctx.runMutation(api.fetchTargets.refreshAndListStale);
    return new Response(JSON.stringify(targets), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

// OPTIONS preflight for /sync/quotes
http.route({
  path: "/sync/quotes",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
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
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const body = await request.json();
    await ctx.runMutation(api.syncQuotes.ingestResults, { payload: body });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

export default http;
