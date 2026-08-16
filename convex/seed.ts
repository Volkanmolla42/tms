import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Site Settings
    const existingSettings = await ctx.db.query("siteSettings").first();
    if (!existingSettings) {
      await ctx.db.insert("siteSettings", {
        siteName: "TMS İTHALAT",
        slogan: "Türkiye'nin Oto Elektronik Parça Merkezi",
        whatsappNumber: "+905340653222",
        whatsappDisplay: "+90 534 065 32 22",
        phone: "+90 534 065 32 22",
        email: "info@tmsithalat.com",
        address: "Fevzipaşa Mh. 10121 Sk. No: 2 Karatay / KONYA",
        workingHours: "Pazartesi - Cumartesi: 08:30 - 19:00",
        announcement: "Türkiye'nin her yerine aynı gün hızlı kargo ve test garantisi!",
        heroHeadline: "Türkiye'nin Oto Elektronik Parça Merkezi",
        heroSubheadline: "ECU, ABS, Airbag, BCM, BSI, UCH ve binlerce orijinal elektronik modül.",
        stats: {
          productsCount: "15.000+",
          brandsCount: "45+",
          ecuCount: "1000+",
          experienceYears: "20+",
        },
      });
    }

    // 2. Clear old categories and seed fresh categories
    const oldCategories = await ctx.db.query("categories").collect();
    for (const cat of oldCategories) {
      await ctx.db.delete(cat._id);
    }

    const categoriesList = [
      {
        name: "Motor Beyinleri (ECU)",
        slug: "motor-beyinleri-ecu",
        description: "Farklı marka ve modellere uygun çıkma ve sıfır motor beyinleri. Binlerce stoklu ürün, uygun fiyat ve garantili hizmet.",
        image: "/images/cat-ecu.jpg",
        order: 1,
        isActive: true,
        metaTitle: "Motor Beyinleri (ECU) Modülleri ve Fiyatları | TMS İthalat",
        metaDescription: "En uygun fiyatlı orijinal çıkma ve sıfır motor kontrol üniteleri (ECU). Test edilmiş, garantili ve aynı gün kargo.",
        metaKeywords: "motor beyni, ecu, motor kontrol ünitesi, çıkma ecu, bosch ecu, sagem ecu, delphi ecu",
      },
      {
        name: "ABS / ESP Beyinleri",
        slug: "abs-esp-beyinleri",
        description: "Bosch, ATE ve TRW marka test edilmiş ABS ve ESP hidrolik beyin modülleri.",
        image: "/images/cat-abs.jpg",
        order: 2,
        isActive: true,
      },
      {
        name: "Airbag Beyinleri",
        slug: "airbag-beyinleri",
        description: "Hava yastığı sensör ve tetikleme kontrol modülleri.",
        image: "/images/cat-airbag.jpg",
        order: 3,
        isActive: true,
      },
      {
        name: "BCM / BSI Beyinleri",
        slug: "bcm-bsi-sam-modulleri",
        description: "Gövde kontrol modülleri, konfor ve aydınlatma beyinleri.",
        image: "/images/cat-bcm.jpg",
        order: 4,
        isActive: true,
      },
      {
        name: "UCH / SAM Modülleri",
        slug: "uch-sam-modulleri",
        description: "Renault UCH ve Mercedes SAM merkezi elektronik sigorta kontrol üniteleri.",
        image: "/images/cat-uch.jpg",
        order: 5,
        isActive: true,
      },
      {
        name: "Sigorta Kutuları",
        slug: "sigorta-kutulari",
        description: "Motor içi ve kabin içi sigorta röle dağıtım tablaları (BSM / UPC).",
        image: "/images/cat-fusebox.jpg",
        order: 6,
        isActive: true,
      },
      {
        name: "Gösterge Panelleri",
        slug: "gosterge-panelleri",
        description: "Dijital ve analog gösterge kadranları, hız ve devir saatleri.",
        image: "/images/cat-cluster.jpg",
        order: 7,
        isActive: true,
      },
      {
        name: "Direksiyon Kumanda Modülleri",
        slug: "direksiyon-kumanda-modulleri",
        description: "Direksiyon açı sensörleri, sargı ve sinyal kol kütükleri.",
        image: "/images/cat-steering.jpg",
        order: 8,
        isActive: true,
      },
      {
        name: "Klima Kontrol Üniteleri",
        slug: "klima-kontrol-uniteleri",
        description: "Dijital klima panelleri, kalorifer ve AC kontrol düğmeleri.",
        image: "/images/cat-climate.jpg",
        order: 9,
        isActive: true,
      },
      {
        name: "Multimedya Üniteleri",
        slug: "multimedya-uniteleri",
        description: "Orijinal araç içi ekran, navigasyon ve teyp üniteleri.",
        image: "/images/cat-multimedia.jpg",
        order: 10,
        isActive: true,
      },
      {
        name: "Konfor Modülleri",
        slug: "konfor-modulleri",
        description: "Kapı, cam ve merkezi kilit konfor kontrol modülleri.",
        image: "/images/cat-comfort.jpg",
        order: 11,
        isActive: true,
      },
      {
        name: "Şanzıman Beyinleri",
        slug: "sanziman-beyinleri",
        description: "DSG, EDC, 7G-Tronic ve otomatik şanzıman mekatronik kontrol beyinleri.",
        image: "/images/cat-transmission.jpg",
        order: 12,
        isActive: true,
      },
    ];

    const categoryIdMap = new Map<string, Id<"categories">>();
    const now = Date.now();

    for (const c of categoriesList) {
      const id = await ctx.db.insert("categories", {
        ...c,
        createdAt: now,
        updatedAt: now,
      });
      categoryIdMap.set(c.slug, id);
    }

    // 3. Seed Brands
    const oldBrands = await ctx.db.query("brands").collect();
    for (const b of oldBrands) {
      await ctx.db.delete(b._id);
    }

    const brandList = [
      { name: "Renault", slug: "renault", popular: true, order: 1, isActive: true },
      { name: "Volkswagen", slug: "volkswagen", popular: true, order: 2, isActive: true },
      { name: "Mercedes-Benz", slug: "mercedes-benz", popular: true, order: 3, isActive: true },
      { name: "BMW", slug: "bmw", popular: true, order: 4, isActive: true },
      { name: "Audi", slug: "audi", popular: true, order: 5, isActive: true },
      { name: "Ford", slug: "ford", popular: true, order: 6, isActive: true },
      { name: "Peugeot", slug: "peugeot", popular: true, order: 7, isActive: true },
      { name: "Citroën", slug: "citroen", popular: true, order: 8, isActive: true },
      { name: "Fiat", slug: "fiat", popular: true, order: 9, isActive: true },
      { name: "Opel", slug: "opel", popular: true, order: 10, isActive: true },
      { name: "Seat", slug: "seat", popular: true, order: 11, isActive: true },
      { name: "Skoda", slug: "skoda", popular: true, order: 12, isActive: true },
      { name: "Toyota", slug: "toyota", popular: true, order: 13, isActive: true },
      { name: "Hyundai", slug: "hyundai", popular: true, order: 14, isActive: true },
    ];

    for (const b of brandList) {
      await ctx.db.insert("brands", b);
    }

    // 4. Seed Clean Products including the user's exact Renault Sagem ECU
    const oldProducts = await ctx.db.query("products").collect();
    for (const p of oldProducts) {
      await ctx.db.delete(p._id);
    }

    const ecuCatId = categoryIdMap.get("motor-beyinleri-ecu")!;
    const absCatId = categoryIdMap.get("abs-esp-beyinleri")!;
    const airbagCatId = categoryIdMap.get("airbag-beyinleri")!;
    const bcmCatId = categoryIdMap.get("bcm-bsi-sam-modulleri")!;
    const transmissionCatId = categoryIdMap.get("sanziman-beyinleri")!;

    const products = [
      {
        title: "Renault Motor Beyni ECU Sagem S113717205D Orijinal Çıkma Motor Kontrol Ünitesi",
        slug: "renault-sagem-s113717205d-motor-beyni-ecu",
        oemNumber: "S113717205D",
        shelfCode: "RAF-R04",
        categoryId: ecuCatId,
        brand: "Renault",
        model: "Renault Modelleri (Genel Uyumlu)",
        condition: "Orijinal Çıkma",
        inStock: true,
        description: `Renault araçlar için Sagem üretimi S113717205D numaralı motor beyni (ECU / Engine Control Unit) orijinal çıkma yedek parça.

Motor kontrol ünitesi; aracın yakıt enjeksiyonu, ateşleme sistemi, motor çalışma değerleri ve elektronik yönetim fonksiyonlarını kontrol eden önemli bir elektronik parçadır.

Ürün profesyonel olarak sökülmüş, kontrol edilmiş ve kullanıma hazır durumdadır. Satın almadan önce mevcut ECU üzerindeki parça numarasının S113717205D ile aynı olduğunun kontrol edilmesi önerilir.

Kullanım Alanları:
- Renault motor kontrol sistemleri
- Yakıt enjeksiyon yönetimi
- Ateşleme kontrolü
- Motor elektronik sistemleri

TMS İthalat güvencesiyle kaliteli çıkma otomotiv elektronik yedek parçaları.`,
        images: ["/images/cat-ecu.jpg", "/images/catalog-ecu-banner.jpg", "/images/hero-ecu-modules.jpg"],
        metaTitle: "Sagem S113717205D Renault Motor Beyni ECU Orijinal Çıkma | TMS İthalat",
        metaDescription: "Renault araçlar için Sagem S113717205D numaralı motor beyni ECU. Test edilmiş orijinal çıkma motor kontrol ünitesi ve otomotiv elektronik yedek parçaları TMS İthalat güvencesiyle.",
        metaKeywords: "S113717205D, Renault motor beyni, Renault ECU, Sagem ECU, Sagem motor beyni, Renault çıkma beyin, motor kontrol ünitesi, ECU beyni, Renault elektronik parça, otomotiv elektronik, çıkma ECU, Renault yedek parça",
        tags: [
          "S113717205D",
          "Renault",
          "Sagem",
          "ECU",
          "Motor Beyni",
          "Motor Kontrol Ünitesi",
          "Elektronik Beyin",
          "Çıkma Parça",
          "Renault Yedek Parça",
          "Otomotiv Elektronik",
          "Motor Elektroniği"
        ],
        createdAt: now - 11000,
        updatedAt: now - 11000,
      },
      {
        title: "Bosch ECU VW Passat 2.0 TDI",
        slug: "0281011234-volkswagen-passat",
        oemNumber: "0281011234",
        shelfCode: "RAF-A12",
        categoryId: ecuCatId,
        brand: "Volkswagen",
        model: "Passat 2.0 TDI (2010 - 2014)",
        manufacturer: "Bosch",
        condition: "Orijinal Çıkma",
        inStock: true,
        description: "Bosch 0281011234 Motor Kontrol Ünitesi, Volkswagen Passat 2.0 TDI araçlar için üretilmiş orijinal ECU modülüdür. Tüm fonksiyonları test edilmiştir ve sorunsuz çalışmaktadır. Uyumlu araçlar: VW Passat, Passat CC, Tiguan, Sharan 2.0 TDI. İmmobilizer kodlama ve klonlama desteği sağlanmaktadır.",
        images: ["/images/catalog-ecu-banner.jpg", "/images/cat-ecu.jpg", "/images/hero-ecu-modules.jpg"],
        metaTitle: "0281011234 Bosch ECU VW Passat 2.0 TDI | TMS İthalat",
        metaDescription: "Bosch 0281011234 VW Passat 2.0 TDI orijinal çıkma motor kontrol ünitesi.",
        metaKeywords: "0281011234, Bosch ECU, Passat motor beyni, VW çıkma beyin",
        tags: ["0281011234", "Volkswagen", "Bosch", "ECU", "Passat"],
        createdAt: now - 10000,
        updatedAt: now - 10000,
      },
      {
        title: "Mercedes ECU W204 2.2 CDI",
        slug: "a6519005401-mercedes-w204",
        oemNumber: "A6519005401",
        shelfCode: "RAF-A15",
        categoryId: ecuCatId,
        brand: "Mercedes-Benz",
        model: "C-Class W204 C220 CDI (2011 - 2015)",
        manufacturer: "Delphi",
        condition: "Orijinal Çıkma",
        inStock: true,
        description: "Mercedes-Benz Delphi CRD2.30 Motor Kontrol Ünitesi. W204 C200/C220 CDI OM651 motorlar için test edilmiş orijinal parça. Enjektör, DPF ve turbo aktüatör çıkışları simülatörde tam test edilmiştir.",
        images: ["/images/cat-ecu.jpg", "/images/catalog-ecu-banner.jpg"],
        metaTitle: "A6519005401 Mercedes W204 C220 CDI ECU | TMS İthalat",
        metaDescription: "Delphi A6519005401 Mercedes-Benz W204 C-Class motor kontrol ünitesi.",
        metaKeywords: "A6519005401, Mercedes ECU, W204 beyin, Delphi CRD2",
        tags: ["A6519005401", "Mercedes-Benz", "Delphi", "W204", "ECU"],
        createdAt: now - 9000,
        updatedAt: now - 9000,
      },
      {
        title: "ATE MK60 ABS / ESP Hidrolik Beyin Modülü",
        slug: "1k0907379ce-ate-abs-vw",
        oemNumber: "1K0907379CE",
        shelfCode: "RAF-D05",
        categoryId: absCatId,
        brand: "Volkswagen",
        model: "Golf 6 / Passat B7 (2009 - 2015)",
        manufacturer: "ATE",
        condition: "Orijinal Çıkma",
        inStock: true,
        description: "ATE MK60EC1 Volkswagen Golf 6, Passat B7, Jetta ve Skoda Octavia ESP hidrolik kontrol bloğu ve elektronik beyni. 01435 basınç sensörü arızası ve valf testleri yapılmıştır.",
        images: ["/images/cat-abs.jpg", "/images/hero-ecu-modules.jpg"],
        metaTitle: "1K0907379CE ATE ABS ESP Beyni VW Golf Passat | TMS İthalat",
        metaDescription: "ATE 1K0907379CE Volkswagen Golf 6 ve Passat B7 ABS kontrol modülü.",
        metaKeywords: "1K0907379CE, ATE ABS, MK60EC1, VW ABS beyni",
        tags: ["1K0907379CE", "ATE", "ABS", "Volkswagen", "ESP"],
        createdAt: now - 1000,
        updatedAt: now - 1000,
      },
      {
        title: "Autoliv Airbag Kontrol Beyni Renault Clio 4",
        slug: "985101389r-renault-clio4-airbag",
        oemNumber: "985101389R",
        shelfCode: "RAF-E02",
        categoryId: airbagCatId,
        brand: "Renault",
        model: "Clio 4 / Captur (2012 - 2019)",
        manufacturer: "Autoliv",
        condition: "Sıfırlanmış - Virgin",
        inStock: true,
        description: "Renault Clio 4 ve Captur Autoliv Airbag Beyni. Kaza sonrası çarpışma verisi (Crash Data) silinmiş ve fabrika sıfır konumuna getirilmiştir.",
        images: ["/images/cat-airbag.jpg", "/images/hero-ecu-modules.jpg"],
        metaTitle: "985101389R Renault Clio 4 Airbag Beyni | TMS İthalat",
        metaDescription: "985101389R Autoliv Renault Clio 4 sıfırlanmış hava yastığı kontrol modülü.",
        metaKeywords: "985101389R, Clio 4 Airbag, Autoliv, Renault Airbag Beyni",
        tags: ["985101389R", "Renault", "Autoliv", "Airbag", "Clio 4"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Continental BCM Gövde Kontrol Beyni VW Golf 6",
        slug: "1k0937087ql-vw-bcm",
        oemNumber: "1K0937087QL",
        shelfCode: "RAF-E11",
        categoryId: bcmCatId,
        brand: "Volkswagen",
        model: "Golf 6 / Jetta 6 (2010 - 2015)",
        manufacturer: "Continental",
        condition: "Orijinal Çıkma",
        inStock: true,
        description: "Continental BCM PQ35 Yüksek Donanım (Highline) Gövde Kontrol Modülü. Xenon/LED far, ayak aydınlatması ve merkezi kilit fonksiyonları tam testli.",
        images: ["/images/cat-bcm.jpg", "/images/cat-uch.jpg"],
        metaTitle: "1K0937087QL VW Golf 6 BCM Gövde Beyni | TMS İthalat",
        metaDescription: "Continental 1K0937087QL Volkswagen Golf 6 BCM konfor modülü.",
        metaKeywords: "1K0937087QL, VW BCM, Continental, PQ35 Gövde Kontrol",
        tags: ["1K0937087QL", "Continental", "BCM", "Volkswagen", "Golf 6"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "DSG 7 İleri DQ200 0AM Mekatronik Şanzıman Beyni",
        slug: "0am927769d-dsg-tcu",
        oemNumber: "0AM927769D",
        shelfCode: "RAF-F01",
        categoryId: transmissionCatId,
        brand: "Volkswagen",
        model: "Golf 7 / Passat B8 (2010 - 2020)",
        manufacturer: "Continental",
        condition: "Revizyonlu - Testli",
        inStock: true,
        description: "Volkswagen, Audi, Seat ve Skoda kuru kavrama 7 ileri DSG DQ200 mekatronik kontrol kartı ve valf beyni. Basınç kaybı ve P17BF arızalarına karşı güçlendirilmiştir.",
        images: ["/images/cat-transmission.jpg", "/images/hero-ecu-modules.jpg"],
        metaTitle: "0AM927769D DSG 7 DQ200 Mekatronik Beyin | TMS İthalat",
        metaDescription: "0AM927769D DSG 7 ileri DQ200 şanzıman mekatronik kontrol ünitesi.",
        metaKeywords: "0AM927769D, DSG Beyni, DQ200, Mekatronik Kart",
        tags: ["0AM927769D", "DSG", "Mekatronik", "Volkswagen", "Şanzıman"],
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const p of products) {
      await ctx.db.insert("products", p);
    }

    return {
      success: true,
      categoriesCount: categoriesList.length,
      brandsCount: brandList.length,
      productsCount: products.length,
    };
  },
});
