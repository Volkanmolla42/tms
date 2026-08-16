import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("brands").withIndex("by_order").take(100);
  },
});

export const getPopular = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("brands")
      .withIndex("by_popular", (q) => q.eq("popular", true))
      .take(50);
  },
});

export const create = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    logoUrl: v.optional(v.string()),
    popular: v.boolean(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("brands", args);
  },
});

export const deleteBrand = mutation({
  args: { id: v.id("brands") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
