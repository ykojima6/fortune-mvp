// 入力の長さ上限の確認。
// 使い方: OPENROUTER_API_KEY を空にして `npm run build && npx next start -p 3917` を起動し、
//        `node scripts/security-smoke.mjs http://127.0.0.1:3917` を実行する。
const base = process.argv[2] || "http://127.0.0.1:3917";
const post = (path, body) =>
  fetch(base + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.status);
// 鍵が空で起動されているかを先に確かめる（空でないと、下の確認が実際に LLM を呼んでしまう）
const probe = await fetch(base + "/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ context: "c", question: "q" }) })
  .then((r) => r.json())
  .catch(() => null);
if (!probe || !String(probe.answer || "").startsWith("OpenRouter APIキーが未設定")) {
  console.error("中止: OPENROUTER_API_KEY を空にして起動したサーバーに向けて実行してください。");
  process.exit(2);
}
const cases = [
  ["chat 通常", "/api/chat", { context: "結果".repeat(1600), question: "仕事運は？" }, 200],
  ["chat 結果文が巨大", "/api/chat", { context: "x".repeat(8001), question: "q" }, 413],
  ["chat 質問が巨大", "/api/chat", { context: "c", question: "q".repeat(2001) }, 413],
  ["reading 通常", "/api/reading", { name: "山田太郎", birthDate: "1990-01-01" }, 200],
  ["reading 名前が巨大", "/api/reading", { name: "n".repeat(101), birthDate: "1990-01-01" }, 413],
  ["reading position が巨大", "/api/reading", { name: "a", birthDate: "1990-01-01", tarotDraws: [{ cardId: 1, position: "p".repeat(101) }] }, 413],
  ["chat 結果文がちょうど上限", "/api/chat", { context: "x".repeat(8000), question: "q" }, 200],
  ["chat 絵文字でちょうど上限", "/api/chat", { context: "🌙".repeat(8000), question: "q" }, 200],
  ["chat 絵文字で上限超え", "/api/chat", { context: "🌙".repeat(8001), question: "q" }, 413],
  ["chat 質問がちょうど上限", "/api/chat", { context: "c", question: "q".repeat(2000) }, 200],
  ["reading 名前がちょうど上限", "/api/reading", { name: "n".repeat(100), birthDate: "1990-01-01" }, 200],
  ["reading スプレッド名が巨大", "/api/reading", { name: "a", birthDate: "1990-01-01", spreadName: "s".repeat(101) }, 413],
  ["reading 相手の名前が巨大", "/api/reading", { name: "a", birthDate: "1990-01-01", partner: { name: "p".repeat(101), birthDate: "1991-01-01" } }, 413],
  ["chat 中身なし", "/api/chat", {}, 400],
  ["chat 質問が空（結果文が巨大でも 400 が先）", "/api/chat", { context: "x".repeat(8001), question: "" }, 400],
  ["reading 中身なし", "/api/reading", {}, 400],
  ["reading スプレッド名がちょうど上限", "/api/reading", { name: "a", birthDate: "1990-01-01", spreadName: "s".repeat(100) }, 200],
  ["reading position がちょうど上限", "/api/reading", { name: "a", birthDate: "1990-01-01", tarotDraws: [{ cardId: 1, position: "p".repeat(100) }] }, 200],
  ["reading 未ログインで相手あり", "/api/reading", { name: "a", birthDate: "1990-01-01", partner: { name: "p".repeat(100), birthDate: "1991-01-01" } }, 401],
  ["reading 14枚目だけ position が巨大（13枚目までしか使わない）", "/api/reading", { name: "a", birthDate: "1990-01-01", tarotDraws: [...Array(13).fill({ cardId: 1, position: "p" }), { cardId: 1, position: "p".repeat(101) }] }, 401],
];
let failed = 0;
for (const [label, path, body, want] of cases) {
  const got = await post(path, body);
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? "OK " : "NG "} ${label}: ${got} (期待 ${want})`);
}
process.exit(failed ? 1 : 0);
