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
  ["fool", "The Fool", "愚者", "気まぐれで不安定。目的がぼやけやすく、ふらっと動きたくなる。", "間違いに気づき、目的を持って動き直す。甘い誘いには注意する。"],
  ["magician", "The Magician", "奇術師", "独創力とチャンス。技術や言葉を使って、新しい芽を出す。", "口先だけになりやすい。未熟さやミスを整え、足元を見直す。"],
  ["high-priestess", "The High Priestess", "女教皇", "知識、気品、理性。ロマンチックでも一歩ずつ考えて進む。", "考えが浅くなりやすい。反発や気まぐれで物事を散らかさない。"],
  ["empress", "The Empress", "女帝", "安定、豊かさ、幸せ。実りが育ち、愛情や魅力が広がる。", "不安定さや嫉妬。ぜいたく、甘え、ライバル意識に注意する。"],
  ["emperor", "The Emperor", "皇帝", "力、支配、行動力。目的を実現し、現実を動かす強さがある。", "無気力や見かけ倒し。強く出すぎると信用を失いやすい。"],
  ["hierophant", "The Hierophant", "教皇", "慈悲、寛容、安心感。良き相談相手や心の転換が助けになる。", "思いやり不足や反発。形だけの正しさや物質へのこだわりに注意する。"],
  ["lovers", "The Lovers", "恋人", "恋愛、誘惑、楽しさ。心が動き、遊びやときめきが強くなる。", "気まぐれ、嫉妬、別れ。浮ついた態度や方針変更に注意する。"],
  ["chariot", "The Chariot", "戦車", "勝利、成功、決断。強い意志で状況をコントロールする。", "敗北や妨害。勢いが乱れると、けんかや挫折につながりやすい。"],
  ["strength", "Strength", "剛毅", "勇気、情熱、元気。困難を突破し、努力で欲しいものを得る。", "自信のなさや無気力。押し切られず、力の使い方を整える。"],
  ["hermit", "The Hermit", "隠者", "思慮分別とアドバイス。すぐ動かず、学びや研究から答えを探す。", "軽率さや未熟さ。よい助言が得にくく、プレッシャーに負けやすい。"],
  ["wheel-of-fortune", "Wheel of Fortune", "運命の輪", "チャンス、発展、幸運。事態が好転し、運命的な流れが来る。", "不運や伸び悩み。悪い方へ考えすぎず、タイミングを待つ。"],
  ["justice", "Justice", "正義", "誠実、中立、公正。無理をせず、正しい判断で克服する。", "不公平、偏見、独断。バランスを崩さず、ずるさを避ける。"],
  ["hanged-man", "The Hanged Man", "刑死者", "苦しい時期、身動きの取りにくさ。忍耐と自己犠牲が問われる。", "見通しは出るが油断は禁物。わがままを直し、軌道修正する。"],
  ["death", "Death", "死神", "損失、破局、見切り。終わらせるべきものをはっきりさせる。", "希望が戻る。一時的な失敗から立て直し、思わぬ回復がある。"],
  ["temperance", "Temperance", "節制", "忍耐、反省、調和。心を素直にして、力を蓄える。", "対立、不一致、浪費。強情やプライドをゆるめる。"],
  ["devil", "The Devil", "悪魔", "悪い誘惑や転落。理性を失いやすく、困難な事態に注意する。", "目が覚めて自立する。誘惑に勝ち、まじめに立て直す。"],
  ["tower", "The Tower", "塔", "破壊、失敗、急なトラブル。古い考えやおごりが崩れる。", "小さく済む危険。誤解、うわさ、だまされやすさを早めに見抜く。"],
  ["star", "The Star", "星", "希望、順調、よい未来。よい愛やチャンスが訪れる。", "悲観、あきらめ、疲れ。計画が流れても希望を捨てない。"],
  ["moon", "The Moon", "月", "不安定、あざむき、見えない敵。裏側や危険に気づくサイン。", "ウソを見抜く。小さな危険で済み、決心と安心が戻る。"],
  ["sun", "The Sun", "太陽", "幸福、成功、満足。目的を成し遂げ、明るい発展がある。", "孤独やむなしさ。望み通りでなくても人間関係を整える。"],
  ["judgement", "Judgement", "審判", "再生、再起、目覚め。発想を変えると愛や流れがよみがえる。", "未決定、延期、こだわり。古い考えを変えないと進みにくい。"],
  ["world", "The World", "世界", "成功、完成、幸運。目的を遂げ、すばらしい関係や成果に近づく。", "挫折や不満足。中途半端で終わらせず、未練を整理する。"],
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
