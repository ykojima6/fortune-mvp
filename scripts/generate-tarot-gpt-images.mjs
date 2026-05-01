import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
const outDir = "public/tarot/anime";
const batchSize = Number(process.env.TAROT_IMAGE_BATCH_SIZE || 5);
const batch = Number(process.env.TAROT_IMAGE_BATCH || 1);
const force = process.env.TAROT_IMAGE_FORCE === "1";

const cards = [
  ["card-back", "Tarot card back", "Symmetrical card back, cyan and violet astral geometry, no readable text"],
  ["00-fool", "The Fool / 愚者", "young anime wanderer stepping from a neon cliff into a starry void"],
  ["01-magician", "The Magician / 魔術師", "anime mage raising a luminous wand, arcane tools floating around"],
  ["02-high-priestess", "The High Priestess / 女教皇", "mysterious anime priestess between black and white pillars, crescent moon"],
  ["03-empress", "The Empress / 女帝", "regal anime empress surrounded by luminous flowers and cosmic vines"],
  ["04-emperor", "The Emperor / 皇帝", "stern anime emperor on a geometric obsidian throne, red aura"],
  ["05-hierophant", "The Hierophant / 教皇", "anime oracle teacher holding twin keys under a sacred arch"],
  ["06-lovers", "The Lovers / 恋人", "two anime figures facing each other under a radiant heart constellation"],
  ["07-chariot", "The Chariot / 戦車", "anime rider commanding a sleek celestial chariot through blue light"],
  ["08-strength", "Strength / 力", "calm anime heroine with a glowing lion spirit behind her"],
  ["09-hermit", "The Hermit / 隠者", "solitary anime sage holding a lantern in a snowy midnight mountain"],
  ["10-wheel-of-fortune", "Wheel of Fortune / 運命の輪", "huge glowing wheel of fate with anime silhouette at center"],
  ["11-justice", "Justice / 正義", "anime judge with sword and scales, crisp blue-white symmetry"],
  ["12-hanged-man", "The Hanged Man / 吊るされた男", "serene upside-down anime figure suspended by luminous ribbons"],
  ["13-death", "Death / 死神", "elegant anime reaper at a gate of black roses and pale light"],
  ["14-temperance", "Temperance / 節制", "anime angel blending two streams of liquid starlight"],
  ["15-devil", "The Devil / 悪魔", "stylish anime demon with red neon chains and shadow wings"],
  ["16-tower", "The Tower / 塔", "black tower struck by gold lightning, dramatic anime composition"],
  ["17-star", "The Star / 星", "anime stargazer pouring water beneath a giant radiant star"],
  ["18-moon", "The Moon / 月", "anime dreamscape with twin towers, crescent moon, reflective water"],
  ["19-sun", "The Sun / 太陽", "bright anime sun guardian with golden halo and radiant sky"],
  ["20-judgement", "Judgement / 審判", "anime angel blowing a trumpet over rising light silhouettes"],
  ["21-world", "The World / 世界", "anime dancer inside a cosmic wreath, completed universe motif"],
];

if (!apiKey) {
  throw new Error("OPENAI_API_KEY is required. Add it to .env.local or export it before running this script.");
}

mkdirSync(outDir, { recursive: true });

const start = (batch - 1) * batchSize;
const selectedCards = cards.slice(start, start + batchSize);

if (selectedCards.length === 0) {
  throw new Error(`No cards for TAROT_IMAGE_BATCH=${batch} with TAROT_IMAGE_BATCH_SIZE=${batchSize}.`);
}

console.log(`Generating batch ${batch}: ${selectedCards.map(([file]) => file).join(", ")} using ${model}`);

for (const [file, title, concept] of selectedCards) {
  const outputPath = `${outDir}/${file}.png`;
  if (!force && existsSync(outputPath)) {
    console.log(`Skipped ${outputPath} because it already exists. Set TAROT_IMAGE_FORCE=1 to overwrite.`);
    continue;
  }

  const prompt = [
    "Original tarot card illustration, dynamic high-end anime style, vertical 3:5 tarot card frame.",
    "Dramatic motion, sharp line art, cinematic lighting, premium collectible card art.",
    "Dark obsidian background with cyan, violet, gold, and crimson accents.",
    "Full-card composition, strong silhouette, mystical energy, detailed costume, beautiful face and hands where applicable.",
    "No copyrighted characters, no logos, no watermark, no readable text, no typography except abstract decorative marks.",
    `Card concept: ${title}. ${concept}.`,
  ].join(" ");

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      size: "1024x1536",
      quality: "high",
      n: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Image generation failed for ${file}: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error(`No image data returned for ${file}`);

  writeFileSync(outputPath, Buffer.from(b64, "base64"));
  console.log(`Wrote ${outputPath}`);
}

console.log("Batch complete.");
