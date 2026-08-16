import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Default category seeds for the imported data
const REQUIRED_CATEGORIES = [
  { name: "Motor Beyinleri (ECU)", slug: "motor-beyinleri-ecu", order: 1, desc: "Tüm araç markalarına ait orijinal test edilmiş motor kontrol üniteleri (ECU)." },
  { name: "ABS / ESP Beyinleri", slug: "abs-esp-beyinleri", order: 2, desc: "ABS hidrolik blok ve elektronik kontrol üniteleri." },
  { name: "Gösterge Panelleri", slug: "gosterge-panelleri", order: 3, desc: "KM saatleri, dijital ve analog gösterge panelleri." },
  { name: "Sigorta Kutuları", slug: "sigorta-kutulari", order: 4, desc: "Motor içi ve gövde sigorta dağıtım kutuları." },
  { name: "Kumanda Panel ve Düğmeler", slug: "kumanda-panel-ve-dugmeler", order: 5, desc: "Cam açma düğmeleri, klima panelleri ve kontrol üniteleri." },
  { name: "BCM / BSI Modülleri", slug: "bcm-bsi-sam-modulleri", order: 6, desc: "Gövde kontrol modülleri, BSI, BCM, SAM ve UCH üniteleri." },
  { name: "Airbag Beyinleri", slug: "airbag-beyinleri", order: 7, desc: "Hava yastığı sensör ve kontrol modülleri." },
  { name: "Direksiyon & Sinyal Kolları", slug: "direksiyon-kumanda-modulleri", order: 8, desc: "Sinyal, silecek ve direksiyon kumanda kolları." },
  { name: "Kontak & Çalıştırma Sistemleri", slug: "konfor-modulleri", order: 9, desc: "Kontak kilitleri, start-stop modülleri ve immobilizer sistemleri." },
  { name: "Multimedya Üniteleri", slug: "multimedya-uniteleri", order: 10, desc: "Orijinal teyp, radyo, ekran ve navigasyon üniteleri." },
  { name: "Cam & Ayna Motorları", slug: "cam-kapi-motorlari", order: 11, desc: "Elektrikli cam krikoları ve kapı/ayna motorları." },
  { name: "ECU Motor Beyin Setleri", slug: "ecu-motor-beyin-setleri", order: 12, desc: "Anahtar, kontak, BSI ve ECU setleri." },
  { name: "Direksiyon & Pompa", slug: "direksiyon-pompa", order: 13, desc: "Elektrikli direksiyon pompaları ve kolon modülleri." },
  { name: "Oto Elektronik Parçaları", slug: "oto-elektronik-genel", order: 14, desc: "Çeşitli sensör, soket, trim ve elektronik yedek parçalar." },
];

export const initCategories = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("categories").collect();
    const map: Record<string, string> = {};

    for (const cat of existing) {
      map[cat.slug] = cat._id;
    }

    for (const req of REQUIRED_CATEGORIES) {
      if (!map[req.slug]) {
        const id = await ctx.db.insert("categories", {
          name: req.name,
          slug: req.slug,
          description: req.desc,
          order: req.order,
          isActive: true,
        });
        map[req.slug] = id;
      }
    }

    return map;
  },
});

export const batchInsertProducts = mutation({
  args: {
    products: v.array(
      v.object({
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
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let inserted = 0;
    let skipped = 0;

    for (const p of args.products) {
      // Check if product already exists by slug or oemNumber
      const existing = await ctx.db
        .query("products")
        .withIndex("by_oemNumber", (q) => q.eq("oemNumber", p.oemNumber))
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      await ctx.db.insert("products", {
        ...p,
        createdAt: now,
        updatedAt: now,
      });
      inserted++;
    }

    return { inserted, skipped };
  },
});
