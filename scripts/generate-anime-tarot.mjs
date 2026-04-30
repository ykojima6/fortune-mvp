import { mkdirSync, writeFileSync } from "node:fs";

const outDir = "public/tarot/anime";

const cards = [
  ["fool", "愚者", "THE FOOL", "#74f7d4", "traveler"],
  ["magician", "魔術師", "THE MAGICIAN", "#67e8f9", "mage"],
  ["high-priestess", "女教皇", "HIGH PRIESTESS", "#a78bfa", "priestess"],
  ["empress", "女帝", "THE EMPRESS", "#f472b6", "empress"],
  ["emperor", "皇帝", "THE EMPEROR", "#fb7185", "emperor"],
  ["hierophant", "教皇", "THE HIEROPHANT", "#facc15", "hierophant"],
  ["lovers", "恋人", "THE LOVERS", "#f0abfc", "lovers"],
  ["chariot", "戦車", "THE CHARIOT", "#60a5fa", "chariot"],
  ["strength", "力", "STRENGTH", "#fb923c", "strength"],
  ["hermit", "隠者", "THE HERMIT", "#bef264", "hermit"],
  ["wheel-of-fortune", "運命の輪", "WHEEL OF FORTUNE", "#2dd4bf", "wheel"],
  ["justice", "正義", "JUSTICE", "#93c5fd", "justice"],
  ["hanged-man", "吊るされた男", "THE HANGED MAN", "#c4b5fd", "hanged"],
  ["death", "死神", "DEATH", "#e5e7eb", "death"],
  ["temperance", "節制", "TEMPERANCE", "#7dd3fc", "temperance"],
  ["devil", "悪魔", "THE DEVIL", "#f43f5e", "devil"],
  ["tower", "塔", "THE TOWER", "#fde047", "tower"],
  ["star", "星", "THE STAR", "#a5f3fc", "star"],
  ["moon", "月", "THE MOON", "#818cf8", "moon"],
  ["sun", "太陽", "THE SUN", "#fbbf24", "sun"],
  ["judgement", "審判", "JUDGEMENT", "#fda4af", "judgement"],
  ["world", "世界", "THE WORLD", "#86efac", "world"],
];

mkdirSync(outDir, { recursive: true });

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function glow(id, color) {
  return `
    <radialGradient id="aura-${id}" cx="50%" cy="33%" r="58%">
      <stop offset="0" stop-color="${color}" stop-opacity=".42"/>
      <stop offset=".46" stop-color="${color}" stop-opacity=".08"/>
      <stop offset="1" stop-color="#030712" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="blade-${id}" x1="0" x2="1" y1="0" y2="1">
      <stop stop-color="#fff"/>
      <stop offset=".38" stop-color="${color}"/>
      <stop offset="1" stop-color="#0f172a"/>
    </linearGradient>`;
}

function figure(color, type) {
  const stroke = `stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const thin = `stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const fill = `fill="${color}"`;
  const soft = `fill="${color}" opacity=".16"`;
  const base = `
    <ellipse cx="220" cy="543" rx="130" ry="24" fill="#020617" opacity=".82"/>
    <path d="M171 426 C184 357 203 322 220 322 C237 322 256 357 269 426 L286 534 H154 Z" fill="#0f172a" stroke="${color}" stroke-width="4"/>
    <path d="M191 420 C203 384 237 384 249 420 L258 523 H182 Z" fill="#111827"/>
    <circle cx="220" cy="279" r="43" fill="#101827" stroke="${color}" stroke-width="5"/>
    <path d="M177 279 C191 231 249 231 263 279" ${thin}/>
    <path d="M188 316 C205 334 235 334 252 316" ${thin}/>`;
  const scenes = {
    traveler: `${base}<path d="M147 461 C190 408 249 405 292 456" ${thin}/><path d="M142 366 L101 296 M298 363 L338 302" ${stroke}/><path d="M100 292 L130 285" ${thin}/><path d="M220 118 L239 174 L298 174 L250 207 L268 264 L220 229 L172 264 L190 207 L142 174 L201 174 Z" ${fill} opacity=".72"/>`,
    mage: `${base}<path d="M220 116 V246" ${stroke}/><path d="M171 363 L108 238 M269 363 L332 238" ${stroke}/><circle cx="220" cy="126" r="42" ${soft}/><path d="M139 196 H301 M170 166 H270" ${thin}/><path d="M118 535 H322" ${thin}/><circle cx="112" cy="235" r="14" ${fill}/><circle cx="328" cy="235" r="14" ${fill}/>` ,
    priestess: `${base}<path d="M122 538 V192 M318 538 V192" ${stroke}/><path d="M112 192 H154 M286 192 H328" ${thin}/><path d="M182 159 C203 200 237 200 258 159 C251 230 189 230 182 159Z" ${soft}/><path d="M161 433 C196 459 244 459 279 433" ${thin}/><path d="M220 126 A62 62 0 1 0 220 250 A42 42 0 1 1 220 126" ${fill} opacity=".75"/>`,
    empress: `${base}<path d="M133 440 C167 350 273 350 307 440 C280 385 160 385 133 440Z" ${soft}/><path d="M164 348 C194 292 246 292 276 348" ${thin}/><path d="M220 138 C246 183 292 186 306 226 C264 218 240 235 220 271 C200 235 176 218 134 226 C148 186 194 183 220 138Z" ${fill} opacity=".55"/><path d="M177 508 C207 476 233 476 263 508" ${thin}/>` ,
    emperor: `${base}<path d="M139 527 L139 214 H301 V527" ${thin}/><path d="M132 214 H308 M162 182 H278" ${stroke}/><path d="M178 350 H262 M178 390 H262" ${thin}/><path d="M152 268 L118 223 M288 268 L322 223" ${thin}/><path d="M199 117 H241 L259 160 H181 Z" ${fill} opacity=".55"/>`,
    hierophant: `${base}<path d="M220 118 V255 M171 180 H269 M191 220 H249" ${stroke}/><path d="M135 514 C174 460 266 460 305 514" ${thin}/><path d="M120 340 H320" ${thin}/><path d="M165 361 L123 423 M275 361 L317 423" ${stroke}/><circle cx="123" cy="423" r="16" ${soft}/><circle cx="317" cy="423" r="16" ${soft}/>` ,
    lovers: `${base}<path d="M143 350 C143 265 220 276 220 350 C220 276 297 265 297 350 C297 437 220 483 220 483 C220 483 143 437 143 350Z" ${soft}/><path d="M178 314 C197 288 211 301 220 327 C229 301 243 288 262 314" ${thin}/><path d="M118 190 C154 171 191 171 220 204 C249 171 286 171 322 190" ${thin}/>` ,
    chariot: `${base}<path d="M116 478 H324 L300 542 H140 Z" fill="#111827" stroke="${color}" stroke-width="5"/><circle cx="154" cy="550" r="24" ${thin}/><circle cx="286" cy="550" r="24" ${thin}/><path d="M147 478 C160 398 280 398 293 478" ${thin}/><path d="M220 121 L254 210 L220 251 L186 210 Z" ${soft}/><path d="M120 306 L75 257 M320 306 L365 257" ${stroke}/>` ,
    strength: `${base}<path d="M126 433 C141 354 191 317 220 368 C249 317 299 354 314 433 C269 409 171 409 126 433Z" ${soft}/><path d="M151 475 C173 420 267 420 289 475" ${thin}/><path d="M180 209 C204 168 236 168 260 209 C236 193 204 193 180 209Z" ${fill} opacity=".58"/><path d="M165 287 C197 263 243 263 275 287" ${thin}/>` ,
    hermit: `${base}<path d="M288 173 V477" ${stroke}/><path d="M250 205 H326 L309 286 H267 Z" ${thin}/><circle cx="288" cy="244" r="18" ${fill}/><path d="M158 467 C198 430 242 430 282 467" ${thin}/><path d="M120 539 C155 489 178 435 190 373" ${thin}/><path d="M154 228 C174 188 198 164 220 147" ${thin}/>` ,
    wheel: `${base}<circle cx="220" cy="299" r="128" ${thin}/><circle cx="220" cy="299" r="68" ${thin}/><path d="M220 171 V427 M92 299 H348 M129 208 L311 390 M311 208 L129 390" ${thin}/><path d="M220 108 L245 151 H195 Z" ${fill} opacity=".72"/><path d="M164 520 C197 493 243 493 276 520" ${thin}/>` ,
    justice: `${base}<path d="M220 120 V478" ${stroke}/><path d="M144 190 H296" ${thin}/><path d="M144 190 L103 318 H185 Z M296 190 L255 318 H337 Z" ${thin}/><path d="M126 318 H162 M278 318 H314" ${stroke}/><path d="M180 528 H260" ${thin}/>` ,
    hanged: `<ellipse cx="220" cy="543" rx="130" ry="24" fill="#020617" opacity=".82"/><path d="M119 132 H321 M220 132 V235" ${stroke}/><circle cx="220" cy="280" r="43" fill="#101827" stroke="${color}" stroke-width="5"/><path d="M183 331 C197 397 243 397 257 331 L285 503 H155 Z" fill="#0f172a" stroke="${color}" stroke-width="4"/><path d="M170 443 L270 342 M270 443 L170 342" ${thin}/><path d="M164 196 L114 247 M276 196 L326 247" ${stroke}/>` ,
    death: `${base}<path d="M132 526 L308 526" ${stroke}/><path d="M155 516 V188 H285 V516" ${thin}/><path d="M185 226 H255 M185 282 H255 M185 338 H255" ${thin}/><path d="M220 116 L259 173 H181 Z" ${soft}/><path d="M126 433 C167 392 273 392 314 433" ${thin}/>` ,
    temperance: `${base}<path d="M152 247 C197 305 197 382 152 440 M288 247 C243 305 243 382 288 440" ${stroke}/><path d="M152 340 H288" ${thin}/><path d="M173 468 C202 492 238 492 267 468" ${thin}/><path d="M159 187 C201 160 239 160 281 187" ${thin}/>` ,
    devil: `${base}<path d="M172 159 C183 226 207 229 220 270 C233 229 257 226 268 159" ${stroke}/><path d="M148 430 C166 350 274 350 292 430" ${soft}/><path d="M143 508 C176 478 264 478 297 508" ${thin}/><path d="M107 372 C140 400 170 402 202 372 M238 372 C270 402 300 400 333 372" ${thin}/>` ,
    tower: `${base}<path d="M154 525 L181 172 H259 L286 525" fill="#111827" stroke="${color}" stroke-width="5"/><path d="M170 246 H270 M166 320 H274 M161 394 H279" ${thin}/><path d="M194 161 L167 108 M246 161 L279 98 M220 171 L220 106" ${stroke}/><path d="M125 221 L86 190 M315 221 L354 190" ${thin}/>` ,
    star: `${base}<path d="M220 110 L248 205 H344 L266 260 L296 353 L220 296 L144 353 L174 260 L96 205 H192 Z" ${fill} opacity=".68"/><path d="M164 468 C195 438 245 438 276 468" ${thin}/><path d="M127 151 H150 M290 151 H313 M92 318 H117 M323 318 H348" ${thin}/>` ,
    moon: `${base}<path d="M247 112 A82 82 0 1 0 247 276 A56 56 0 1 1 247 112Z" ${fill} opacity=".72"/><path d="M118 514 C143 433 297 433 322 514" ${thin}/><path d="M129 356 C159 325 189 325 219 356 C249 325 279 325 309 356" ${thin}/><path d="M166 181 H178 M301 238 H313" ${thin}/>` ,
    sun: `${base}<circle cx="220" cy="198" r="74" ${soft}/><path d="M220 88 V124 M220 272 V311 M110 198 H149 M291 198 H330 M142 120 L168 146 M298 120 L272 146 M142 276 L168 250 M298 276 L272 250" ${stroke}/><circle cx="220" cy="198" r="33" ${fill} opacity=".45"/><path d="M149 466 C186 431 254 431 291 466" ${thin}/>` ,
    judgement: `${base}<path d="M133 411 L241 260 L305 310 L197 462 Z" ${thin}/><path d="M241 260 L318 149" ${stroke}/><path d="M119 535 H321" ${thin}/><path d="M159 198 C191 156 249 156 281 198" ${thin}/><path d="M166 468 C198 500 242 500 274 468" ${thin}/>` ,
    world: `${base}<ellipse cx="220" cy="303" rx="137" ry="174" ${thin}/><path d="M119 202 C169 247 271 247 321 202 M119 404 C169 359 271 359 321 404" ${thin}/><path d="M220 129 C272 206 272 400 220 477 C168 400 168 206 220 129Z" ${thin}/><path d="M162 525 C195 493 245 493 278 525" ${thin}/>` ,
  };
  return scenes[type] ?? base;
}

function frontCard(index, slug, jp, en, color, type) {
  const number = String(index).padStart(2, "0");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1500" viewBox="0 0 440 700" role="img" aria-label="${esc(jp)} ${esc(en)}">
  <defs>
    <linearGradient id="bg-${number}" x1="0" x2="1" y1="0" y2="1">
      <stop stop-color="#020617"/>
      <stop offset=".42" stop-color="#111827"/>
      <stop offset="1" stop-color="#050816"/>
    </linearGradient>
    <linearGradient id="edge-${number}" x1="0" x2="1" y1="0" y2="0">
      <stop stop-color="${color}" stop-opacity=".35"/>
      <stop offset=".5" stop-color="#ffffff" stop-opacity=".8"/>
      <stop offset="1" stop-color="${color}" stop-opacity=".35"/>
    </linearGradient>
    ${glow(number, color)}
    <filter id="soft-${number}"><feGaussianBlur stdDeviation="6"/></filter>
    <pattern id="screen-${number}" width="8" height="8" patternUnits="userSpaceOnUse">
      <path d="M0 7 L8 7" stroke="#fff" stroke-opacity=".035"/>
    </pattern>
  </defs>
  <rect width="440" height="700" fill="#020617"/>
  <rect x="14" y="14" width="412" height="672" rx="28" fill="url(#bg-${number})" stroke="url(#edge-${number})" stroke-width="3"/>
  <rect x="31" y="31" width="378" height="638" rx="20" fill="none" stroke="#fff" stroke-opacity=".16"/>
  <rect x="46" y="46" width="348" height="608" rx="14" fill="url(#aura-${number})"/>
  <rect x="46" y="46" width="348" height="608" rx="14" fill="url(#screen-${number})"/>
  <path d="M70 121 C122 72 318 72 370 121" stroke="${color}" stroke-opacity=".35" fill="none"/>
  <path d="M70 579 C122 628 318 628 370 579" stroke="${color}" stroke-opacity=".35" fill="none"/>
  <text x="72" y="76" fill="${color}" font-size="24" font-family="Georgia, serif" letter-spacing="3">${number}</text>
  <text x="368" y="76" text-anchor="end" fill="${color}" font-size="18" font-family="Arial, sans-serif" letter-spacing="3">ARCANA</text>
  <g filter="url(#soft-${number})" opacity=".55">
    <circle cx="220" cy="320" r="168" fill="${color}" opacity=".18"/>
  </g>
  <g>${figure(color, type)}</g>
  <path d="M93 582 H347" stroke="${color}" stroke-opacity=".55"/>
  <text x="220" y="620" text-anchor="middle" fill="#f8fafc" font-size="31" font-family="'Hiragino Mincho ProN', 'Yu Mincho', serif" letter-spacing="5">${esc(jp)}</text>
  <text x="220" y="648" text-anchor="middle" fill="${color}" font-size="13" font-family="Arial, sans-serif" letter-spacing="3">${esc(en)}</text>
</svg>`;
}

function backCard() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1500" viewBox="0 0 440 700" role="img" aria-label="Tarot card back">
  <defs>
    <linearGradient id="back-bg" x1="0" x2="1" y1="0" y2="1">
      <stop stop-color="#020617"/>
      <stop offset=".48" stop-color="#0f172a"/>
      <stop offset="1" stop-color="#030712"/>
    </linearGradient>
    <radialGradient id="back-aura" cx="50%" cy="45%" r="58%">
      <stop stop-color="#67e8f9" stop-opacity=".38"/>
      <stop offset=".5" stop-color="#a78bfa" stop-opacity=".12"/>
      <stop offset="1" stop-color="#020617" stop-opacity="0"/>
    </radialGradient>
    <filter id="back-glow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="440" height="700" fill="#020617"/>
  <rect x="14" y="14" width="412" height="672" rx="28" fill="url(#back-bg)" stroke="#67e8f9" stroke-opacity=".7" stroke-width="3"/>
  <rect x="34" y="34" width="372" height="632" rx="20" fill="url(#back-aura)" stroke="#fff" stroke-opacity=".15"/>
  <path d="M220 88 L338 350 L220 612 L102 350 Z" fill="none" stroke="#67e8f9" stroke-opacity=".55" stroke-width="4"/>
  <path d="M220 128 L304 350 L220 572 L136 350 Z" fill="none" stroke="#fbbf24" stroke-opacity=".46" stroke-width="3"/>
  <circle cx="220" cy="350" r="102" fill="#020617" fill-opacity=".5" stroke="#a78bfa" stroke-opacity=".7" stroke-width="4"/>
  <g filter="url(#back-glow)">
    <path d="M220 232 L248 318 H338 L265 371 L293 456 L220 404 L147 456 L175 371 L102 318 H192 Z" fill="#67e8f9" opacity=".68"/>
    <circle cx="220" cy="350" r="42" fill="#020617" stroke="#f8fafc" stroke-opacity=".7" stroke-width="3"/>
    <path d="M220 156 V544 M26 350 H414" stroke="#67e8f9" stroke-opacity=".28" stroke-width="2"/>
  </g>
  <text x="220" y="87" text-anchor="middle" fill="#e0f2fe" font-size="16" font-family="Arial, sans-serif" letter-spacing="6">SHUKUYO TAROT</text>
  <text x="220" y="633" text-anchor="middle" fill="#bae6fd" font-size="13" font-family="Arial, sans-serif" letter-spacing="5">ORIGINAL ARCANA</text>
</svg>`;
}

writeFileSync(`${outDir}/card-back.svg`, backCard());

for (const [index, [slug, jp, en, color, type]] of cards.entries()) {
  const number = String(index).padStart(2, "0");
  writeFileSync(`${outDir}/${number}-${slug}.svg`, frontCard(index, slug, jp, en, color, type));
}

console.log(`Wrote ${cards.length + 1} anime tarot assets to ${outDir}`);
