import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    status: v.optional(v.string()),
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let items;
    if (args.status) {
      items = await ctx.db
        .query("inquiries")
        .withIndex("by_status", (b) => b.eq("status", args.status!))
        .order("desc")
        .take(args.limit ?? 100);
    } else {
      items = await ctx.db
        .query("inquiries")
        .order("desc")
        .take(args.limit ?? 100);
    }

    if (args.type) {
      return items.filter((i) => i.type === args.type);
    }
    return items;
  },
});

export const create = mutation({
  args: {
    productId: v.optional(v.id("products")),
    productTitle: v.optional(v.string()),
    oemNumber: v.optional(v.string()),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    vehicleInfo: v.optional(v.string()),
    message: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("inquiries", {
      ...args,
      status: "new",
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("inquiries"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const deleteInquiry = mutation({
  args: { id: v.id("inquiries") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
