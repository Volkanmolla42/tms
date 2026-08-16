import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("siteSettings").first();
    if (!settings) {
      return {
        siteName: "TMS İTHALAT",
        slogan: "Türkiye'nin Oto Elektronik Parça Merkezi",
        whatsappNumber: "+905340653222",
        whatsappDisplay: "+90 534 065 32 22",
        phone: "+90 534 065 32 22",
        email: "info@tmsithalat.com",
        address: "Fevzipaşa Mh. 10121 Sk. No: 2 Karatay / KONYA",
        workingHours: "Pzt - Cmt: 08:30 - 19:00",
        announcement: "Türkiye'nin her yerine aynı gün hızlı kargo imkanı!",
        heroHeadline: "Türkiye'nin Oto Elektronik Parça Merkezi",
        heroSubheadline: "ECU, ABS, Airbag, BCM, BSI, UCH ve binlerce orijinal elektronik modül.",
        stats: {
          productsCount: "15.000+",
          brandsCount: "45+",
          ecuCount: "1000+",
          experienceYears: "20+",
        },
      };
    }
    return settings;
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
    heroHeadline: v.string(),
    heroSubheadline: v.string(),
    stats: v.object({
      productsCount: v.string(),
      brandsCount: v.string(),
      ecuCount: v.string(),
      experienceYears: v.string(),
    }),
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
