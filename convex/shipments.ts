import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    return await ctx.db
      .query("shipments")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(100);
  },
});

export const create = mutation({
  args: {
    trackingNumber: v.string(),
    origin: v.string(),
    destination: v.string(),
    carrier: v.optional(v.string()),
    weightKg: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const now = Date.now();
    return await ctx.db.insert("shipments", {
      userId,
      trackingNumber: args.trackingNumber,
      origin: args.origin,
      destination: args.destination,
      status: "pending",
      carrier: args.carrier,
      weightKg: args.weightKg,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });
  },
});
