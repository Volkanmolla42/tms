const fs = require("fs");
const path = require("path");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

async function testWithMaxTokens() {
  const samplePath = path.join(process.cwd(), "temp_sample", "sample1.jpg");
  const base64 = fs.readFileSync(samplePath).toString("base64");

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
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Fotoğraftaki oto elektronik parçasının üzerindeki etiketi oku. OEM numarasını, üreticisini (Bosch/Mitsubishi vb), araç markasını ve modelini JSON olarak ver.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64}`,
              },
            },
          ],
        },
      ],
    }),
  });

  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Result:\n", data.choices?.[0]?.message?.content || JSON.stringify(data, null, 2));
}

testWithMaxTokens().catch(console.error);
