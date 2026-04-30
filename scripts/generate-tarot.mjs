import { mkdirSync, writeFileSync } from "node:fs";

const cards = [
  ["fool", "愚者", "THE FOOL", "#96f2d7", "path"],
  ["magician", "魔術師", "THE MAGICIAN", "#67e8f9", "wand"],
  ["high-priestess", "女教皇", "HIGH PRIESTESS", "#c4b5fd", "moon"],
  ["empress", "女帝", "THE EMPRESS", "#f9a8d4", "flora"],
  ["emperor", "皇帝", "THE EMPEROR", "#fca5a5", "throne"],
  ["hierophant", "教皇", "THE HIEROPHANT", "#fde68a", "keys"],
  ["lovers", "恋人", "THE LOVERS", "#f0abfc", "union"],
  ["chariot", "戦車", "THE CHARIOT", "#93c5fd", "wheel"],
  ["strength", "力", "STRENGTH", "#fdba74", "lion"],
  ["hermit", "隠者", "THE HERMIT", "#d9f99d", "lamp"],
  ["wheel-of-fortune", "運命の輪", "WHEEL", "#5eead4", "circle"],
  ["justice", "正義", "JUSTICE", "#bfdbfe", "scale"],
  ["hanged-man", "吊るされた男", "HANGED MAN", "#ddd6fe", "hang"],
  ["death", "死神", "DEATH", "#e5e7eb", "gate"],
  ["temperance", "節制", "TEMPERANCE", "#bae6fd", "cups"],
  ["devil", "悪魔", "THE DEVIL", "#fda4af", "horns"],
  ["tower", "塔", "THE TOWER", "#fef08a", "tower"],
  ["star", "星", "THE STAR", "#a5f3fc", "star"],
  ["moon", "月", "THE MOON", "#c7d2fe", "moonfull"],
  ["sun", "太陽", "THE SUN", "#fde047", "sun"],
  ["judgement", "審判", "JUDGEMENT", "#fecdd3", "trumpet"],
  ["world", "世界", "THE WORLD", "#bbf7d0", "world"],
];

mkdirSync("public/tarot", { recursive: true });

function symbol(type, color) {
  const stroke = `stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const fill = `fill="${color}" opacity=".18"`;
  const solid = `fill="${color}"`;
  const map = {
    path: `<path ${stroke} d="M150 250 C190 190 250 190 290 128"/><circle ${solid} cx="298" cy="118" r="10"/>`,
    wand: `<path ${stroke} d="M220 300 L220 115"/><path ${stroke} d="M190 145 L250 145"/><circle ${fill} cx="220" cy="110" r="42"/>`,
    moon: `<path ${solid} d="M246 120a78 78 0 1 0 0 156a62 62 0 1 1 0-156z"/>`,
    flora: `<circle ${fill} cx="220" cy="190" r="72"/><path ${stroke} d="M220 262 V335 M170 310 C205 290 235 290 270 310"/>`,
    throne: `<rect ${fill} x="150" y="132" width="140" height="150"/><path ${stroke} d="M160 320 H280 M175 320 V248 M265 320 V248"/>`,
    keys: `<circle ${stroke} cx="190" cy="180" r="22"/><path ${stroke} d="M208 198 L280 270 M255 245 L280 220 M268 258 L292 235"/>`,
    union: `<path ${stroke} d="M160 185 C160 135 220 135 220 190 C220 135 280 135 280 185 C280 245 220 285 220 285 C220 285 160 245 160 185z"/>`,
    wheel: `<circle ${stroke} cx="220" cy="210" r="80"/><path ${stroke} d="M220 130 V290 M140 210 H300 M164 154 L276 266 M276 154 L164 266"/>`,
    lion: `<circle ${fill} cx="220" cy="190" r="76"/><path ${stroke} d="M180 220 C205 250 235 250 260 220 M190 170 H190 M250 170 H250"/>`,
    lamp: `<path ${stroke} d="M220 120 V325 M185 165 H255 L240 220 H200 Z"/><circle ${solid} cx="220" cy="190" r="12"/>`,
    circle: `<circle ${stroke} cx="220" cy="210" r="92"/><path ${stroke} d="M220 118 C280 190 280 230 220 302 C160 230 160 190 220 118z"/>`,
    scale: `<path ${stroke} d="M220 115 V300 M165 155 H275 M170 155 L135 230 H205 Z M270 155 L235 230 H305 Z"/>`,
    hang: `<path ${stroke} d="M150 115 H290 M220 115 V175 M190 245 L250 175 M250 245 L190 175"/><circle ${fill} cx="220" cy="210" r="70"/>`,
    gate: `<path ${stroke} d="M150 305 H290 M170 305 V150 H270 V305 M190 185 H250"/>`,
    cups: `<path ${stroke} d="M165 145 C205 180 205 230 165 265 M275 145 C235 180 235 230 275 265 M165 205 H275"/>`,
    horns: `<path ${stroke} d="M170 130 C175 185 205 190 220 220 C235 190 265 185 270 130 M185 270 C205 300 235 300 255 270"/><circle ${fill} cx="220" cy="220" r="64"/>`,
    tower: `<path ${stroke} d="M170 315 L190 140 H250 L270 315 M185 185 H255 M200 135 L180 105 M240 135 L265 100"/>`,
    star: `<path ${solid} d="M220 105l24 74h78l-63 46 24 74-63-46-63 46 24-74-63-46h78z"/>`,
    moonfull: `<circle ${fill} cx="220" cy="175" r="70"/><path ${stroke} d="M150 290 C185 260 255 260 290 290"/>`,
    sun: `<circle ${fill} cx="220" cy="205" r="62"/><path ${stroke} d="M220 105 V135 M220 275 V305 M120 205 H150 M290 205 H320 M150 135 L172 157 M290 135 L268 157 M150 275 L172 253 M290 275 L268 253"/>`,
    trumpet: `<path ${stroke} d="M160 250 L245 170 L285 210 L200 290 Z M245 170 L290 125"/><path ${stroke} d="M145 315 H295"/>`,
    world: `<ellipse ${stroke} cx="220" cy="210" rx="92" ry="118"/><path ${stroke} d="M150 145 C195 175 245 175 290 145 M150 275 C195 245 245 245 290 275"/>`,
  };
  return map[type];
}

for (const [index, [slug, jp, en, color, type]] of cards.entries()) {
  const number = String(index).padStart(2, "0");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="1000" viewBox="0 0 440 700">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop stop-color="#050608"/>
      <stop offset=".52" stop-color="#111827"/>
      <stop offset="1" stop-color="#020617"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect x="18" y="18" width="404" height="664" rx="26" fill="url(#bg)" stroke="${color}" stroke-width="3"/>
  <rect x="42" y="42" width="356" height="616" rx="18" fill="none" stroke="#ffffff" stroke-opacity=".16"/>
  <text x="220" y="86" text-anchor="middle" fill="${color}" font-size="26" font-family="serif" letter-spacing="6">${number}</text>
  <g filter="url(#glow)">${symbol(type, color)}</g>
  <path d="M96 430 H344" stroke="${color}" stroke-opacity=".55"/>
  <text x="220" y="488" text-anchor="middle" fill="#f8fafc" font-size="34" font-family="serif" letter-spacing="4">${jp}</text>
  <text x="220" y="532" text-anchor="middle" fill="${color}" font-size="18" font-family="Arial, sans-serif" letter-spacing="3">${en}</text>
  <text x="220" y="612" text-anchor="middle" fill="#94a3b8" font-size="13" font-family="Arial, sans-serif" letter-spacing="5">ORIGINAL ARCANA</text>
</svg>`;
  writeFileSync(`public/tarot/${number}-${slug}.svg`, svg);
}
