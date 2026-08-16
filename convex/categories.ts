import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { onlyActive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let cats;
    if (args.onlyActive !== false) {
      cats = await ctx.db
        .query("categories")
        .withIndex("by_isActive", (q) => q.eq("isActive", true))
        .collect();
    } else {
      cats = await ctx.db.query("categories").collect();
    }

    const sorted = cats.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Resolve Convex Storage image URL if storage ID is provided
    return await Promise.all(
      sorted.map(async (c) => {
        let imageUrl = c.image;
        if (c.imageStorageId) {
          const storageUrl = await ctx.storage.getUrl(c.imageStorageId);
          if (storageUrl) {
            imageUrl = storageUrl;
          }
        }
        return {
          ...c,
          image: imageUrl,
        };
      })
    );
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const cat = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!cat) return null;

    let imageUrl = cat.image;
    if (cat.imageStorageId) {
      const storageUrl = await ctx.storage.getUrl(cat.imageStorageId);
      if (storageUrl) {
        imageUrl = storageUrl;
      }
    }

    return {
      ...cat,
      image: imageUrl,
    };
  },
});

export const getById = query({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    const cat = await ctx.db.get(args.id);
    if (!cat) return null;

    let imageUrl = cat.image;
    if (cat.imageStorageId) {
      const storageUrl = await ctx.storage.getUrl(cat.imageStorageId);
      if (storageUrl) {
        imageUrl = storageUrl;
      }
    }

    return {
      ...cat,
      image: imageUrl,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    metaKeywords: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) {
      throw new Error(`'${args.slug}' slug'ına sahip bir kategori zaten mevcut.`);
    }

    const now = Date.now();
    return await ctx.db.insert("categories", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    metaKeywords: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, {
      ...fields,
      updatedAt: Date.now(),
    });
  },
});

export const deleteCategory = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    const cat = await ctx.db.get(args.id);
    if (!cat) return;

    const productsInCategory = await ctx.db
      .query("products")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", args.id))
      .take(1);

    if (productsInCategory.length > 0) {
      throw new Error("Bu kategoriye bağlı ürünler bulunmaktadır. Önce ürünlerin kategorisini değiştiriniz veya ürünleri siliniz.");
    }

    if (cat.imageStorageId) {
      await ctx.storage.delete(cat.imageStorageId);
    }

    await ctx.db.delete(args.id);
  },
});
