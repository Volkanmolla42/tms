import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("siteSettings").first();
  },
});

export const update = mutation({
  args: {
    siteName: v.string(),
    slogan: v.string(),
    whatsappNumber: v.string(),
    whatsappDisplay: v.string(),
    phone: v.string(),
    email: v.string(),
    address: v.string(),
    workingHours: v.string(),
    announcement: v.optional(v.string()),
    heroHeadline: v.optional(v.string()),
    heroSubheadline: v.optional(v.string()),
    aiPromptTemplate: v.optional(v.string()),
    aiModel: v.optional(v.string()),
    stats: v.optional(
      v.object({
        productsCount: v.string(),
        brandsCount: v.string(),
        ecuCount: v.string(),
        experienceYears: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("siteSettings").first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("siteSettings", args);
    }
  },
});
