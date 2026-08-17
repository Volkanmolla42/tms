import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export interface GeneratedProductResult {
  success: boolean;
  oemNumber: string;
  title: string;
  brand: string;
  manufacturer: string;
  model: string;
  categoryId?: Id<"categories">;
  categoryName: string;
  categorySlug: string;
  condition: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  tags: string[];
  slug: string;
}

function buildCatalogDescription({
  brand,
  manufacturer,
  oemNumber,
  categoryName,
  shelfCode,
  condition,
  model,
}: {
  brand: string;
  manufacturer: string;
  oemNumber: string;
  categoryName: string;
  shelfCode?: string;
  condition: string;
  model: string;
}) {
  const vehicleBrand = brand.trim() || "Genel Uyumlu";
  const producer = manufacturer.trim() || "Orijinal ekipman üreticisi";
  const partType = categoryName.trim() || "Oto Elektronik Parçası";
  const partNumber = oemNumber.trim();
  const stockCode = shelfCode?.trim().toUpperCase() || "Belirtilmemiş";
  const productCondition = condition.trim() || "Orijinal Çıkma";
  const compatibility = model.trim()
    ? `${vehicleBrand} ${model.trim()} Modelleri`
    : `${vehicleBrand} Modelleri`;

  return `${vehicleBrand} araçlar için ${producer} üretimi ${partNumber} parça numaralı ${partType} orijinal çıkma yedek parça.

Parça Özellikleri & Kontroller:
Ürün profesyonel olarak araçtan sökülmüş, tüm soket ve pin kontrolleri yapılmış, kullanıma hazır durumdadır. Satın almadan önce parça üzerindeki numaranın (${partNumber}) kontrol edilmesi önerilir.

Ürün Özellikleri
Parça No: ${partNumber}
Raf / Stok Kodu: ${stockCode}
Araç Markası: ${vehicleBrand}
Parça Türü: ${partType}
Üretici: ${producer}
Durum: ${productCondition}
Uyumluluk: ${compatibility}

Kullanım Alanları
• ${vehicleBrand} araç elektronik sistemleri
• ${partType} yönetimi ve aktüatör kontrolü
• Sensör ve sinyal iletimi
• Orijinal fabrika donanımı

TMS İthalat güvencesiyle kaliteli çıkma otomotiv elektronik yedek parçaları.`;
}

export const generateProductDetails = action({
  args: {
    oemNumber: v.string(),
    shelfCode: v.optional(v.string()),
    additionalHint: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<GeneratedProductResult> => {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;

    if (!geminiApiKey && !openRouterApiKey) {
      throw new Error(
        "Yapay zeka API anahtarı bulunamadı. Lütfen GEMINI_API_KEY veya OPENROUTER_API_KEY tanımlayınız."
      );
    }

    // 1. Fetch Categories for context
    const categories: any[] = await ctx.runQuery(api.categories.list, { onlyActive: false });

    const categoriesContext = (categories || [])
      .map((c: any) => `- "${c.name}" (slug: "${c.slug}")`)
      .join("\n");

    const systemPrompt = `Sen otomotiv elektronik parçaları (ECU, ABS, Airbag, BCM, Sigorta Kutusu, Şanzıman Beyni vb.) konusunda uzman bir teknik ürün yöneticisisin.
Görevin, verilen OEM / Parça Numarasını araştırıp en doğru araç markası, model uyumluluğu, parça türü ve SEO uyumlu ürün bilgilerini eksiksiz JSON formatında üretmektir.

MEVCUT KATEGORİ LİSTESİ:
${categoriesContext}

ÜRÜN BİLGİSİ KURALLARI:
- Ürün Başlığı: "[Araç Markası] [Parça Türü/ECU] [Üretici/Model] [OEM Kodu] Orijinal Çıkma Parça"
- manufacturer alanına ürünün üreticisini yaz (ör. "VAG (Audi / VW)", "Bosch", "Continental").
- OEM kodundan araç markası veya modeli yüksek güvenle doğrulanamıyorsa tahmin etme; brand ve model için "Genel Uyumlu" kullan.
- description alanı sunucuda sabit katalog şablonuyla yeniden oluşturulacaktır; yine de düz metin döndür.

ZORUNLU ÇIKTI KURALLARI:
1. SADECE geçerli ve temiz bir JSON nesnesi döndür (Markdown backtickleri veya harici metin yazma).
2. JSON alanları:
{
  "title": string (Örn: "Renault Motor Beyni ECU Sagem S113717205D Orijinal Çıkma Motor Kontrol Ünitesi"),
  "brand": string (Örn: "Renault", "Volkswagen", "Mercedes-Benz", "BMW", "Audi", "Ford", "Fiat", "Peugeot"),
  "manufacturer": string (Örn: "VAG (Audi / VW)", "Bosch", "Continental"),
  "model": string (Örn: "Megane 2 / Clio 3 1.6 16V"),
  "categorySlug": string (Yukarıdaki mevcut kategori sluglarından en uygun olanı),
  "condition": string (Varsayılan: "Orijinal Çıkma"),
  "description": string (Zengin, paragraflı ve maddeli açıklama),
  "metaTitle": string (Google SEO başlığı),
  "metaDescription": string (150-160 karakterlik Google SEO açıklaması),
  "metaKeywords": string (Virgülle ayrılmış 8-12 adet SEO arama terimi),
  "tags": array of strings (6-10 adet parça etiketleri: ["S113717205D", "Renault", "ECU", "Motor Beyni", "Çıkma Parça"]),
  "slug": string (Küçük harf, türkçe karaktersiz URL: "renault-sagem-s113717205d-motor-beyni-ecu")
}`;

    const userMessage = `Lütfen aşağıdaki OEM / Parça Numarası için ürün bilgilerini üret:
OEM / Parça Numarası: ${args.oemNumber.trim()}
Raf / Stok Kodu: ${args.shelfCode?.trim().toUpperCase() || "Belirtilmemiş"}
${args.additionalHint ? `Ekstra Bilgi / Not: ${args.additionalHint}` : ""}`;

    let content = "";

    // 2. Call AI Service (Direct Free Google Gemini API with multi-model failover)
    if (geminiApiKey) {
      const googleModels = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3-flash-preview"];
      for (const model of googleModels) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
          const response = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: systemPrompt }],
              },
              contents: [
                {
                  parts: [{ text: userMessage }],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 2500,
                responseMimeType: "application/json",
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (content) break;
          }
        } catch (e) {
          // Continue to next model
        }
      }
    }

    // Fallback to OpenRouter if Google direct did not produce content
    if (!content && openRouterApiKey) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openRouterApiKey}`,
          "HTTP-Referer": "https://tmsithalat.com",
          "X-Title": "TMS Ithalat AI Product Generator",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          temperature: 0.2,
          max_tokens: 2500,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        content = data.choices?.[0]?.message?.content || "";
      }
    }

    if (!content) {
      throw new Error("Yapay zekadan geçerli bir yanıt alınamadı.");
    }

    // 3. Parse JSON safely from AI output
    let parsed: any;
    try {
      const firstBrace = content.indexOf("{");
      const lastBrace = content.lastIndexOf("}");
      if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
        throw new Error("JSON bloğu bulunamadı.");
      }
      const jsonString = content.substring(firstBrace, lastBrace + 1);
      parsed = JSON.parse(jsonString);
    } catch (e: any) {
      throw new Error(`Yapay zeka yanıtı JSON olarak çözümlenemedi (${e?.message}): ${content.slice(0, 300)}...`);
    }

    // 4. Match Category ID
    let matchedCat = (categories || []).find((c: any) => c.slug === parsed.categorySlug);
    if (!matchedCat && parsed.categorySlug) {
      matchedCat = (categories || []).find((c: any) =>
        c.name.toLowerCase().includes(parsed.categorySlug.toLowerCase())
      );
    }
    if (!matchedCat && categories && categories.length > 0) {
      matchedCat = categories[0];
    }

    const resolvedBrand = typeof parsed.brand === "string" && parsed.brand.trim() && parsed.brand.trim() !== "Genel"
      ? parsed.brand.trim()
      : "Genel Uyumlu";
    const resolvedManufacturer = typeof parsed.manufacturer === "string" && parsed.manufacturer.trim()
      ? parsed.manufacturer.trim()
      : "Orijinal ekipman üreticisi";
    const resolvedModel = typeof parsed.model === "string" && parsed.model.trim() !== "Genel Uyumlu"
      ? parsed.model.trim()
      : "";

    return {
      success: true,
      oemNumber: args.oemNumber.trim(),
      title: parsed.title || `${args.oemNumber} Otomotiv Parçası`,
      brand: resolvedBrand,
      manufacturer: resolvedManufacturer,
      model: resolvedModel,
      categoryId: matchedCat?._id,
      categoryName: matchedCat?.name || "Oto Elektronik",
      categorySlug: matchedCat?.slug || "oto-elektronik",
      condition: parsed.condition || "Orijinal Çıkma",
      description: buildCatalogDescription({
        brand: resolvedBrand,
        manufacturer: resolvedManufacturer,
        oemNumber: args.oemNumber,
        categoryName: matchedCat?.name || "Oto Elektronik",
        shelfCode: args.shelfCode,
        condition: parsed.condition || "Orijinal Çıkma",
        model: resolvedModel,
      }),
      metaTitle: parsed.metaTitle || `${args.oemNumber} Orijinal Çıkma Parça | TMS İthalat`,
      metaDescription: parsed.metaDescription || "",
      metaKeywords: parsed.metaKeywords || "",
      tags: Array.isArray(parsed.tags) ? parsed.tags : [args.oemNumber, "Çıkma Parça"],
      slug:
        parsed.slug ||
        `${args.oemNumber.toLowerCase()}-parca`
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-"),
    };
  },
});
