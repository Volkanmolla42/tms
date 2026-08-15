import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // TMS Tables
  shipments: defineTable({
    userId: v.id("users"),
    trackingNumber: v.string(),
    origin: v.string(),
    destination: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("in_transit"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    carrier: v.optional(v.string()),
    weightKg: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_trackingNumber", ["trackingNumber"])
    .index("by_status", ["status"]),

  vehicles: defineTable({
    plateNumber: v.string(),
    model: v.string(),
    capacityKg: v.number(),
    status: v.union(
      v.literal("available"),
      v.literal("on_trip"),
      v.literal("maintenance")
    ),
  }).index("by_status", ["status"]),

  drivers: defineTable({
    userId: v.optional(v.id("users")),
    name: v.string(),
    phone: v.string(),
    licenseNumber: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("on_leave")
    ),
  }).index("by_status", ["status"]),
});
