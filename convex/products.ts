import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    categorySlug: v.optional(v.string()),
    brand: v.optional(v.string()),
    condition: v.optional(v.string()),
    fuelType: v.optional(v.string()),
    inStockOnly: v.optional(v.boolean()),
    searchTerm: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let items;
    if (args.categorySlug) {
      items = await ctx.db
        .query("products")
        .withIndex("by_categorySlug", (builder) =>
          builder.eq("categorySlug", args.categorySlug!)
        )
        .take(args.limit ?? 100);
    } else if (args.brand) {
      items = await ctx.db
        .query("products")
        .withIndex("by_brand", (builder) =>
          builder.eq("brand", args.brand!)
        )
        .take(args.limit ?? 100);
    } else {
      items = await ctx.db.query("products").take(args.limit ?? 100);
    }

    let filtered = items;

    if (args.condition) {
      filtered = filtered.filter((p) =>
        p.condition.toLowerCase().includes(args.condition!.toLowerCase())
      );
    }

    if (args.fuelType) {
      filtered = filtered.filter(
        (p) => p.fuelType.toLowerCase() === args.fuelType!.toLowerCase()
      );
    }

    if (args.inStockOnly) {
      filtered = filtered.filter((p) => p.inStock);
    }

    if (args.searchTerm && args.searchTerm.trim() !== "") {
      const term = args.searchTerm.trim().toLowerCase();
      const cleanTerm = term.replace(/[^a-z0-9]/g, "");

      filtered = filtered.filter((p) => {
        const oemClean = p.oemNumber.toLowerCase().replace(/[^a-z0-9]/g, "");
        const boschClean = (p.boschNumber || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const siemensClean = (p.siemensNumber || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const otherClean = (p.otherNumbers || []).map((n) => n.toLowerCase().replace(/[^a-z0-9]/g, ""));

        return (
          p.title.toLowerCase().includes(term) ||
          p.oemNumber.toLowerCase().includes(term) ||
          (cleanTerm.length >= 3 && oemClean.includes(cleanTerm)) ||
          (cleanTerm.length >= 3 && boschClean.includes(cleanTerm)) ||
          (cleanTerm.length >= 3 && siemensClean.includes(cleanTerm)) ||
          (cleanTerm.length >= 3 && otherClean.some((c) => c.includes(cleanTerm))) ||
          p.brand.toLowerCase().includes(term) ||
          p.model.toLowerCase().includes(term) ||
          p.categoryName.toLowerCase().includes(term) ||
          (p.otherNumbers && p.otherNumbers.some((n) => n.toLowerCase().includes(term)))
        );
      });
    }

    return filtered;
  },
});

export const getFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .take(args.limit ?? 12);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const getByOem = query({
  args: { oemNumber: v.string() },
  handler: async (ctx, args) => {
    const cleanOem = args.oemNumber.trim().toLowerCase();
    const all = await ctx.db.query("products").take(200);
    return all.filter(
      (p) =>
        p.oemNumber.toLowerCase().includes(cleanOem) ||
        (p.boschNumber && p.boschNumber.toLowerCase().includes(cleanOem)) ||
        (p.siemensNumber && p.siemensNumber.toLowerCase().includes(cleanOem)) ||
        (p.otherNumbers &&
          p.otherNumbers.some((num) => num.toLowerCase().includes(cleanOem)))
    );
  },
});

export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const term = args.query.trim().toLowerCase();
    if (!term) return [];
    const cleanTerm = term.replace(/[^a-z0-9]/g, "");

    const all = await ctx.db.query("products").take(200);
    return all
      .filter((p) => {
        const oemClean = p.oemNumber.toLowerCase().replace(/[^a-z0-9]/g, "");
        const boschClean = (p.boschNumber || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const siemensClean = (p.siemensNumber || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const otherClean = (p.otherNumbers || []).map((n) => n.toLowerCase().replace(/[^a-z0-9]/g, ""));

        return (
          p.title.toLowerCase().includes(term) ||
          p.oemNumber.toLowerCase().includes(term) ||
          (cleanTerm.length >= 3 && oemClean.includes(cleanTerm)) ||
          (cleanTerm.length >= 3 && boschClean.includes(cleanTerm)) ||
          (cleanTerm.length >= 3 && siemensClean.includes(cleanTerm)) ||
          (cleanTerm.length >= 3 && otherClean.some((c) => c.includes(cleanTerm))) ||
          p.brand.toLowerCase().includes(term) ||
          p.model.toLowerCase().includes(term) ||
          p.categoryName.toLowerCase().includes(term) ||
          (p.otherNumbers && p.otherNumbers.some((n) => n.toLowerCase().includes(term)))
        );
      })
      .slice(0, args.limit ?? 10);
  },
});

export const getRelated = query({
  args: {
    categorySlug: v.string(),
    currentSlug: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("products")
      .withIndex("by_categorySlug", (q) => q.eq("categorySlug", args.categorySlug))
      .take((args.limit ?? 4) + 1);

    return items.filter((p) => p.slug !== args.currentSlug).slice(0, args.limit ?? 4);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    oemNumber: v.string(),
    boschNumber: v.optional(v.string()),
    siemensNumber: v.optional(v.string()),
    otherNumbers: v.optional(v.array(v.string())),
    categorySlug: v.string(),
    categoryName: v.string(),
    brand: v.string(),
    model: v.string(),
    generation: v.optional(v.string()),
    yearRange: v.string(),
    fuelType: v.string(),
    condition: v.string(),
    warranty: v.string(),
    tested: v.boolean(),
    plugAndPlay: v.boolean(),
    pinCount: v.optional(v.string()),
    voltage: v.optional(v.string()),
    weight: v.optional(v.string()),
    dimensions: v.optional(v.string()),
    softwareVersion: v.optional(v.string()),
    hardwareVersion: v.optional(v.string()),
    inStock: v.boolean(),
    price: v.optional(v.number()),
    priceText: v.optional(v.string()),
    description: v.string(),
    images: v.array(v.string()),
    compatibleVehicles: v.array(
      v.object({
        brand: v.string(),
        model: v.string(),
        engine: v.string(),
        yearRange: v.string(),
        oemNumber: v.string(),
      })
    ),
    installationNotes: v.optional(v.string()),
    featured: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("products", {
      ...args,
      views: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    title: v.string(),
    slug: v.string(),
    oemNumber: v.string(),
    boschNumber: v.optional(v.string()),
    siemensNumber: v.optional(v.string()),
    otherNumbers: v.optional(v.array(v.string())),
    categorySlug: v.string(),
    categoryName: v.string(),
    brand: v.string(),
    model: v.string(),
    generation: v.optional(v.string()),
    yearRange: v.string(),
    fuelType: v.string(),
    condition: v.string(),
    warranty: v.string(),
    tested: v.boolean(),
    plugAndPlay: v.boolean(),
    pinCount: v.optional(v.string()),
    voltage: v.optional(v.string()),
    weight: v.optional(v.string()),
    dimensions: v.optional(v.string()),
    softwareVersion: v.optional(v.string()),
    hardwareVersion: v.optional(v.string()),
    inStock: v.boolean(),
    price: v.optional(v.number()),
    priceText: v.optional(v.string()),
    description: v.string(),
    images: v.array(v.string()),
    compatibleVehicles: v.array(
      v.object({
        brand: v.string(),
        model: v.string(),
        engine: v.string(),
        yearRange: v.string(),
        oemNumber: v.string(),
      })
    ),
    installationNotes: v.optional(v.string()),
    featured: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, {
      ...fields,
      updatedAt: Date.now(),
    });
  },
});

export const toggleStock = mutation({
  args: { id: v.id("products"), inStock: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      inStock: args.inStock,
      updatedAt: Date.now(),
    });
  },
});

export const deleteProduct = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
