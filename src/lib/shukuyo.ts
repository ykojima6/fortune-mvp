export type LunarCalendarDay = {
  solar_date: string;
  lunar_month: number;
  lunar_day: number;
  is_leap_month?: boolean | null;
  moon_phase?: string | null;
  rokuyo?: string | null;
  sexagenary?: string | null;
};

export type Shuku = {
  index: number;
  name: string;
  reading: string;
  catchyName: string;
  group: string;
  theme: string;
  strength: string;
  caution: string;
};

const shukuDetails = {
  昴: ["ぼう", "プライドビューティー", "格", "審美眼と誇り", "価値あるものを見抜く", "プライドで助けを拒まない"],
  畢: ["ひつ", "マイペース職人ガール", "安定", "蓄積と職人気質", "着実に守り育てる", "変化を嫌いすぎない"],
  觜: ["し", "言語化クイーン", "言葉", "分析と伝達", "状況を言語化する", "批評が冷たく響かないように"],
  参: ["しん", "ムードメーカーガール", "行動", "瞬発力と遊び心", "場を動かす明るさ", "飽きやすさを予定で補う"],
  井: ["せい", "知性シェアガール", "泉", "知性と分配", "知識を人の役に立てる", "理屈で感情を覆わない"],
  鬼: ["き", "ピュアひらめきガール", "無垢", "ひらめきと善意", "純粋な発想で突破する", "警戒心の薄さに注意"],
  柳: ["りゅう", "ドラマチック情熱ガール", "熱", "情念と表現", "強い想いを伝える", "気分に飲まれすぎない"],
  星: ["せい", "ステージ映えガール", "舞台", "個性と輝き", "自分の色で人を惹きつける", "目立つことへの恐れを手放す"],
  張: ["ちょう", "華やかプロデューサー", "拡張", "演出と発展", "物事を大きく見せる力", "見栄で負担を増やさない"],
  翼: ["よく", "自由トラベルガール", "飛翔", "旅と視野", "遠くを見る広い視点", "理想の場所を探し続けない"],
  軫: ["しん", "癒やしチューナー", "癒やし", "共感と調律", "人の痛みに寄り添う", "背負いすぎて消耗しない"],
  角: ["かく", "ご縁育てガール", "成長", "芽吹きと拡張", "新しい縁を育てる力", "勢いだけで約束を増やしすぎない"],
  亢: ["こう", "芯つよエレガンス", "品格", "信念と境界線", "筋を通して信頼を得る", "正しさで相手を追い詰めない"],
  氐: ["てい", "安心ベースガール", "根", "生活基盤と愛着", "人を安心させる持久力", "身内意識が強くなりすぎる"],
  房: ["ぼう", "愛されオーラガール", "魅力", "華やぎと保護", "場の空気を豊かにする", "甘えと依存の境目を見る"],
  心: ["しん", "本音センサーガール", "感情", "情熱と核心", "人の本音に触れる直感", "感情の波で判断しない"],
  尾: ["び", "ストイック完璧ガール", "集中", "徹底と完成度", "粘り強く成果へ寄せる", "細部にこだわり孤立しない"],
  箕: ["き", "風まかせ突破ガール", "風", "自由と突破", "停滞を動かす軽やかさ", "言葉が鋭くなりすぎる"],
  斗: ["と", "理想を叶えるリーダー", "器", "理想と統率", "大きな構想を形にする", "理想論で現実を置き去りにしない"],
  女: ["じょ", "きちんと整えガール", "整え", "慎重さと秩序", "乱れを整える実務力", "心配を抱え込みすぎない"],
  虚: ["きょ", "ミステリアス夢見ガール", "夢", "精神性と余白", "見えない流れを読む", "現実逃避に傾かない"],
  危: ["き", "繊細アラートガール", "変化", "繊細な感受性", "危機を察知して進路を変える", "不安だけで関係を切らない"],
  室: ["しつ", "居場所クリエイター", "構築", "家と仲間", "居場所を作る求心力", "守りに入りすぎない"],
  壁: ["へき", "知識ストックガール", "知恵", "記録と継承", "知識を蓄え人を支える", "距離を取りすぎない"],
  奎: ["けい", "センス文章ガール", "美意識", "洗練と文章", "言葉や形で魅せる", "理想の高さで疲れない"],
  婁: ["ろう", "気配りバランサー", "世話", "観察と調整", "相手に合わせる柔軟性", "自分の希望を後回しにしない"],
  胃: ["い", "欲しいを掴むガール", "獲得", "欲求と生命力", "必要なものを取りに行く", "強引さや執着に注意"],
} as const;

const shukuOrder = [
  "昴",
  "畢",
  "觜",
  "参",
  "井",
  "鬼",
  "柳",
  "星",
  "張",
  "翼",
  "軫",
  "角",
  "亢",
  "氐",
  "房",
  "心",
  "尾",
  "箕",
  "斗",
  "女",
  "虚",
  "危",
  "室",
  "壁",
  "奎",
  "婁",
  "胃",
] as const;

export const shukuList: Shuku[] = shukuOrder.map((name, index) => {
  const [reading, catchyName, group, theme, strength, caution] = shukuDetails[name];
  return {
    index,
    name,
    reading,
    catchyName,
    group,
    theme,
    strength,
    caution,
  };
});

const monthStartShuku: Record<number, (typeof shukuOrder)[number]> = {
  1: "室",
  2: "奎",
  3: "胃",
  4: "畢",
  5: "参",
  6: "鬼",
  7: "張",
  8: "角",
  9: "氐",
  10: "心",
  11: "斗",
  12: "虚",
};

export function resolveShuku(birthDate: string, calendarDay?: LunarCalendarDay | null) {
  const [, fallbackMonthText, fallbackDayText] = birthDate.split("-");
  const fallbackMonth = Number(fallbackMonthText);
  const fallbackDay = Number(fallbackDayText);
  const lunarMonth = calendarDay?.lunar_month ?? fallbackMonth;
  const lunarDay = calendarDay?.lunar_day ?? fallbackDay;
  const startIndex = shukuList.findIndex((shuku) => shuku.name === monthStartShuku[lunarMonth]);
  const index = (startIndex + lunarDay - 1) % 27;
  return shukuList[index];
}
