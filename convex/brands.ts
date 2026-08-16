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
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("brands", {
      ...args,
      isActive: args.isActive ?? true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("brands"),
    name: v.string(),
    slug: v.string(),
    logoUrl: v.optional(v.string()),
    popular: v.boolean(),
    order: v.number(),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, {
      ...data,
      isActive: data.isActive ?? true,
    });
  },
});

export const deleteBrand = mutation({
  args: { id: v.id("brands") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Default clean SVG car logos dictionary
const DEFAULT_BRAND_LOGOS: Record<string, string> = {
  renault: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/renault.svg",
  volkswagen: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/volkswagen.svg",
  "mercedes-benz": "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/mercedes.svg",
  bmw: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/bmw.svg",
  audi: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/audi.svg",
  ford: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/ford.svg",
  peugeot: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/peugeot.svg",
  citroen: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/citroen.svg",
  fiat: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/fiat.svg",
  opel: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/opel.svg",
  seat: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/seat.svg",
  skoda: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/skoda.svg",
  toyota: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/toyota.svg",
  hyundai: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/hyundai.svg",
  honda: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/honda.svg",
  nissan: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/nissan.svg",
  volvo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/volvo.svg",
  kia: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/kia.svg",
  dacia: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/dacia.svg",
  "alfa-romeo": "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/alfaromeo.svg",
  porsche: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/porsche.svg",
  "land-rover": "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/landrover.svg",
  jaguar: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/jaguar.svg",
  mitsubishi: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/mitsubishi.svg",
  chevrolet: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/chevrolet.svg",
  suzuki: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/suzuki.svg",
};

export const autoFillLogos = mutation({
  args: {},
  handler: async (ctx) => {
    const allBrands = await ctx.db.query("brands").take(200);
    let updatedCount = 0;

    for (const b of allBrands) {
      const slugKey = b.slug.toLowerCase().trim();
      const nameKey = b.name.toLowerCase().trim();
      const matchedLogo =
        DEFAULT_BRAND_LOGOS[slugKey] ||
        DEFAULT_BRAND_LOGOS[nameKey] ||
        (slugKey === "mercedes" || slugKey === "mercedes-benz" ? DEFAULT_BRAND_LOGOS["mercedes-benz"] : undefined) ||
        (slugKey.includes("citroen") ? DEFAULT_BRAND_LOGOS["citroen"] : undefined) ||
        (slugKey.includes("alfa") ? DEFAULT_BRAND_LOGOS["alfa-romeo"] : undefined) ||
        (slugKey.includes("land") ? DEFAULT_BRAND_LOGOS["land-rover"] : undefined);

      if (matchedLogo && (!b.logoUrl || b.logoUrl.trim() === "")) {
        await ctx.db.patch(b._id, { logoUrl: matchedLogo });
        updatedCount++;
      }
    }

    return { success: true, updatedCount };
  },
});
