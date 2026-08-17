const AdmZip = require("adm-zip");
const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");
const fs = require("fs");
const path = require("path");

const DEV_CONVEX_URL = "https://aromatic-elk-297.convex.cloud";
const PRODUCTS_ZIP_PATH = "C:\\Users\\volkan\\Desktop\\products.zip";
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const CSV_OUTPUT_PATH = "C:\\Users\\volkan\\Desktop\\inceleme_listesi.csv";
const JSON_OUTPUT_PATH = "C:\\Users\\volkan\\Desktop\\inceleme_listesi.json";

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
  const prompt = `Sen otomotiv elektronik parçaları (ECU, ABS, Airbag, BCM, Sigorta Kutusu vb.) konusunda uzman bir teknik ürün yöneticisisin.
Fotoğraftaki oto parçasının üzerindeki etiketi çok dikkatli oku.
Depo raf kodu: ${shelfCode}.
Eğer etiket silikse, okunmuyorsa veya fotoğrafta etiket yoksa oemNumber alanını null olarak döndür. Asla uydurma.

Sadece geçerli bir JSON objesi döndür:
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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/jpeg", data: base64Image } },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: "application/json",
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleaned);
      }
    } else {
      const errData = await res.json();
      console.error("API Error:", res.status, errData.error?.message);
    }
  } catch (err) {
    console.error("Fetch Exception:", err.message);
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

async function runTest20() {
  console.log("🧪 20 ADET ÜRÜN İLE HIZ, DOĞRULUK VE MALİYET TESTİ BAŞLATILIYOR...\n");
  const startTime = Date.now();

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const client = new ConvexHttpClient(DEV_CONVEX_URL);

  // 1. Reset Dev DB & Clean Uploads
  console.log("🧹 1. Adım: Lokal veritabanı hazırlanıyor...");
  const initRes = await client.mutation(api.importData.initCategoriesAndBrands, {});
  const categoryMap = initRes.categoryMap;
  await client.mutation(api.importData.cleanProductsBatch, { limit: 500 });

  if (fs.existsSync(UPLOAD_DIR)) {
    fs.readdirSync(UPLOAD_DIR).forEach((f) => {
      try {
        fs.unlinkSync(path.join(UPLOAD_DIR, f));
      } catch (e) {}
    });
  }

  // 2. Open products.zip and pick 20 diverse items
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

  // Pick 20 items from different groups
  const allProducts = Array.from(productsMap.values());
  allProducts.forEach((p) => p.entries.sort((a, b) => a.index - b.index));

  // Select 20 items distributed across the catalog
  const step = Math.floor(allProducts.length / 20);
  const testSample = [];
  for (let i = 0; i < 20; i++) {
    testSample.push(allProducts[i * step]);
  }

  console.log(`📦 20 adet farklı kategoriden ürün seçildi.`);
  console.log(`⚡ 5 Paralel Worker ile Yapay Zeka Taraması Başlıyor...\n`);

  const reportRows = [];
  const productsToInsert = [];
  const reviewList = [];

  let verifiedCount = 0;
  let reviewCount = 0;

  async function processItem(item) {
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
      verifiedCount++;

      // Save photos for verified OEM
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
      reviewCount++;

      reviewList.push({
        shelfCode: item.safeShelf,
        brand: finalBrand,
        reason: reviewReason,
      });
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

    productsToInsert.push({
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
    });

    reportRows.push({
      code: item.safeShelf,
      oem: finalOEM,
      brand: finalBrand,
      model: finalModel || "—",
      status: needsReview ? "⚠️ İNCELEME GEREKLİ" : "✅ DOĞRULANDI",
      savedFiles: imageUrls.length > 0 ? imageUrls[0].split("/").pop() : "Yok (JSON'da)",
    });
  }

  // Run with 5 workers
  await asyncPool(5, testSample, processItem);

  // Insert to dev Convex
  await client.mutation(api.importData.batchInsertProducts, { products: productsToInsert });
  fs.writeFileSync(JSON_OUTPUT_PATH, JSON.stringify(reviewList, null, 2), "utf8");

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n==========================================================================================================");
  console.log("                                📊 20 ÜRÜNLÜK KALİTE VE MALİYET DENETİM RAPORU                            ");
  console.log("==========================================================================================================");
  console.table(reportRows);
  console.log("==========================================================================================================");
  console.log(`⏱️ Toplam Süre: ${totalTime} saniye (Ortalama: ${(totalTime / 20).toFixed(2)} sn/ürün)`);
  console.log(`✅ Doğrulanan Ürün: ${verifiedCount} / 20 (${Math.round((verifiedCount / 20) * 100)}%)`);
  console.log(`⚠️ İnceleme Gereken: ${reviewCount} / 20 (${Math.round((reviewCount / 20) * 100)}%)`);
  console.log(`💰 Bu 20 Görselin Google API Maliyeti: ~$0.002 USD (~0.07 TL)`);
  console.log(`👉 Hemen tarayıcınızda 'http://localhost:3000/urunler' adresinden 20 ürünü inceleyebilirsiniz!`);
}

runTest20().catch(console.error);
