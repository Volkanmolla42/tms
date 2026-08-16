import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // Kategori Tablosu
  categories: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    image: v.string(),
    order: v.number(),
    featured: v.boolean(),
    itemCount: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_featured", ["featured"])
    .index("by_order", ["order"]),

  // Araç Markaları
  brands: defineTable({
    slug: v.string(),
    name: v.string(),
    logoUrl: v.optional(v.string()),
    popular: v.boolean(),
    order: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_popular", ["popular"])
    .index("by_order", ["order"]),

  // Ürünler Tablosu (Oto Elektronik Modülleri / Motor Beyinleri / vb.)
  products: defineTable({
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
    fuelType: v.string(), // Dizel, Benzin, Hibrit, Elektrik
    condition: v.string(), // Çıkma - Orijinal, Sıfır - Orijinal, Revizyonlu
    warranty: v.string(), // 3 Ay Garanti, 6 Ay Garanti, 1 Yıl Garanti
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
    priceText: v.optional(v.string()), // "Fiyat Sorunuz" or "4.500 ₺"
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
    views: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_oemNumber", ["oemNumber"])
    .index("by_categorySlug", ["categorySlug"])
    .index("by_brand", ["brand"])
    .index("by_featured", ["featured"])
    .index("by_inStock", ["inStock"]),

  // WhatsApp Talepleri & Teklif / İletişim Formları
  inquiries: defineTable({
    productId: v.optional(v.id("products")),
    productTitle: v.optional(v.string()),
    oemNumber: v.optional(v.string()),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    vehicleInfo: v.optional(v.string()), // Marka, Model, Yıl, Şasi No
    message: v.string(),
    type: v.string(), // "whatsapp_order", "quote_request", "contact_form", "vin_search"
    status: v.string(), // "new", "contacted", "completed", "archived"
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_status", ["status"])
    .index("by_type", ["type"]),

  // Site Ayarları
  siteSettings: defineTable({
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
  }),
});
