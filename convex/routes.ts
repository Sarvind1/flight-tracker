import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { deriveFetchTargets } from "./lib";

export const list = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    if (args.userId) {
      return await ctx.db
        .query("routes")
        .withIndex("by_user", (q) => q.eq("userId", args.userId!))
        .collect();
    }
    return await ctx.db.query("routes").collect();
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("routes")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("routes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

const cabinValidator = v.union(
  v.literal("ECONOMY"),
  v.literal("PREMIUM_ECONOMY"),
  v.literal("BUSINESS"),
  v.literal("FIRST")
);

const tripTypeValidator = v.union(
  v.literal("one_way"),
  v.literal("round_trip")
);

export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    origin: v.string(),
    destination: v.string(),
    tripType: tripTypeValidator,
    windowStartDays: v.number(),
    windowLengthDays: v.number(),
    returnAfterDays: v.optional(v.number()),
    cabin: cabinValidator,
    passengers: v.number(),
    departureDate: v.optional(v.string()),
    departureTimeMin: v.optional(v.string()),
    departureTimeMax: v.optional(v.string()),
    maxStops: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const routeId = await ctx.db.insert("routes", {
      ...args,
      active: true,
    });

    // Derive and upsert fetch targets
    const now = Date.now();
    const targets = deriveFetchTargets(args, now);

    for (const target of targets) {
      const existing = await ctx.db
        .query("fetchTargets")
        .withIndex("by_signature", (q) => q.eq("signature", target.signature))
        .first();

      if (!existing) {
        await ctx.db.insert("fetchTargets", target);
      }
    }

    return routeId;
  },
});

export const update = mutation({
  args: {
    id: v.id("routes"),
    name: v.optional(v.string()),
    origin: v.optional(v.string()),
    destination: v.optional(v.string()),
    tripType: v.optional(tripTypeValidator),
    windowStartDays: v.optional(v.number()),
    windowLengthDays: v.optional(v.number()),
    returnAfterDays: v.optional(v.number()),
    cabin: v.optional(cabinValidator),
    passengers: v.optional(v.number()),
    departureDate: v.optional(v.string()),
    departureTimeMin: v.optional(v.string()),
    departureTimeMax: v.optional(v.string()),
    maxStops: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Route not found");

    // Filter out undefined values
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        patch[key] = value;
      }
    }

    await ctx.db.patch(id, patch);

    // Recompute fetch targets with the merged route data
    const merged = { ...existing, ...patch };
    const now = Date.now();
    const targets = deriveFetchTargets(
      merged as Parameters<typeof deriveFetchTargets>[0],
      now
    );

    for (const target of targets) {
      const found = await ctx.db
        .query("fetchTargets")
        .withIndex("by_signature", (q) => q.eq("signature", target.signature))
        .first();

      if (!found) {
        await ctx.db.insert("fetchTargets", target);
      }
    }
  },
});

export const remove = mutation({
  args: { id: v.id("routes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const toggleActive = mutation({
  args: { id: v.id("routes") },
  handler: async (ctx, args) => {
    const route = await ctx.db.get(args.id);
    if (!route) throw new Error("Route not found");
    await ctx.db.patch(args.id, { active: !route.active });
    return !route.active;
  },
});
