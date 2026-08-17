const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");

const DEV_CONVEX_URL = "https://aromatic-elk-297.convex.cloud";
const ZIP_PATH = "C:\\Users\\volkan\\Desktop\\data.zip";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");

async function analyzeImageWithAI(base64Image, shelfCode, folderHint) {
  const systemPrompt = `Sen otomotiv elektronik parçaları (ECU, ABS, Airbag, BCM, Sigorta Kutusu vb.) konusunda uzman bir teknik ürün yöneticisisin.
Sana bir oto elektronik parçasının fotoğrafı verilecek. Fotoğrafın üzerindeki etiketi/etiketleri (etiket üzerindeki parça numaralarını, Bosch/Siemens/Magneti Marelli/VAG kodlarını, araç marka ve modelini) çok dikkatli oku.

ZORUNLU JSON ÇIKTISI (Sadece temiz JSON döndür):
{
  "oemNumber": "Etiketteki en belirgin ana OEM parça numarası (Örn: 4B0 907 401 H, 09115062, A 027 545 96 32, 8200123456)",
  "secondaryCode": "Bosch / Siemens / Valeo / Üretici parça numarası (Varsa, Örn: 0 281 001 781)",
  "brand": "Araç markası (Örn: Renault, Volkswagen, Audi, Mercedes-Benz, BMW, Opel, Fiat, Ford, Peugeot, Citroen)",
  "model": "Uyumlu araç modeli (Örn: Corsa B, Passat B5 2.5 TDI, Megane 2, A-Serisi W168)",
  "partType": "Parçanın Türkçe adı (Örn: Motor Beyni (ECU), ABS / ESP Beyni, Direksiyon Beyni, Sigorta Kutusu, Gösterge Paneli)",
  "manufacturer": "Parça üreticisi (Örn: Bosch, Siemens, Magneti Marelli, Sagem, Mitsubishi Electric, Valeo, Delphi)",
  "electronicUnitName": "Teknik İngilizce/Almanca adı (Örn: Engine Control Unit (ECU), Steuergerät-Lenkung, ABS Hydraulic Control Block)",
  "functionDescription": "Parçanın araçtaki fonksiyonunun 1-2 cümlelik açıklaması",
  "usageAreas": ["Madde 1", "Madde 2", "Madde 3", "Madde 4"]
}`;

  // Try OpenRouter (Gemini Flash Vision)
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://tmsithalat.com",
        "X-Title": "TMS Vision OCR",
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
                text: `Bu parça için etiketi oku. Raf / Dosya ipucu: ${folderHint} (Stok Kodu: ${shelfCode}). Lütfen en doğru OEM numarasını, üreticisini ve araç modelini çıkar.`,
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
    console.error("AI OCR API Error:", err.message);
  }

  return null;
}

async function testOCR() {
  console.log("👁️ YAPAY ZEKA (GEMINI VISION) ETİKET OKUMA TESTİ BAŞLATILIYOR...");
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const client = new ConvexHttpClient(DEV_CONVEX_URL);

  // 1. Pick 5 distinct product samples from data.zip
  console.log("\n📦 1. Adım: data.zip içinden 5 farklı ürün seçiliyor...");

  const psScript = `
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $zip = [System.IO.Compression.ZipFile]::OpenRead('${ZIP_PATH.replace(/\\/g, "\\\\")}')
  $dest = '${UPLOAD_DIR.replace(/\\/g, "\\\\")}'

  # Select 5 sample products with clear codes from different folders
  $targetCodes = @('201.01.0347', '701.01.0001', '801.01.0001', '401.10.0002', '301.02.0005')
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
  $extracted | ConvertTo-Json | Out-File -FilePath 'temp_ocr_samples.json' -Encoding utf8
  `;

  fs.writeFileSync("temp_extract_ocr.ps1", psScript);
  execSync("powershell -ExecutionPolicy Bypass -File temp_extract_ocr.ps1");
  try { fs.unlinkSync("temp_extract_ocr.ps1"); } catch (e) {}

  const rawJson = fs.readFileSync("temp_ocr_samples.json", "utf8").replace(/^\uFEFF/, "");
  const samples = JSON.parse(rawJson);
  try { fs.unlinkSync("temp_ocr_samples.json"); } catch (e) {}

  console.log(`✅ ${samples.length} adet ürün fotoğrafı seçildi.`);

  // 2. Clear dev products & ensure categories
  console.log("\n🧹 2. Adım: Lokal veritabanı hazırlanıyor...");
  const initRes = await client.mutation(api.importData.initCategoriesAndBrands, {});
  const categoryMap = initRes.categoryMap;
  await client.mutation(api.importData.cleanProductsBatch, { limit: 100 });

  // 3. Process each with Vision AI
  console.log("\n🚀 3. Adım: Yapay Zeka fotoğraflardaki etiketleri okuyor...\n");

  const productsToInsert = [];

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    console.log(`🔍 [${i + 1}/${samples.length}] İnceleniyor: ${s.Code} (${path.basename(s.CategoryPath)})`);

    const imgBuffer = fs.readFileSync(s.ImagePath);
    const base64 = imgBuffer.toString("base64");

    const aiData = await analyzeImageWithAI(base64, s.Code, s.CategoryPath);

    if (aiData) {
      console.log(`   ✨ OKUNAN GERÇEK OEM: ${aiData.oemNumber}`);
      console.log(`   🏷️ Üretici / Marka: ${aiData.manufacturer || aiData.brand} | Araç: ${aiData.brand} ${aiData.model || ""}`);
      console.log(`   🔧 Parça Türü: ${aiData.partType}`);
      if (aiData.secondaryCode) console.log(`   🔢 İkincil Kod: ${aiData.secondaryCode}`);
      console.log("   --------------------------------------------------");

      const oemClean = (aiData.oemNumber || s.Code).trim();
      const brand = aiData.brand || "Genel Uyumlu";
      const model = aiData.model || "";
      const manufacturer = aiData.manufacturer || brand;
      const partType = aiData.partType || "Oto Elektronik Parçası";
      const unitName = aiData.electronicUnitName || "Electronic Control Unit";
      const funcDesc = aiData.functionDescription || "aracın ilgili elektronik donanım sistemlerini yöneten orijinal kontrol ünitesidir";

      const title = `${brand} ${partType} ${manufacturer} ${oemClean} Orijinal Çıkma ${unitName}`;
      const areas = aiData.usageAreas && aiData.usageAreas.length >= 4 ? aiData.usageAreas : [
        `${brand} elektronik sistemleri`,
        `${partType} yönetimi`,
        "Sensör ve aktüatör kontrolü",
        "Motor ve konfor sistemleri",
      ];

      const description = `${brand} ${model ? model + " " : ""}araçlar için ${manufacturer} üretimi ${oemClean} numaralı ${partType} (${unitName}) orijinal çıkma yedek parça.

${partType}; ${funcDesc}.

Ürün profesyonel olarak sökülmüş, kontrol edilmiş ve kullanıma hazır durumdadır. Satın almadan önce mevcut parça üzerindeki parça numarasının ${oemClean} ile aynı olduğunun kontrol edilmesi önerilir.

Ürün Özellikleri
Parça No: ${oemClean}
Raf / Stok Kodu: ${s.Code}
Üretici: ${manufacturer}
Parça Türü: ${partType}
Elektronik Kontrol Ünitesi: ${unitName}
Durum: Orijinal Çıkma
Uyumluluk: ${brand} ${model} modelleri (parça numarası kontrol edilerek)

Kullanım Alanları
${areas[0]}
${areas[1]}
${areas[2]}
${areas[3]}

TMS İthalat güvencesiyle kaliteli çıkma otomotiv elektronik yedek parçaları.`;

      const safeOem = oemClean.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
      const brandSlug = brand.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
      const slug = `${brandSlug}-${safeOem}-${s.SafeCode}`;

      // Pick category ID
      const catId = Object.values(categoryMap)[0];

      productsToInsert.push({
        title,
        slug,
        oemNumber: oemClean,
        shelfCode: s.Code,
        categoryId: catId,
        brand,
        model,
        condition: "Orijinal Çıkma",
        inStock: true,
        description,
        images: [s.ImageUrl],
        metaTitle: `${manufacturer} ${oemClean} ${brand} ${partType} Orijinal Çıkma | TMS İthalat`,
        metaDescription: `${brand} araçlar için ${manufacturer} ${oemClean} numaralı ${partType}. Test edilmiş orijinal çıkma parça TMS İthalat güvencesiyle.`,
        metaKeywords: `${oemClean}, ${brand}, ${partType}, ${manufacturer}, çıkma beyin, TMS İthalat`,
        tags: [oemClean, s.Code, brand, manufacturer, partType, "Orijinal Çıkma"],
      });
    } else {
      console.log(`   ⚠️ AI okuma yanıt vermedi, geçildi.`);
    }
  }

  // 4. Insert into dev database
  if (productsToInsert.length > 0) {
    await client.mutation(api.importData.batchInsertProducts, {
      products: productsToInsert,
    });
    console.log(`\n🎉 TAMAMLANDI! ${productsToInsert.length} adet ürün fotoğraftan okunarak gerçek OEM kodlarıyla yerel veritabanına eklendi!`);
    console.log(`👉 Hemen tarayıcınızda 'http://localhost:3000/urunler' sayfasını açıp gerçek OEM kodlarını inceleyebilirsiniz!`);
  }
}

testOCR().catch(console.error);
