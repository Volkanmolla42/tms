/*
 * Cost-controlled OpenRouter label reader.
 *
 * - Shelf code stays the immutable stock identifier.
 * - OEM is an independently verified candidate.
 * - The last photo is attempted first because this archive commonly stores
 *   the close-up label at the end of the product's photo sequence.
 * - It sends one optimized WebP at a time and falls back only when needed.
 * - It never changes Convex, public/uploads, or the source ZIP.
 *
 * Dry run (default):
 *   node scripts/run_openrouter_label_pilot.js --input .tms-import/pilot.json
 *
 * Actual calls, with a hard request count and a session budget:
 *   node scripts/run_openrouter_label_pilot.js --input .tms-import/pilot.json --run --limit 100 --budget-usd 2
 */

const AdmZip = require("adm-zip");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

function readOption(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1] ?? fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function loadEnvironmentFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

function parseJsonObject(value) {
  const firstBrace = value.indexOf("{");
  const lastBrace = value.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace < firstBrace) return null;
  try {
    return JSON.parse(value.slice(firstBrace, lastBrace + 1));
  } catch {
    return null;
  }
}

function normaliseCode(value) {
  return typeof value === "string"
    ? value.toUpperCase().replace(/\s+/g, "").trim()
    : null;
}

function isPlausibleOem(value) {
  if (!value || value.length < 6 || value.length > 24) return false;
  if (!/^[A-Z0-9 ._-]+$/.test(value)) return false;
  return /\d/.test(value);
}

const inputPath = readOption("--input", path.join(process.cwd(), ".tms-import", "pilot.json"));
const run = hasFlag("--run");
const limit = Number.parseInt(readOption("--limit", "25"), 10);
const budgetUsd = Number.parseFloat(readOption("--budget-usd", "0"));
const maxDimension = Number.parseInt(readOption("--max-dimension", "1600"), 10);
const webpQuality = Number.parseInt(readOption("--webp-quality", "82"), 10);
const minimumConfidence = Number.parseFloat(readOption("--minimum-confidence", "0.9"));
const model = readOption("--model", "google/gemini-2.5-flash-lite");
const maxImagePrice = readOption("--max-image-price", "");

if (!Number.isInteger(limit) || limit < 1) throw new Error("--limit pozitif bir tam sayı olmalıdır.");
if (!Number.isInteger(maxDimension) || maxDimension < 512) throw new Error("--max-dimension en az 512 olmalıdır.");
if (!Number.isInteger(webpQuality) || webpQuality < 40 || webpQuality > 100) throw new Error("--webp-quality 40-100 arasında olmalıdır.");
if (run && (!Number.isFinite(budgetUsd) || budgetUsd <= 0)) {
  throw new Error("Gerçek isteklerde --budget-usd zorunludur; örnek: --budget-usd 2");
}

loadEnvironmentFile(path.join(process.cwd(), ".env.local"));
if (run && !process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY .env.local içinde tanımlı değil.");
}

const outputDirectory = path.dirname(inputPath);
const cacheDirectory = path.join(outputDirectory, "openrouter-vision-cache");
const resultPath = path.join(outputDirectory, "openrouter-vision-results.json");

function loadPreviousResults() {
  if (!fs.existsSync(resultPath)) return new Map();
  const previous = JSON.parse(fs.readFileSync(resultPath, "utf8"));
  // A dry run is only a preview of the selected image. It must not make a
  // later paid run think the product was already processed.
  return new Map(
    (previous.results || [])
      .filter((result) => result.status !== "dry_run")
      .map((result) => [result.id, result])
  );
}

async function optimiseImage(entry, image) {
  fs.mkdirSync(cacheDirectory, { recursive: true });
  const cacheKey = crypto.createHash("sha1").update(`${image.archivePath}:${maxDimension}:${webpQuality}`).digest("hex");
  const filePath = path.join(cacheDirectory, `${cacheKey}.webp`);
  if (!fs.existsSync(filePath)) {
    await sharp(entry.getData(), { failOn: "none" })
      .rotate()
      .resize({ width: maxDimension, height: maxDimension, fit: "inside", withoutEnlargement: true })
      .webp({ quality: webpQuality, effort: 4 })
      .toFile(filePath);
  }
  const metadata = await sharp(filePath).metadata();
  return { filePath, width: metadata.width, height: metadata.height, bytes: fs.statSync(filePath).size };
}

async function askOpenRouter(imageBuffer) {
  const provider = {};
  if (maxImagePrice) provider.max_price = { image: Number(maxImagePrice) };

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://tmsithalat.com",
      "X-Title": "TMS OEM Label Reader",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 100,
      ...(Object.keys(provider).length > 0 ? { provider } : {}),
      messages: [
        {
          role: "system",
          content: "You read automotive part labels. Do not infer missing characters. Return only a JSON object.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Read the label in this automotive-part image exactly. Return {"oemNumber":string|null,"secondaryCode":string|null,"manufacturer":string|null,"confidence":number}. confidence must be 0 to 1. If the OEM number is not fully legible, use null.`,
            },
            {
              type: "image_url",
              image_url: { url: `data:image/webp;base64,${imageBuffer.toString("base64")}` },
            },
          ],
        },
      ],
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message || `OpenRouter HTTP ${response.status}`);
  const content = body.choices?.[0]?.message?.content || "";
  return {
    parsed: parseJsonObject(content),
    cost: Number(body.usage?.cost || 0),
    usage: body.usage || null,
  };
}

async function main() {
  if (!fs.existsSync(inputPath)) throw new Error(`Pilot bulunamadı: ${inputPath}`);
  const pilot = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const zip = new AdmZip(pilot.sourceZip);
  const entries = new Map(zip.getEntries().map((entry) => [entry.entryName, entry]));
  const previousResults = loadPreviousResults();
  const selectedProducts = pilot.products.slice(0, limit);
  const results = [...previousResults.values()];
  let totalCost = results.reduce((total, item) => total + (item.costUsd || 0), 0);

  for (const product of selectedProducts) {
    if (previousResults.has(product.id)) {
      console.log(`[skip] ${product.shelfCode}: önceki sonuç bulundu`);
      continue;
    }

    // Close-ups are normally appended to a product sequence, so try the last
    // image first and only pay for the preceding image if confidence is low.
    const attempts = [...product.images].sort((a, b) => b.photoNumber - a.photoNumber || b.archivePath.localeCompare(a.archivePath)).slice(0, 2);
    const attemptResults = [];

    for (const image of attempts) {
      const entry = entries.get(image.archivePath);
      if (!entry) continue;
      const optimised = await optimiseImage(entry, image);
      const attempt = {
        archivePath: image.archivePath,
        dimensions: `${optimised.width}x${optimised.height}`,
        webpBytes: optimised.bytes,
      };

      if (!run) {
        attempt.status = "dry_run";
        attemptResults.push(attempt);
        break;
      }
      if (totalCost >= budgetUsd) {
        attempt.status = "budget_reached";
        attemptResults.push(attempt);
        break;
      }

      const answer = await askOpenRouter(fs.readFileSync(optimised.filePath));
      const oemNumber = normaliseCode(answer.parsed?.oemNumber);
      const confidence = Number(answer.parsed?.confidence || 0);
      Object.assign(attempt, {
        status: "completed",
        oemNumber: isPlausibleOem(oemNumber) ? oemNumber : null,
        secondaryCode: normaliseCode(answer.parsed?.secondaryCode),
        manufacturer: answer.parsed?.manufacturer || null,
        confidence: Number.isFinite(confidence) ? confidence : 0,
        costUsd: answer.cost,
        usage: answer.usage,
      });
      totalCost += answer.cost;
      attemptResults.push(attempt);

      if (attempt.oemNumber && attempt.confidence >= minimumConfidence) break;
    }

    const accepted = attemptResults.find((attempt) => attempt.oemNumber && attempt.confidence >= minimumConfidence) || null;
    const result = {
      id: product.id,
      shelfCode: product.shelfCode,
      sourceFolder: product.sourceFolder,
      status: accepted ? "vision_candidate" : run ? "needs_review" : "dry_run",
      oemNumber: accepted?.oemNumber || null,
      secondaryCode: accepted?.secondaryCode || null,
      manufacturer: accepted?.manufacturer || null,
      confidence: accepted?.confidence || 0,
      costUsd: attemptResults.reduce((total, attempt) => total + (attempt.costUsd || 0), 0),
      attempts: attemptResults,
    };
    results.push(result);
    previousResults.set(product.id, result);
    fs.writeFileSync(resultPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), model, run, budgetUsd: run ? budgetUsd : null, totalCostUsd: totalCost, results }, null, 2)}\n`, "utf8");
    console.log(`[${results.length}/${selectedProducts.length}] ${product.shelfCode}: ${result.status}${result.oemNumber ? ` (${result.oemNumber})` : ""}`);
  }

  console.log(`Tamamlandı. Toplam maliyet: $${totalCost.toFixed(6)} | Sonuç: ${resultPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
