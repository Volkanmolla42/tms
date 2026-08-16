import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export const list = query({
  args: {
    categorySlug: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    brand: v.optional(v.string()),
    condition: v.optional(v.string()),
    inStockOnly: v.optional(v.boolean()),
    searchTerm: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let items: Doc<"products">[] = [];

    if (args.categoryId) {
      items = await ctx.db
        .query("products")
        .withIndex("by_categoryId", (q) => q.eq("categoryId", args.categoryId!))
        .take(args.limit ?? 100);
    } else if (args.categorySlug) {
      const category = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", args.categorySlug!))
        .first();

      if (category) {
        items = await ctx.db
          .query("products")
          .withIndex("by_categoryId", (q) => q.eq("categoryId", category._id))
          .take(args.limit ?? 100);
      } else {
        items = [];
      }
    } else if (args.brand) {
      items = await ctx.db
        .query("products")
        .withIndex("by_brand", (q) => q.eq("brand", args.brand!))
        .take(args.limit ?? 100);
    } else {
      items = await ctx.db.query("products").take(args.limit ?? 100);
    }

    let filtered = items;

    if (args.condition && args.condition !== "Tümü") {
      filtered = filtered.filter((p) =>
        p.condition.toLowerCase().includes(args.condition!.toLowerCase())
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
        const shelfClean = (p.shelfCode || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const hasTagMatch = p.tags?.some((t) => t.toLowerCase().includes(term));

        return (
          p.title.toLowerCase().includes(term) ||
          p.oemNumber.toLowerCase().includes(term) ||
          (p.shelfCode && p.shelfCode.toLowerCase().includes(term)) ||
          (cleanTerm.length >= 2 && oemClean.includes(cleanTerm)) ||
          (cleanTerm.length >= 2 && shelfClean.includes(cleanTerm)) ||
          p.brand.toLowerCase().includes(term) ||
          (p.model && p.model.toLowerCase().includes(term)) ||
          p.description.toLowerCase().includes(term) ||
          (p.metaKeywords && p.metaKeywords.toLowerCase().includes(term)) ||
          hasTagMatch
        );
      });
    }

    // Populate relational category details for each product
    return await Promise.all(
      filtered.map(async (p) => {
        const cat = p.categoryId ? ((await ctx.db.get(p.categoryId as Id<"categories">)) as Doc<"categories"> | null) : null;
        return {
          ...p,
          categoryName: cat?.name || "Oto Elektronik",
          categorySlug: cat?.slug || "diger",
          category: cat ? { _id: cat._id, name: cat.name, slug: cat.slug } : null,
        };
      })
    );
  },
});

export const getFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("products")
      .take(args.limit ?? 12);

    return await Promise.all(
      items.map(async (p) => {
        const cat = p.categoryId ? ((await ctx.db.get(p.categoryId as Id<"categories">)) as Doc<"categories"> | null) : null;
        return {
          ...p,
          categoryName: cat?.name || "Oto Elektronik",
          categorySlug: cat?.slug || "diger",
        };
      })
    );
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!product) return null;

    const cat = product.categoryId ? ((await ctx.db.get(product.categoryId as Id<"categories">)) as Doc<"categories"> | null) : null;
    return {
      ...product,
      categoryName: cat?.name || "Oto Elektronik",
      categorySlug: cat?.slug || "diger",
      category: cat ? { _id: cat._id, name: cat.name, slug: cat.slug } : null,
    };
  },
});

export const getByOem = query({
  args: { oemNumber: v.string() },
  handler: async (ctx, args) => {
    const cleanOem = args.oemNumber.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const all = await ctx.db.query("products").take(200);
    const matched = all.filter((p) => {
      const pOem = p.oemNumber.toLowerCase().replace(/[^a-z0-9]/g, "");
      return pOem.includes(cleanOem) || p.title.toLowerCase().includes(cleanOem);
    });

    return await Promise.all(
      matched.map(async (p) => {
        const cat = p.categoryId ? ((await ctx.db.get(p.categoryId as Id<"categories">)) as Doc<"categories"> | null) : null;
        return {
          ...p,
          categoryName: cat?.name || "Oto Elektronik",
          categorySlug: cat?.slug || "diger",
        };
      })
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
    const filtered = all
      .filter((p) => {
        const oemClean = p.oemNumber.toLowerCase().replace(/[^a-z0-9]/g, "");
        const shelfClean = (p.shelfCode || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const hasTagMatch = p.tags?.some((t) => t.toLowerCase().includes(term));

        return (
          p.title.toLowerCase().includes(term) ||
          p.oemNumber.toLowerCase().includes(term) ||
          (p.shelfCode && p.shelfCode.toLowerCase().includes(term)) ||
          (cleanTerm.length >= 2 && oemClean.includes(cleanTerm)) ||
          (cleanTerm.length >= 2 && shelfClean.includes(cleanTerm)) ||
          p.brand.toLowerCase().includes(term) ||
          (p.model && p.model.toLowerCase().includes(term)) ||
          (p.metaKeywords && p.metaKeywords.toLowerCase().includes(term)) ||
          hasTagMatch
        );
      })
      .slice(0, args.limit ?? 10);

    return await Promise.all(
      filtered.map(async (p) => {
        const cat = p.categoryId ? ((await ctx.db.get(p.categoryId as Id<"categories">)) as Doc<"categories"> | null) : null;
        return {
          ...p,
          categoryName: cat?.name || "Oto Elektronik",
          categorySlug: cat?.slug || "diger",
        };
      })
    );
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    oemNumber: v.string(),
    shelfCode: v.optional(v.string()),
    categoryId: v.id("categories"),
    brand: v.string(),
    model: v.optional(v.string()),
    condition: v.string(),
    inStock: v.boolean(),
    description: v.string(),
    images: v.array(v.string()),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    metaKeywords: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("products", {
      ...args,
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
    shelfCode: v.optional(v.string()),
    categoryId: v.id("categories"),
    brand: v.string(),
    model: v.optional(v.string()),
    condition: v.string(),
    inStock: v.boolean(),
    description: v.string(),
    images: v.array(v.string()),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    metaKeywords: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
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
