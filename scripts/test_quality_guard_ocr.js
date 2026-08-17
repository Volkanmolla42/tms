const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");

const DEV_CONVEX_URL = "https://aromatic-elk-297.convex.cloud";
const ZIP_PATH = "C:\\Users\\volkan\\Desktop\\data.zip";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");

// Automotive regex validation patterns
const AUTOMOTIVE_PATTERNS = [
  { name: "Bosch Part No", regex: /0\s*2[68][0-9]\s*[0-9]{3}\s*[0-9]{3}/i },
  { name: "VAG (VW/Audi) OEM", regex: /[0-9A-Z]{3}\s*[0-9]{3}\s*[0-9]{3}\s*[A-Z]{0,3}/i },
  { name: "Mercedes-Benz OEM", regex: /A\s*[0-9]{3}\s*[0-9]{3}\s*[0-9]{2}\s*[0-9]{2}|A\s*[0-9]{9,11}/i },
  { name: "Renault OEM", regex: /8200\s*[0-9]{6}|S11[0-9A-Z]{7}|HOM8200/i },
  { name: "Fiat / Alfa / Lancia", regex: /(51|55|46|717|500)[0-9]{5,7}/i },
  { name: "Opel / GM OEM", regex: /(09|12|55|13)[0-9]{6}|Q1T[0-9A-Z]{6}/i },
  { name: "Ford OEM", regex: /[0-9A-Z]{4}\s*1[0-9][A-Z0-9]{3,5}\s*[A-Z]{1,3}/i },
  { name: "PSA Peugeot Citroen", regex: /96\s*[0-9]{6,8}\s*80/i },
  { name: "Siemens / Continental", regex: /5WK[0-9A-Z]{4,7}|S1[0-9A-Z]{7,9}/i },
  { name: "Magneti Marelli / Delphi", regex: /IAW\s*[0-9A-Z\.]+|DELPHI\s*[0-9A-Z]+/i },
];

function validateAutomotiveOEM(oemStr, secondaryStr) {
  if (!oemStr || oemStr === "null" || oemStr.trim().length < 4) {
    return { valid: false, reason: "Etiket okunamadı veya OEM kodu fotoğrafta yok" };
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

  // If length is at least 6 alphanumeric characters and not a dummy word
  if (/^[A-Za-z0-9\s\-\.]{6,20}$/.test(clean) && !clean.includes("UNKNOWN") && !clean.includes("NONE")) {
    return { valid: true, pattern: "Genel Standart Parça Kodu" };
  }

  return { valid: false, reason: "Okunan metin geçerli otomotiv parça formatına uymuyor" };
}

async function analyzeWithAI(base64Image, shelfCode, folderHint) {
  const systemPrompt = `Sen otomotiv elektronik parçaları (ECU, ABS, Airbag, BCM, Sigorta Kutusu vb.) konusunda uzman bir teknik ürün yöneticisisin.
Sana bir oto elektronik parçasının fotoğrafı verilecek. Fotoğrafın üzerindeki etiketi/etiketleri (parça numaralarını, üretici kodlarını, araç marka ve modelini) çok dikkatli oku.
Eğer etiket silikse, okunmuyorsa veya fotoğrafta etiket yoksa oemNumber alanını null olarak döndür. Asla uydurma.

ZORUNLU JSON ÇIKTISI (Sadece temiz JSON):
{
  "oemNumber": "Etiketteki ana OEM parça numarası veya null",
  "secondaryCode": "Bosch / Siemens / Valeo / İkincil parça no veya null",
  "brand": "Araç markası (Örn: Renault, Volkswagen, Audi, Mercedes-Benz, BMW, Opel, Fiat, Ford, Peugeot, Citroen)",
  "model": "Uyumlu araç modeli (Örn: Corsa B, Passat 2.5 TDI) veya null",
  "partType": "Parçanın Türkçe adı (Örn: Motor Beyni (ECU), ABS / ESP Beyni, Direksiyon Beyni, Sigorta Kutusu)",
  "manufacturer": "Parça üreticisi (Örn: Bosch, Siemens, Magneti Marelli, Mitsubishi Electric, Valeo, Delphi)",
  "electronicUnitName": "Teknik İngilizce/Almanca adı",
  "confidence": "HIGH | MEDIUM | LOW"
}`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://tmsithalat.com",
        "X-Title": "TMS Quality Guard OCR",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        max_tokens: 1000,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Etiketi oku. Dosya ipucu: ${folderHint} (Depo Kodu: ${shelfCode}).`,
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
    console.error("AI API Error:", err.message);
  }
  return null;
}

async function runQualityGuardTest() {
  console.log("🛡️ OTOMOTİV DOĞRULAMA & KALİTE KONTROL TESTİ BAŞLATILIYOR (10 ÜRÜN)...\n");

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const client = new ConvexHttpClient(DEV_CONVEX_URL);

  // 1. Pick 10 diverse sample products
  const psScript = `
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $zip = [System.IO.Compression.ZipFile]::OpenRead('${ZIP_PATH.replace(/\\/g, "\\\\")}')
  $dest = '${UPLOAD_DIR.replace(/\\/g, "\\\\")}'

  $targetCodes = @(
      '201.01.0347', 
      '701.01.0001', 
      '801.01.0001', 
      '301.02.0005', 
      '401.10.0002',
      '901.10.0011',
      '201.06.0119',
      '701.02.0010',
      '601.01.0004',
      '501.01.0002'
  )
  $extracted = [System.Collections.Generic.List[object]]::new()

  foreach ($code in $targetCodes) {
      $entries = $zip.Entries | Where-Object { $_.FullName -match $code -and $_.Name -match '\\.(jpg|jpeg)$' }
      if ($entries.Count -gt 0) {
          $firstEntry = $entries[0]
          $safeCode = $code.ToLower() -replace '[^a-z0-9]', '-' -replace '-+', '-'
          $imgFile = "$safeCode-1.jpg"
          $outPath = Join-Path $dest $imgFile
          
          [System.IO.Compression.ZipFileExtensions]::ExtractToFile($firstEntry, $outPath, $true)
          
          $obj = [PSCustomObject]@{
              Code = $code
              SafeCode = $safeCode
              CategoryPath = $firstEntry.FullName
              ImagePath = $outPath
              ImageUrl = "/uploads/products/$imgFile"
          }
          $extracted.Add($obj)
      }
  }
  $zip.Dispose()
  $extracted | ConvertTo-Json | Out-File -FilePath 'temp_guard_samples.json' -Encoding utf8
  `;

  fs.writeFileSync("temp_extract_guard.ps1", psScript);
  execSync("powershell -ExecutionPolicy Bypass -File temp_extract_guard.ps1");
  try { fs.unlinkSync("temp_extract_guard.ps1"); } catch (e) {}

  const rawJson = fs.readFileSync("temp_guard_samples.json", "utf8").replace(/^\uFEFF/, "");
  const samples = JSON.parse(rawJson);
  try { fs.unlinkSync("temp_guard_samples.json"); } catch (e) {}

  // 2. Prepare database
  const initRes = await client.mutation(api.importData.initCategoriesAndBrands, {});
  const categoryMap = initRes.categoryMap;
  await client.mutation(api.importData.cleanProductsBatch, { limit: 100 });

  // 3. Process products through Quality Guard
  const productsToInsert = [];
  const reportRows = [];

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    process.stdout.write(`\r[${i + 1}/${samples.length}] Yapay zeka inceliyor: ${s.Code}...`);

    const imgBuffer = fs.readFileSync(s.ImagePath);
    const base64 = imgBuffer.toString("base64");

    const aiData = await analyzeWithAI(base64, s.Code, s.CategoryPath);
    const oemRaw = aiData?.oemNumber || null;
    const secondary = aiData?.secondaryCode || null;

    // Run automotive pattern validation
    const validation = validateAutomotiveOEM(oemRaw, secondary);

    let needsReview = false;
    let reviewReason = "";
    let finalOEM = "";
    let finalTitle = "";
    let finalBrand = aiData?.brand || "Genel Uyumlu";
    let finalModel = aiData?.model || "";
    let manufacturer = aiData?.manufacturer || finalBrand;
    let partType = aiData?.partType || "Oto Elektronik Parçası";
    let unitName = aiData?.electronicUnitName || "Electronic Unit";

    if (validation.valid && oemRaw) {
      needsReview = false;
      reviewReason = "Doğrulandı (" + validation.pattern + ")";
      finalOEM = oemRaw.trim();
      finalTitle = `${finalBrand} ${partType} ${manufacturer} ${finalOEM} Orijinal Çıkma ${unitName}`;
    } else {
      needsReview = true;
      reviewReason = validation.reason;
      finalOEM = "İNCELEME GEREKLİ";
      finalTitle = `${finalBrand} ${partType} (Raf: ${s.Code}) Orijinal Çıkma (İnceleme Gerekli)`;
    }

    const description = `${finalBrand} ${finalModel ? finalModel + " " : ""}araçlar için ${manufacturer} üretimi ${finalOEM !== "İNCELEME GEREKLİ" ? finalOEM + " numaralı " : ""}${partType} (${unitName}) orijinal çıkma yedek parça.

Parça Durumu & Kontroller:
Ürün profesyonel olarak sökülmüş ve kullanıma hazır durumdadır. ${needsReview ? "Etiketi netleştirilmek üzere kontroldedir." : `Satın almadan önce parça numarasının (${finalOEM}) kontrol edilmesi önerilir.`}

Ürün Özellikleri
Parça No: ${finalOEM}
Raf / Stok Kodu: ${s.Code}
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
    const safeOem = finalOEM.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    const slug = `${brandSlug}-${safeOem}-${s.SafeCode}`;

    const tags = [
      s.Code,
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
      shelfCode: s.Code,
      categoryId: Object.values(categoryMap)[0],
      brand: finalBrand,
      model: finalModel,
      condition: "Orijinal Çıkma",
      inStock: true,
      description,
      images: [s.ImageUrl],
      metaTitle: `${finalTitle} | TMS İthalat`,
      metaDescription: `${finalBrand} ${partType}. TMS İthalat güvencesiyle test edilmiş orijinal çıkma parça.`,
      metaKeywords: `${finalOEM}, ${s.Code}, ${finalBrand}, ${partType}, TMS İthalat`,
      tags,
      needsReview,
      reviewReason,
    });

    reportRows.push({
      code: s.Code,
      oem: finalOEM,
      brand: finalBrand,
      model: finalModel || "—",
      status: needsReview ? "⚠️ İNCELEME GEREKLİ" : "✅ DOĞRULANDI",
      reason: reviewReason,
    });
  }

  // 4. Save to local database
  await client.mutation(api.importData.batchInsertProducts, {
    products: productsToInsert,
  });

  console.log("\n\n==========================================================================================");
  console.log("                       📊 OTOMOTİV KALİTE KONTROL DENETİM RAPORU                         ");
  console.log("==========================================================================================");
  console.table(reportRows);
  console.log("==========================================================================================");
  console.log(`\n🎉 10 Adet Test Ürünü Yerel Veritabanına Eklendi!`);
  console.log(`👉 Tarayıcınızda 'http://localhost:3000/urunler' sayfasından hem DOĞRULANMIŞ hem de İNCELEME GEREKLİ ürünleri görebilirsiniz!`);
}

runQualityGuardTest().catch(console.error);
