"use node";
import { internalAction } from "../_generated/server";
import { api } from "../_generated/api";

// This action is called after the scraper posts new quotes.
// It sends a daily digest email to each user with active routes.
export const sendDailyDigest = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get all users
    const users = await ctx.runQuery(api.users.list);

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not set, skipping email digest");
      return;
    }

    for (const user of users) {
      // Get active routes for this user
      const routes = await ctx.runQuery(api.routes.list, { userId: user._id });
      const activeRoutes = routes.filter((r: any) => r.active);

      if (activeRoutes.length === 0) continue;

      // Build email body
      let html = `<h2>Good morning, ${user.displayName}!</h2>`;
      html += `<p>Here's your daily flight price digest:</p>`;

      for (const route of activeRoutes) {
        html += `<h3>${route.origin} &rarr; ${route.destination} &mdash; ${route.name}</h3>`;
        html += `<p>${route.tripType === "round_trip" ? "Round trip" : "One way"} &middot; ${route.cabin.toLowerCase()} &middot; ${route.passengers} pax</p>`;

        // Get latest quotes for this route
        const routeQuotes = await ctx.runQuery(api.quotes.listByRoute, { routeId: route._id });

        for (const rq of routeQuotes) {
          if (rq.quotes.length === 0) continue;
          const ft = rq.fetchTarget as any;
          html += `<h4>${ft.departureDate}</h4>`;
          html += `<table style="border-collapse:collapse;width:100%;font-family:monospace;font-size:13px;">`;
          html += `<tr style="background:#f5f5f5;"><th style="padding:6px 10px;text-align:left;">Airline</th><th style="padding:6px 10px;text-align:left;">Stops</th><th style="padding:6px 10px;text-align:right;">Price</th></tr>`;

          const sorted = [...rq.quotes].sort((a: any, b: any) => a.price - b.price);
          for (const q of sorted.slice(0, 5) as any[]) {
            html += `<tr><td style="padding:4px 10px;">${q.airline}</td><td style="padding:4px 10px;">${q.stops === 0 ? "nonstop" : q.stops + " stop"}</td><td style="padding:4px 10px;text-align:right;font-weight:bold;">$${q.price}</td></tr>`;
          }
          html += `</table>`;
        }
      }

      html += `<hr style="margin:20px 0;border:none;border-top:1px solid #eee;">`;
      html += `<p style="font-size:11px;color:#999;">Prices via Google Flights &mdash; Southwest and some LCCs not included.</p>`;

      // Send via Resend
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "ftrack <onboarding@resend.dev>",
            to: [user.email],
            subject: `ftrack digest — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
            html,
          }),
        });

        if (!res.ok) {
          console.error(`Failed to send to ${user.email}: ${res.status} ${await res.text()}`);
        } else {
          console.log(`Sent digest to ${user.email}`);
        }
      } catch (err) {
        console.error(`Error sending to ${user.email}:`, err);
      }
    }
  },
});
