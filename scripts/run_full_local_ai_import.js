const AdmZip = require("adm-zip");
const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");
const fs = require("fs");
const path = require("path");

const DEV_CONVEX_URL = "https://aromatic-elk-297.convex.cloud";
const PRODUCTS_ZIP_PATH = "C:\\Users\\volkan\\Desktop\\products.zip";
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

const CSV_OUTPUT_PATH = "C:\\Users\\volkan\\Desktop\\inceleme_listesi.csv";
const JSON_OUTPUT_PATH = "C:\\Users\\volkan\\Desktop\\inceleme_listesi.json";

// High Performance: 12 Parallel Workers
const CONCURRENCY = 12;
const MODEL_NAME = "google/gemini-2.5-flash";

const AUTOMOTIVE_PATTERNS = [
  { name: "Bosch Part No", regex: /0\s*2[68][0-9]\s*[0-9]{3}\s*[0-9]{3}/i },
  { name: "VAG (VW/Audi) OEM", regex: /[0-9A-Z]{3}\s*[0-9]{3}\s*[0-9]{3}\s*[A-Z]{0,3}/i },
  { name: "Mercedes-Benz OEM", regex: /A\s*[0-9]{3}\s*[0-9]{3}\s*[0-9]{2}\s*[0-9]{2}|A\s*[0-9]{9,11}/i },
  { name: "Renault OEM", regex: /8200\s*[0-9]{6}|S11[0-9A-Z]{7}|HOM8200|23710\s*[0-9A-Z]{5}R?/i },
  { name: "Fiat / Alfa / Lancia", regex: /(51|55|46|717|500)[0-9]{5,7}/i },
  { name: "Opel / GM OEM", regex: /(09|12|55|13|24)[0-9]{6}|Q1T[0-9A-Z]{6}/i },
  { name: "Ford OEM", regex: /[0-9A-Z]{4}\s*1[0-9][A-Z0-9]{3,5}\s*[A-Z]{1,3}/i },
  { name: "PSA Peugeot Citroen", regex: /96\s*[0-9]{6,8}\s*80/i },
  { name: "Siemens / Continental", regex: /5WK[0-9A-Z]{4,7}|S1[0-9A-Z]{7,9}/i },
  { name: "Magneti Marelli / Delphi", regex: /IAW\s*[0-9A-Z\.]+|DELPHI\s*[0-9A-Z]+/i },
  { name: "Nissan OEM", regex: /23710\s*[0-9A-Z]{5}/i },
];

function validateAutomotiveOEM(oemStr, secondaryStr) {
  if (!oemStr || oemStr === "null" || oemStr.trim().length < 4) {
    return { valid: false, reason: "Etiket okunamadı veya fotoğrafta yok" };
  }

  const clean = oemStr.trim();
  for (const p of AUTOMOTIVE_PATTERNS) {
    if (p.regex.test(clean)) {
      return { valid: true, pattern: p.name };
    }
  }

  if (secondaryStr && secondaryStr !== "null") {
    for (const p of AUTOMOTIVE_PATTERNS) {
      if (p.regex.test(secondaryStr)) {
        return { valid: true, pattern: p.name + " (İkincil Kod)" };
      }
    }
  }

  if (/^[A-Za-z0-9\s\-\.]{6,20}$/.test(clean) && !clean.includes("UNKNOWN") && !clean.includes("NONE")) {
    return { valid: true, pattern: "Standart Parça Kodu" };
  }

  return { valid: false, reason: "Okunan metin geçerli otomotiv parça formatına uymuyor" };
}

async function analyzeWithAI(base64Image, shelfCode) {
  const systemPrompt = `Sen oto elektronik parçaları (ECU, ABS, Airbag, BCM, Sigorta Kutusu vb.) konusunda uzman bir teknik ürün yöneticisisin.
Fotoğraftaki oto parçasının üzerindeki etiketi çok dikkatli oku.
Depo raf kodu: ${shelfCode}.
Eğer etiket silikse, okunmuyorsa veya fotoğrafta etiket yoksa oemNumber alanını null olarak döndür. Asla uydurma.

Sadece temiz JSON döndür:
{
  "oemNumber": "Etiketteki ana OEM parça numarası veya null",
  "secondaryCode": "Bosch / Siemens / Valeo / İkincil parça no veya null",
  "brand": "Araç markası (Örn: Renault, Volkswagen, Audi, Mercedes-Benz, BMW, Opel, Fiat, Ford, Peugeot, Citroen)",
  "model": "Uyumlu araç modeli veya null",
  "partType": "Parçanın Türkçe adı (Örn: Motor Beyni (ECU), ABS Beyni, Direksiyon Beyni, Sigorta Kutusu)",
  "manufacturer": "Parça üreticisi (Örn: Bosch, Siemens, Magneti Marelli, Mitsubishi Electric, Valeo, Delphi)",
  "electronicUnitName": "Teknik İngilizce/Almanca adı"
}`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://tmsithalat.com",
        "X-Title": "TMS Production Vision",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        max_tokens: 350,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Etiketi oku. Depo Raf Kodu: ${shelfCode}.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const contentStr = data.choices?.[0]?.message?.content || "";
      const cleaned = contentStr.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned);
    }
  } catch (err) {
    // Failover
  }
  return null;
}

// Concurrency pool helper
async function asyncPool(poolLimit, array, iteratorFn) {
  const ret = [];
  const executing = [];
  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item, array));
    ret.push(p);

    if (poolLimit <= array.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

async function runProductionImport() {
  console.log(`🚀 ${MODEL_NAME} İLE ${CONCURRENCY} PARALEL WORKER LOKAL AKTARIMI BAŞLATILIYOR...`);
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const client = new ConvexHttpClient(DEV_CONVEX_URL);

  // 1. Reset Dev DB & Clean Uploads
  console.log("\n🧹 1. Adım: Lokal veritabanı ve klasör temizleniyor...");
  const initRes = await client.mutation(api.importData.initCategoriesAndBrands, {});
  const categoryMap = initRes.categoryMap;

  let hasMore = true;
  while (hasMore) {
    const delRes = await client.mutation(api.importData.cleanProductsBatch, { limit: 500 });
    hasMore = delRes.remaining;
  }

  if (fs.existsSync(UPLOAD_DIR)) {
    fs.readdirSync(UPLOAD_DIR).forEach((f) => {
      try {
        fs.unlinkSync(path.join(UPLOAD_DIR, f));
      } catch (e) {}
    });
  }
  console.log("✅ Lokal veritabanı ve klasör temizlendi.");

  // 2. Open products.zip
  console.log("\n📦 2. Adım: products.zip taranıyor...");
  const zip = new AdmZip(PRODUCTS_ZIP_PATH);
  const zipEntries = zip.getEntries();

  const productsMap = new Map();

  for (const entry of zipEntries) {
    if (entry.isDirectory) continue;
    const baseName = path.basename(entry.entryName);
    if (!baseName.match(/\.(jpg|jpeg|png)$/i)) continue;

    const match = baseName.match(/^([a-z0-9-]+)-([0-9]+)\.(jpg|jpeg|png)$/i);
    if (!match) continue;

    const safeShelf = match[1].toLowerCase();
    const imgIndex = parseInt(match[2], 10);

    if (safeShelf.startsWith("cd-") || safeShelf.length < 3) continue;

    if (!productsMap.has(safeShelf)) {
      productsMap.set(safeShelf, {
        safeShelf,
        entries: [],
      });
    }

    productsMap.get(safeShelf).entries.push({ entry, index: imgIndex });
  }

  const allProducts = Array.from(productsMap.values());
  allProducts.forEach((p) => p.entries.sort((a, b) => a.index - b.index));

  console.log(`✅ Toplam ${allProducts.length} adet geçerli parça işlenecek.`);

  // 3. Initialize CSV File
  fs.writeFileSync(
    CSV_OUTPUT_PATH,
    "\uFEFFDepo Kodu,Durum,Hata / İnceleme Sebebi,Marka,Kategori\n",
    "utf8"
  );

  const reviewList = [];
  let totalProcessed = 0;
  let totalVerified = 0;
  let totalNeedsReview = 0;
  let pendingInsertions = [];

  console.log(`\n⚡ 3. Adım: Yapay Zeka Taraması ve Dosya İsimlendirmesi Başladı...\n`);

  async function processOneProduct(item) {
    const firstEntry = item.entries[0].entry;
    const imgBuffer = firstEntry.getData();
    const base64 = imgBuffer.toString("base64");

    const aiData = await analyzeWithAI(base64, item.safeShelf);

    const oemRaw = aiData?.oemNumber || null;
    const secondary = aiData?.secondaryCode || null;
    const validation = validateAutomotiveOEM(oemRaw, secondary);

    let needsReview = false;
    let reviewReason = "";
    let finalOEM = "";
    let filePrefix = "";
    let finalBrand = aiData?.brand || "Genel Uyumlu";
    let finalModel = aiData?.model || "";
    let manufacturer = aiData?.manufacturer || finalBrand;
    let partType = aiData?.partType || "Oto Elektronik Parçası";
    let unitName = aiData?.electronicUnitName || "Electronic Control Unit";
    const imageUrls = [];

    if (validation.valid && oemRaw) {
      needsReview = false;
      reviewReason = "Doğrulandı (" + validation.pattern + ")";
      finalOEM = oemRaw.trim();
      const safeOEM = finalOEM.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
      filePrefix = `${safeOEM}-${item.safeShelf}`;
      totalVerified++;

      // Save photos ONLY for verified OEM products
      item.entries.forEach((e, idx) => {
        const fileName = `${filePrefix}-${idx + 1}.jpg`;
        const filePath = path.join(UPLOAD_DIR, fileName);
        fs.writeFileSync(filePath, e.entry.getData());
        imageUrls.push(`/uploads/products/${fileName}`);
      });
    } else {
      needsReview = true;
      reviewReason = validation.reason || "Etiket okunamadı / silik";
      finalOEM = "İNCELEME GEREKLİ";
      totalNeedsReview++;

      // NO IMAGE FILES WRITTEN TO DISK FOR NEEDS REVIEW!
      reviewList.push({
        shelfCode: item.safeShelf,
        brand: finalBrand,
        reason: reviewReason,
      });

      fs.appendFileSync(
        CSV_OUTPUT_PATH,
        `"${item.safeShelf}","İNCELEME GEREKLİ","${reviewReason}","${finalBrand}","${partType}"\n`,
        "utf8"
      );
    }

    const finalTitle = needsReview
      ? `${finalBrand} ${partType} (${item.safeShelf}) Orijinal Çıkma (İnceleme Gerekli)`
      : `${finalBrand} ${partType} ${manufacturer} ${finalOEM} Orijinal Çıkma ${unitName}`;

    const description = `${finalBrand} ${finalModel ? finalModel + " " : ""}araçlar için ${manufacturer} üretimi ${finalOEM !== "İNCELEME GEREKLİ" ? finalOEM + " numaralı " : ""}${partType} (${unitName}) orijinal çıkma yedek parça.

Parça Durumu & Kontroller:
Ürün profesyonel olarak sökülmüş ve kullanıma hazır durumdadır. ${needsReview ? "Etiket incelemesi devam etmektedir." : `Satın almadan önce parça numarasının (${finalOEM}) kontrol edilmesi önerilir.`}

Ürün Özellikleri
Parça No: ${finalOEM}
Raf / Stok Kodu: ${item.safeShelf}
Araç Markası: ${finalBrand}
Parça Türü: ${partType}
Elektronik Kontrol Ünitesi: ${unitName}
Durum: Orijinal Çıkma
Uyumluluk: ${finalBrand} ${finalModel} modelleri

Kullanım Alanları
• ${finalBrand} elektronik kontrol sistemleri
• ${partType} yönetimi
• Sensör ve aktüatör kontrolü
• Oto elektronik sistemleri

TMS İthalat güvencesiyle kaliteli çıkma otomotiv elektronik yedek parçaları.`;

    const brandSlug = finalBrand.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    const slug = `${brandSlug}-${needsReview ? "inceleme-" + item.safeShelf : filePrefix}`;

    const tags = [
      item.safeShelf,
      finalBrand,
      manufacturer,
      partType,
      "Orijinal Çıkma",
      needsReview ? "İnceleme Gerekli" : "Doğrulanmış OEM",
    ];
    if (finalOEM !== "İNCELEME GEREKLİ") tags.push(finalOEM);

    const productDoc = {
      title: finalTitle,
      slug,
      oemNumber: finalOEM,
      shelfCode: item.safeShelf,
      categoryId: Object.values(categoryMap)[0],
      brand: finalBrand,
      model: finalModel,
      condition: "Orijinal Çıkma",
      inStock: true,
      description,
      images: imageUrls,
      metaTitle: `${finalTitle} | TMS İthalat`,
      metaDescription: `${finalBrand} ${partType}. TMS İthalat güvencesiyle test edilmiş orijinal çıkma parça.`,
      metaKeywords: `${finalOEM}, ${item.safeShelf}, ${finalBrand}, ${partType}, TMS İthalat`,
      tags,
      needsReview,
      reviewReason,
    };

    pendingInsertions.push(productDoc);
    totalProcessed++;

    if (pendingInsertions.length >= 30) {
      const toSend = [...pendingInsertions];
      pendingInsertions = [];
      await client.mutation(api.importData.batchInsertProducts, { products: toSend });
    }

    const percent = Math.round((totalProcessed / allProducts.length) * 100);
    process.stdout.write(
      `\r⚡ İlerleme: %${percent} (${totalProcessed}/${allProducts.length}) | ✅ Doğrulanan: ${totalVerified} | ⚠️ İnceleme: ${totalNeedsReview}`
    );
  }

  await asyncPool(CONCURRENCY, allProducts, processOneProduct);

  if (pendingInsertions.length > 0) {
    await client.mutation(api.importData.batchInsertProducts, { products: pendingInsertions });
  }

  fs.writeFileSync(JSON_OUTPUT_PATH, JSON.stringify(reviewList, null, 2), "utf8");

  console.log(`\n\n🎉 LOKAL AKTARIM TAMAMLANDI!`);
  console.log(`✅ Toplam İşlenen Ürün: ${totalProcessed}`);
  console.log(`✅ Doğrulanan OEM Kodlu Ürün: ${totalVerified}`);
  console.log(`⚠️ İnceleme Gereken Ürün: ${totalNeedsReview}`);
  console.log(`\n📄 İnceleme Listesi Masaüstünüze Kaydedildi:`);
  console.log(`👉 Excel / CSV: ${CSV_OUTPUT_PATH}`);
  console.log(`👉 JSON: ${JSON_OUTPUT_PATH}`);
}

runProductionImport().catch(console.error);
