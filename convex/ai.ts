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
  const producer = manufacturer.trim() || "Orijinal Ekipman Üreticisi";
  const partType = categoryName.trim() || "Oto Elektronik Parçası";
  const partNumber = oemNumber.trim();
  const stockCode = shelfCode?.trim().toUpperCase() || "Belirtilmemiş";
  const productCondition = condition.trim() || "Orijinal Çıkma";
  const compatibility = model.trim()
    ? `${vehicleBrand} ${model.trim()}`
    : `${vehicleBrand} Modelleri`;

  return `${partNumber} ${vehicleBrand} ${partType}
${partNumber}, ${vehicleBrand} araçlarda kullanılan ${partType} (${producer}) parçasıdır. Araç elektronik kontrol ve yönetim sistemlerinde görev yapan orijinal çıkma elektronik kontrol modülüdür.

Ürün Bilgileri
Ürün: ${partType}
Marka: ${vehicleBrand}
Model: ${compatibility}
Parça Kodu: ${partNumber}
OEM Referansı: ${partNumber}
Alternatif Referans: ${producer} / Belirtilmemiş
Parça Tipi: ${partType} Kontrol Modülü
Sistem: ${partType} ve Araç Elektronik Yönetimi
Raf / Stok Kodu: ${stockCode}
Durum: ${productCondition}

Referans Kodları
${partNumber}
Bu parça numarası, ${compatibility} araçları için orijinal donanım üreticisi (${producer}) referansı olarak listelenmektedir.

Uyumlu Araçlar
Marka | Model | Motor | Model Yılı
${vehicleBrand} | ${model.trim() || "Uyumlu Modeller"} | Tüm Motor Seçenekleri | Uygulamaya Göre

${partNumber} parça numaralı ürün ${vehicleBrand} araç serilerinde kullanılmaktadır. Araç donanımına göre soket, pin yapısı, yazılım ve versiyon numarası mutlaka kontrol edilmelidir.

Ürün Açıklaması
${partNumber} ${vehicleBrand} ${partType}, aracın ilgili elektronik kontrol ünitesi olarak sistem sensörleri ve aktüatörleri arasındaki iletişimi yönetir.
Bu parçada meydana gelen olası arızalarda gösterge panelinde arıza lambasının yanması, ilgili sistemde iletişim/CAN-Bus hatası veya modülün işlevini yerine getirememesi gibi belirtiler görülebilir.
Ürün profesyonel olarak araçtan sökülmüş, tüm soket ve pin kontrolleri yapılmış durumdadır. Çıkma elektronik parçalarda montaj sonrası aracın konfigürasyonuna göre adaptasyon, kodlama veya eşleştirme yapılması gerekebilir. Güvenlik ve doğru çalışma için montajın uzman servis personeli tarafından yapılması önerilir.

Uyumluluk Uyarısı
${partNumber} numarasının mevcut parçanız üzerindeki etiket referanslarıyla birebir karşılaştırılması önemlidir. Aynı araç ailesinde farklı donanım ve yazılım versiyonlarına sahip modüller bulunabildiğinden, yalnızca marka ve model bilgisine göre sipariş verilmemelidir.
Sipariş öncesinde mevcut parçanızın üzerindeki parça numarasını, soketlerini, fiziksel yapısını ve mümkünse araç şase (VIN) numarasını mutlaka karşılaştırınız.`;
}

function getAutomotivePartContextHints(oem: string): string {
  const clean = oem.replace(/[\s\-_.]/g, "").toUpperCase();
  const hints: string[] = [];

  // 1. Bosch 10-Digit Formats
  if (/^0281\d{6}$/.test(clean) || clean.startsWith("0281")) {
    hints.push("- BOSCH DİZEL SERİSİ (0281...): Bu parça Bosch EDC (Electronic Diesel Control) Dizel Motor Beynidir (ECU).");
  } else if (/^0261\d{6}$/.test(clean) || clean.startsWith("0261")) {
    hints.push("- BOSCH BENZİN SERİSİ (0261...): Bu parça Bosch Motronic / ME / MED Benzinli Motor Beynidir (ECU).");
  } else if (/^0265\d{6}$/.test(clean) || clean.startsWith("0265") || /^0273\d{6}$/.test(clean) || clean.startsWith("0273")) {
    hints.push("- BOSCH ABS/ESP SERİSİ (0265... / 0273...): Bu parça Bosch ABS / ESP Hidrolik ve Elektronik Fren Beynidir.");
  } else if (/^0285\d{6}$/.test(clean) || clean.startsWith("0285")) {
    hints.push("- BOSCH AIRBAG SERİSİ (0285...): Bu parça Bosch SRS / Hava Yastığı Kontrol Modülüdür.");
  }

  // 2. Rover / MG / Land Rover Specific Patterns
  if (clean === "YWC112330" || clean === "YWC000900" || clean === "YWC106880" || clean === "YWC112340" || clean === "YWC112320") {
    hints.push("- ROVER 75 / MG ZT GÖVDE KONFOR BEYNİ: 'YWC112330' / 'YWC000900' parçası Body Control Unit (BCU) / Gövde Konfor Beynidir (Merkezi kilit, cam ve gövde elektroniğini yönetir. Kesinlikle Airbag DEĞİLDİR).");
  } else if (clean === "YWC107010" || clean === "YWC105330" || clean === "YWC106230") {
    hints.push("- ROVER 25 / 45 AIRBAG BEYNİ: Bu parça Rover 25/45 SRS Airbag Kontrol Modülüdür.");
  } else if (/^NNN\d{6}$/i.test(clean) || /^MKC\d{6}$/i.test(clean) || /^MSB\d{6}$/i.test(clean)) {
    hints.push("- ROVER/LAND ROVER MOTOR BEYNİ: 'NNN...', 'MKC...', 'MSB...' kodları MEMS / TD5 / EDC Motor Beynidir.");
  }

  // 3. Magneti Marelli Patterns
  if (/^IAW/i.test(clean) || /^MJD/i.test(clean)) {
    hints.push("- MAGNETI MARELLI MOTOR BEYNİ: 'IAW...' ve 'MJD...' serileri Motor Kontrol Ünitesidir (ECU).");
  } else if (/^NBC/i.test(clean)) {
    hints.push("- MAGNETI MARELLI GÖVDE BEYNİ: 'NBC...' serisi Fiat Body Computer / Gövde Konfor Modülüdür.");
  }

  // 4. Siemens / Continental / Sagem Patterns
  if (/^5WK/i.test(clean) || /^5WP/i.test(clean) || /^S1[012]/i.test(clean)) {
    hints.push("- SIEMENS / CONTINENTAL / SAGEM: '5WK...', '5WP...', 'S11...' kodları Simos / Sirius / Sagem Motor Beyni veya CAS/BSI/UCH modülleridir.");
  }

  // 5. Delphi Patterns
  if (/^DCM/i.test(clean) || /^DDCR/i.test(clean)) {
    hints.push("- DELPHI DİZEL MOTOR BEYNİ: 'DCM...' ve 'DDCR' serileri 1.5 dCi / HDI / TDCi Dizel Motor Beynidir (ECU).");
  }

  // 6. VAG Group (VW / Audi / Seat / Skoda)
  if (/906\d{2,3}[A-Z]?$/.test(clean) || /03[8LGP]906/i.test(clean) || /06[AF]906/i.test(clean)) {
    hints.push("- VAG MOTOR BEYNİ: '...906...' içeren VAG referansları Motor Kontrol Ünitesidir (ECU).");
  } else if (/614\d{2,3}[A-Z]?$/.test(clean)) {
    hints.push("- VAG ABS FREN BEYNİ: '...614...' içeren VAG referansları ABS / ESP Hidrolik Fren Beynidir.");
  } else if (/959655[A-Z]?$/.test(clean)) {
    hints.push("- VAG AIRBAG BEYNİ: '...959 655...' içeren VAG referansları SRS Hava Yastığı Beynidir.");
  } else if (/907\d{2,3}[A-Z]?$/.test(clean)) {
    hints.push("- VAG GÖVDE / KONFOR: '...907...' içeren VAG referansları BCM / Gateway / Gövde Konfor Modülüdür.");
  }

  // 7. PSA (Peugeot / Citroen)
  if (/^96\d{6}80$/.test(clean) || /^98\d{6}80$/.test(clean)) {
    hints.push("- PSA (PEUGEOT / CITROEN): '96xxxxxx80' Peugeot-Citroen OEM donanım kodudur.");
  }

  // 8. Mercedes-Benz
  if (/^A\d{9,12}$/i.test(clean) || /^A\d{3}\d{3}\d{4}$/i.test(clean)) {
    hints.push("- MERCEDES-BENZ: 'A...' ile başlayan referans Mercedes-Benz orijinal elektronik kontrol ünitesidir.");
  }

  return hints.length > 0 ? "\nOTOMOTİV ÜRETİCİ PARÇA KODU TESPİT DOĞRULAMASI:\n" + hints.join("\n") : "";
}

async function searchWebForPartListings(oemNumber: string, hint?: string): Promise<string[]> {
  try {
    const rawOem = oemNumber.trim();
    // Do not append restrictive words like 'oto parca' to avoid filtering out global OEM databases
    const searchTerms = hint?.trim() ? `"${rawOem}" ${hint.trim()}` : `"${rawOem}"`;
    const query = encodeURIComponent(searchTerms);
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${query}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,tr;q=0.8",
      },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const snippets: string[] = [];
    const regex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let match;
    while ((match = regex.exec(html)) !== null && snippets.length < 8) {
      const cleanSnippet = match[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"')
        .trim();
      if (cleanSnippet && cleanSnippet.length > 15) {
        snippets.push(cleanSnippet);
      }
    }
    return snippets;
  } catch {
    return [];
  }
}

export const generateProductDetails = action({
  args: {
    oemNumber: v.string(),
    shelfCode: v.optional(v.string()),
    additionalHint: v.optional(v.string()),
    provider: v.optional(v.union(v.literal("gpt"), v.literal("gemini"))),
  },
  handler: async (ctx, args): Promise<GeneratedProductResult> => {
    const selectedProvider = args.provider || "gpt";
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    const openAiApiKey = process.env.OPENAI_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (selectedProvider === "gemini" && !geminiApiKey) {
      throw new Error(
        "Google Gemini API anahtarı bulunamadı. Lütfen .env.local dosyanıza GEMINI_API_KEY tanımlayınız."
      );
    }

    if (selectedProvider === "gpt" && !openRouterApiKey && !openAiApiKey) {
      throw new Error(
        "OpenRouter / OpenAI API anahtarı bulunamadı. Lütfen OPENROUTER_API_KEY veya OPENAI_API_KEY tanımlayınız."
      );
    }

    // 1. Fetch Categories and Live Web Search Results in parallel
    const [categories, liveWebFindings]: [any[], string[]] = await Promise.all([
      ctx.runQuery(api.categories.list, { onlyActive: false }),
      searchWebForPartListings(args.oemNumber, args.additionalHint),
    ]);

    const categoriesContext = (categories || [])
      .map((c: any) => `- "${c.name}" (slug: "${c.slug}")`)
      .join("\n");

    const partTaxonomyHints = getAutomotivePartContextHints(args.oemNumber);

    const systemPrompt = `Sen otomotiv elektronik ve elektromekanik parçaları (Motor Beyinleri, Gövde/Konfor Modülleri, Fren/ABS, Hava Yastığı/Airbag, Şanzıman Beyinleri, Cam Krikosu Motorları, Silecek Motorları, Sigorta Kutuları / BSM / BSI / SAM) konusunda uzman bir baş teknik ürün yöneticisisin.

GÖREVİN:
Verilen OEM / Parça Numarasını ve sağlanan CANLI İNTERNET ARAMA BULGULARINI inceleyerek parçanın türünü (Örn: Cam Motoru, Kapı Modülü, Motor Beyni, Gövde Beyni, ABS, Airbag, Şanzıman vb.), araç markasını, model/motor uyumluluğunu ve teknik özelliklerini %100 kusursuz doğrulukta tespit edip eksiksiz JSON üretmektir.

MEVCUT SİTE KATEGORİ LİSTESİ:
${categoriesContext}
${partTaxonomyHints}

ÖNCELİKLİ DOĞRULAMA KURALI:
1. CANLI İNTERNET PARÇA ARAMA BULGULARI ve KULLANICI EK AÇIKLAMASI birincil ve kesin gerçektir.
2. Parça bir "Cam Motoru" (Window Motor / Lève-vitre), "Silecek Motoru" (Wiper Motor), "Fan Motoru" veya "Röle" ise KESİNLİKLE Motor Beyni (ECU) veya Sigorta Kutusu (BSM) olarak uydurma. Gerçek parça türü neyse başlık, uyumlu araçlar ve tüm açıklamayı o parça türüne göre oluştur.
3. PSA (96xxxxxx80) numaraları sadece ECU/BSM değildir; cam motoru, kilit motoru, sensör vb. olabilir. Arama sonucundaki donanım türüne kesinlikle sadık kal.

ÜRÜN BİLGİSİ KURALLARI:
- Ürün Başlığı: "[Araç Markası] [Model/Seri] [Parça Türü/Modül Adı] [Üretici/Model] [OEM Kodu] Orijinal Çıkma"
- manufacturer: Üreticiyi yaz (ör. "VAG (Audi / VW)", "Bosch", "Continental", "Magneti Marelli", "Delphi", "Siemens VDO", "Valeo", "Denso", "Pektron", "Peugeot / Citroen").
- brand: Ana araç markası (ör. "Peugeot", "Citroen", "Rover", "Renault", "Volkswagen", "BMW", "Mercedes-Benz", "Fiat", "Ford", "Audi").
- categorySlug: Yukarıdaki listeden parçaya en uygun kategori slug'ını seç.

AÇIKLAMA (description) ALANI FORMATI (ZORUNLU ŞABLON):
description alanında BİREBİR şu başlıklar ve zengin teknik akış yer almalıdır (Markdown formatında):

[OEM_KODU] [Marka] [Parça Türü]
[OEM_KODU], [Marka] araçlarda kullanılan orijinal [Parça Türü] parçasıdır. [Parçanın araç üzerindeki konumu, temel görevi ve yönettiği sistemler hakkında 2-3 cümlelik net teknik açıklama].

Ürün Bilgileri
Ürün: [Parça Türü / Modül Adı]
Marka: [Araç Markası]
Model: [Uyumlu Araç Modelleri ve Kasa Tipleri]
Parça Kodu: [OEM Kodu]
OEM Referansı: [OEM Referansı]
Alternatif Referans: [Varsa İkincil / Bosch / Üretici Kodu veya Yoksa Belirtilmemiş]
Parça Tipi: [Elektronik Kontrol Ünitesi / Cam Motoru / Gövde Modülü / vb.]
Sistem: [Yönetilen Sistem Adı, örn: Elektrikli Cam ve Kapı Sistemi / Gövde Elektroniği / Motor Yönetim Sistemi / ABS Fren]

Referans Kodları
[OEM Kodu]
[Varsa Alternatif Üretici Kodları]
[Parça kodunun kataloglardaki kullanım ve çapraz referans açıklaması]

Uyumlu Araçlar
Marka | Model | Motor | Model Yılı
[Marka 1] | [Model 1] | [Motor 1] | [Yıl Aralığı 1]
[Marka 2] | [Model 2] | [Motor 2] | [Yıl Aralığı 2]

[Uyumlu araçlar, motor kodları ve soket/donanım versiyon kontrolü ile ilgili 1-2 cümlelik teyit notu]

Ürün Açıklaması
[Parçanın detaylı teknik çalışma prensibi, montaj konumu ve elektrik/sinyal bağlantıları].
[Bu parçada meydana gelen olası arıza belirtileri: çalışmama, zorlanma, arıza lambası, ses yapma veya iletişim kaybı].
[Montaj, çıkma parça testi, soket bağlantıları ve uzman servis montajı tavsiyesi].

Uyumluluk Uyarısı
[Parça referans numaralarının mevcut parçanız üzerindeki etiket ile birebir karşılaştırılmasının önemi. Donanım, soket ve yön (sağ/sol) uyarısı].
Sipariş öncesinde mevcut parçanızın üzerindeki parça numarasını, soketlerini, pin yapısını ve mümkünse araç şase (VIN) numarasını mutlaka karşılaştırınız.

ZORUNLU ÇIKTI KURALLARI:
1. SADECE geçerli ve temiz bir JSON nesnesi döndür (Markdown backtickleri veya harici metin yazma).
2. JSON alanları:
{
  "title": string,
  "brand": string,
  "manufacturer": string,
  "model": string,
  "categorySlug": string,
  "condition": string,
  "description": string,
  "metaTitle": string,
  "metaDescription": string,
  "metaKeywords": string,
  "tags": array of strings,
  "slug": string
}`;

    const liveWebContext =
      liveWebFindings.length > 0
        ? `\nCANLI İNTERNET PARÇA ARAMA BULGULARI:\n${liveWebFindings.map((f, i) => `${i + 1}. ${f}`).join("\n")}\n(ZORUNLU KURAL: Yukarıdaki canlı internet arama sonuçlarında geçen parça türü [ör. Cam Motoru, Kapı Modülü, Motor Beyni, Gövde Beyni, ABS, vb.] ve araç marka/modelini birincil gerçek kabul et.)\n`
        : "";

    const userMessage = `Lütfen aşağıdaki OEM / Parça Numarasını otomotiv katalog standartlarına göre analiz ederek yukarıdaki zorunlu açıklama şablonuna birebir uygun şekilde ürün bilgilerini JSON olarak üret:
OEM / Parça Numarası: ${args.oemNumber.trim()}
Raf / Stok Kodu: ${args.shelfCode?.trim().toUpperCase() || "Belirtilmemiş"}
${args.additionalHint ? `KULLANICI EK AÇIKLAMASI / DOĞRULAMA İPUCU: "${args.additionalHint}" (Kullanıcı bu parçanın türü veya araç modeli hakkında bu bilgiyi vermiştir. Parçayı analiz ederken bu yönlendirmeyi öncelikle doğrula ve dikkate al.)` : ""}
${liveWebContext}`;

    let content = "";

    // 1. Google Gemini Flash API Handler
    if (selectedProvider === "gemini" && geminiApiKey) {
      const geminiModels = ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-1.5-flash"];
      for (const model of geminiModels) {
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
                temperature: 0.15,
                maxOutputTokens: 6000,
                responseMimeType: "application/json",
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (content) break;
          } else {
            const errText = await response.text();
            console.error(`Google Gemini (${model}) Hatası:`, response.status, errText);
          }
        } catch (e: any) {
          console.error(`Google Gemini (${model}) Fetch Hatası:`, e?.message);
        }
      }
    }

    // 2. OpenRouter with GPT-5.6 Luna + Web Search Tool
    if (selectedProvider === "gpt" && openRouterApiKey) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openRouterApiKey}`,
            "HTTP-Referer": "https://tmsithalat.com",
            "X-Title": "TMS Ithalat AI Product Generator",
          },
          body: JSON.stringify({
            model: "openai/gpt-5.6-luna",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
            temperature: 0.1,
            max_tokens: 5500,
            response_format: { type: "json_object" },
            tools: [
              {
                type: "openrouter:web_search",
              },
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          content = data.choices?.[0]?.message?.content || "";
        } else {
          const errText = await response.text();
          console.error("OpenRouter API Hatası:", response.status, errText);
        }
      } catch (e: any) {
        console.error("OpenRouter Fetch Hatası:", e?.message);
      }
    }

    // 3. Direct OpenAI API fallback (if OPENAI_API_KEY exists and no content yet)
    if (!content && selectedProvider === "gpt" && openAiApiKey) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-5.6-luna",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
            temperature: 0.2,
            max_tokens: 3500,
            response_format: { type: "json_object" },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          content = data.choices?.[0]?.message?.content || "";
        } else {
          const errText = await response.text();
          console.error("OpenAI Direct API Hatası:", response.status, errText);
        }
      } catch (e: any) {
        console.error("OpenAI Direct Fetch Hatası:", e?.message);
      }
    }

    if (!content) {
      if (selectedProvider === "gemini") {
        throw new Error(
          "Google Gemini modelinden geçerli bir yanıt alınamadı. Lütfen GEMINI_API_KEY kotanızı kontrol ediniz."
        );
      } else {
        throw new Error(
          "OpenRouter / GPT Luna modelinden yanıt alınamadı. Lütfen OPENROUTER_API_KEY bakiyenizi (https://openrouter.ai/credits) kontrol ediniz veya 'Gemini ile Üret' seçeneğini deneyiniz."
        );
      }
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
      description:
        parsed.description && typeof parsed.description === "string" && parsed.description.trim().length > 50
          ? parsed.description.trim()
          : buildCatalogDescription({
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
