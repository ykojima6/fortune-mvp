export type TarotCard = {
  id: number;
  slug: string;
  name: string;
  jpName: string;
  upright: string;
  reversed: string;
  image: string;
};

export const tarotBackImage = "/tarot/anime/card-back.png";

export const majorArcana: TarotCard[] = [
  ["fool", "The Fool", "愚者", "新しいことを始める。自由に動く。", "あわてて動きすぎる。準備を忘れる。"],
  ["magician", "The Magician", "魔術師", "自分の力を使って形にする。", "やることが多くて気持ちが散らばる。"],
  ["high-priestess", "The High Priestess", "女教皇", "心の声をよく聞く。静かに考える。", "考えすぎて本音をしまいこむ。"],
  ["empress", "The Empress", "女帝", "やさしさや魅力が育つ。", "世話を焼きすぎる。だらだらしやすい。"],
  ["emperor", "The Emperor", "皇帝", "ルールを決めてしっかり進める。", "自分の考えにこだわりすぎる。"],
  ["hierophant", "The Hierophant", "教皇", "信頼できる人から学ぶ。", "いつものやり方にしばられすぎる。"],
  ["lovers", "The Lovers", "恋人", "大切なものを選ぶ。人と心が合う。", "迷って決められない。相手に合わせすぎる。"],
  ["chariot", "The Chariot", "戦車", "目標に向かって前へ進む。", "急ぎすぎて周りが見えなくなる。"],
  ["strength", "Strength", "力", "やさしく、ねばり強く向き合う。", "自信がなくなり、がまんしすぎる。"],
  ["hermit", "The Hermit", "隠者", "一人で考えると答えが見つかる。", "一人で抱えこみすぎる。"],
  ["wheel-of-fortune", "Wheel of Fortune", "運命の輪", "流れが変わる。チャンスが来る。", "タイミングが合いにくい。無理に動かない。"],
  ["justice", "Justice", "正義", "正しいかどうかを落ち着いて決める。", "どちらがいいか決めきれない。"],
  ["hanged-man", "The Hanged Man", "吊るされた男", "見方を変えると答えが出る。", "がんばっているのに進みにくい。"],
  ["death", "Death", "死神", "古いものを終えて、新しく変わる。", "終わらせるのがこわくて止まりやすい。"],
  ["temperance", "Temperance", "節制", "バランスをとる。ちょうどよく整える。", "やりすぎ、少なすぎに注意する。"],
  ["devil", "The Devil", "悪魔", "本当にほしいものに気づく。", "やめたいことに引っぱられやすい。"],
  ["tower", "The Tower", "塔", "思いこみがくずれ、本当のことに気づく。", "小さな問題を早めに直すサイン。"],
  ["star", "The Star", "星", "希望が見える。元気を取り戻す。", "すぐに結果を求めすぎない。"],
  ["moon", "The Moon", "月", "不安な気持ちをていねいに見る。", "もやもやが晴れて、落ち着いて考えられる。"],
  ["sun", "The Sun", "太陽", "明るい気持ちでうまく進む。", "自信が強すぎて見落としやすい。"],
  ["judgement", "Judgement", "審判", "もう一度やり直すチャンスが来る。", "後悔にとらわれて動きにくい。"],
  ["world", "The World", "世界", "一つのことがまとまり、次へ進める。", "あと少しで完成。最後まで整える。"],
].map(([slug, name, jpName, upright, reversed], id) => ({
  id,
  slug,
  name,
  jpName,
  upright,
  reversed,
  image: `/tarot/anime/${String(id).padStart(2, "0")}-${slug}.png`,
}));

export function drawTarot(seedText: string) {
  let hash = 2166136261;
  for (const char of seedText) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  const index = Math.abs(hash) % majorArcana.length;
  const reversed = ((hash >>> 3) & 1) === 1;
  return { card: majorArcana[index], reversed };
}
