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

export const INITIAL_CATEGORIES = [
  {
    name: "Motor Beyinleri (ECU)",
    slug: "motor-beyinleri-ecu",
    image: "/images/cat-ecu.jpg",
    order: 1,
    description: "Motor kontrol üniteleri (ECU / ECM), enjeksiyon ve ateşleme yönetim modülleri.",
  },
  {
    name: "ABS / ESP Beyinleri",
    slug: "abs-esp-beyinleri",
    image: "/images/cat-abs.jpg",
    order: 2,
    description: "ABS hidrolik pompaları, ESP kontrol modülleri ve fren elektronik üniteleri.",
  },
  {
    name: "Airbag Beyinleri",
    slug: "airbag-beyinleri",
    image: "/images/cat-airbag.jpg",
    order: 3,
    description: "Hava yastığı kontrol modülleri, SRS ve çarpışma sensör beyinleri.",
  },
  {
    name: "BCM / BSI Beyinleri",
    slug: "bcm-bsi-sam-modulleri",
    image: "/images/cat-bcm.jpg",
    order: 4,
    description: "Gövde kontrol üniteleri (BCM), BSI ve konfor yönetim modülleri.",
  },
  {
    name: "UCH / SAM Modülleri",
    slug: "uch-sam-modulleri",
    image: "/images/cat-uch.jpg",
    order: 5,
    description: "Renault UCH, Mercedes SAM ve araç içi merkezi kontrol modülleri.",
  },
  {
    name: "Sigorta Kutuları",
    slug: "sigorta-kutulari",
    image: "/images/cat-fusebox.jpg",
    order: 6,
    description: "Motor içi ve kabin içi elektronik sigorta ve röle dağıtım kutuları.",
  },
  {
    name: "Gösterge Panelleri",
    slug: "gosterge-panelleri",
    image: "/images/cat-cluster.jpg",
    order: 7,
    description: "Dijital ve analog gösterge kadranları, cluster ekranları.",
  },
  {
    name: "Direksiyon Kumanda Modülleri",
    slug: "direksiyon-kumanda-modulleri",
    image: "/images/cat-steering.jpg",
    order: 8,
    description: "Direksiyon açı sensörleri, korna sargıları ve direksiyon kontrol üniteleri.",
  },
  {
    name: "Klima Kontrol Üniteleri",
    slug: "klima-kontrol-uniteleri",
    image: "/images/cat-climate.jpg",
    order: 9,
    description: "Dijital ve manuel klima kontrol panelleri ve modülleri.",
  },
  {
    name: "Multimedya Üniteleri",
    slug: "multimedya-uniteleri",
    image: "/images/cat-multimedia.jpg",
    order: 10,
    description: "Orijinal fabrika çıkışlı navigasyon, teyp ve multimedya ekranları.",
  },
  {
    name: "Konfor Modülleri",
    slug: "konfor-modulleri",
    image: "/images/cat-comfort.jpg",
    order: 11,
    description: "Kapı, cam ve tavan konfor elektronik modülleri.",
  },
  {
    name: "Şanzıman Beyinleri",
    slug: "sanziman-beyinleri",
    image: "/images/cat-transmission.jpg",
    order: 12,
    description: "Otomatik ve çift kavramalı şanzıman mekatronik ve elektronik kontrol üniteleri.",
  },
];

export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("categories").collect();
    const existingBySlug = new Map(existing.map((c) => [c.slug.toLowerCase(), c]));
    let created = 0;
    let updated = 0;
    const now = Date.now();

    for (const item of INITIAL_CATEGORIES) {
      const found = existingBySlug.get(item.slug.toLowerCase());
      if (!found) {
        await ctx.db.insert("categories", {
          name: item.name,
          slug: item.slug,
          image: item.image,
          order: item.order,
          description: item.description,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        created++;
      } else {
        await ctx.db.patch(found._id, {
          image: item.image,
          order: item.order,
          description: found.description || item.description,
          updatedAt: now,
        });
        updated++;
      }
    }

    return { created, updated, total: INITIAL_CATEGORIES.length };
  },
});
