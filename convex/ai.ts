import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export interface GeneratedProductResult {
  success: boolean;
  oemNumber: string;
  title: string;
  brand: string;
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

export const generateProductDetails = action({
  args: {
    oemNumber: v.string(),
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

ÖRNEK STANDART ŞABLON (Bunu baz alarak içerik üret):
- Ürün Başlığı: "[Araç Markası] [Parça Türü/ECU] [Üretici/Model] [OEM Kodu] Orijinal Çıkma Parça"
- Açıklama Şablonu:
"[Araç Markası] araçlar için [OEM No] numaralı [Parça Türü] orijinal çıkma yedek parça.
Parçanın araçtaki fonksiyonu ve kontrol ettiği elektronik sistemler (enjeksiyon, ateşleme, fren, konfor vb.).
Ürün profesyonel olarak sökülmüş, kontrolleri yapılmış ve kullanıma hazır durumdadır. Satın almadan önce parça numarasının kontrol edilmesi önerilir.

Kullanım Alanları:
- Uyumlu sistem 1
- Uyumlu sistem 2
- Motor & donanım yönetimi

TMS İthalat güvencesiyle kaliteli çıkma otomotiv elektronik yedek parçaları."

ZORUNLU ÇIKTI KURALLARI:
1. SADECE geçerli ve temiz bir JSON nesnesi döndür (Markdown backtickleri veya harici metin yazma).
2. JSON alanları:
{
  "title": string (Örn: "Renault Motor Beyni ECU Sagem S113717205D Orijinal Çıkma Motor Kontrol Ünitesi"),
  "brand": string (Örn: "Renault", "Volkswagen", "Mercedes-Benz", "BMW", "Audi", "Ford", "Fiat", "Peugeot"),
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

    return {
      success: true,
      oemNumber: args.oemNumber.trim(),
      title: parsed.title || `${args.oemNumber} Otomotiv Parçası`,
      brand: parsed.brand || "Genel",
      model: parsed.model || "",
      categoryId: matchedCat?._id,
      categoryName: matchedCat?.name || "Oto Elektronik",
      categorySlug: matchedCat?.slug || "oto-elektronik",
      condition: parsed.condition || "Orijinal Çıkma",
      description: parsed.description || "",
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
