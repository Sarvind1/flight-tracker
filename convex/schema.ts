import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    displayName: v.string(),
    email: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  routes: defineTable({
    userId: v.id("users"),
    name: v.string(),
    origin: v.string(),
    destination: v.string(),
    tripType: v.union(v.literal("one_way"), v.literal("round_trip")),
    windowStartDays: v.number(),
    windowLengthDays: v.number(),
    returnAfterDays: v.optional(v.number()),
    cabin: v.union(
      v.literal("ECONOMY"),
      v.literal("PREMIUM_ECONOMY"),
      v.literal("BUSINESS"),
      v.literal("FIRST")
    ),
    passengers: v.number(),
    active: v.boolean(),
    departureDate: v.optional(v.string()),
    departureTimeMin: v.optional(v.string()),
    departureTimeMax: v.optional(v.string()),
    maxStops: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_active", ["active"]),

  fetchTargets: defineTable({
    signature: v.string(),
    origin: v.string(),
    destination: v.string(),
    departureDate: v.string(),
    returnDate: v.optional(v.string()),
    cabin: v.string(),
    passengers: v.number(),
    tripType: v.string(),
    lastFetchedAt: v.optional(v.number()),
    lastStatus: v.optional(
      v.union(v.literal("ok"), v.literal("error"), v.literal("sparse"))
    ),
    lastError: v.optional(v.string()),
  }).index("by_signature", ["signature"]),

  quotes: defineTable({
    fetchTargetId: v.id("fetchTargets"),
    fetchedAt: v.number(),
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
    .index("by_fetchTarget", ["fetchTargetId"])
    .index("by_fetchTarget_fetchedAt", ["fetchTargetId", "fetchedAt"]),

  runs: defineTable({
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    targetsAttempted: v.number(),
    targetsSucceeded: v.number(),
    targetsFailed: v.number(),
    source: v.string(),
    notes: v.optional(v.string()),
  }),
});
