import type { Shuku } from "./shukuyo";
import type { TarotCard } from "./tarot";

type CalendarInfo = {
  solar_date: string;
  lunar_month?: number | null;
  lunar_day?: number | null;
  is_leap_month?: boolean | null;
  moon_phase?: string | null;
  rokuyo?: string | null;
  sexagenary?: string | null;
} | null;

type ReadingInput = {
  profileName: string;
  birthDate: string;
  shuku: Shuku;
  calendar: CalendarInfo;
  tarot: TarotCard;
  reversed: boolean;
  spreadName?: string;
  tarotDraws?: Array<{
    position: string;
    tarot: TarotCard;
    reversed: boolean;
  }>;
  partner?: {
    name: string;
    birthDate: string;
    shuku: Shuku;
    calendar: CalendarInfo;
  } | null;
};

type SpreadReadingSpec = {
  title: string;
  purpose: string;
  positionRule: string;
  synthesisRule: string;
  structure: string;
  avoid: string;
};

const defaultModel = process.env.OPENROUTER_MODEL || "openrouter/free";
const openRouterTimeoutMs = 30000;

export async function generateReading(input: ReadingInput) {
  const key = getOpenRouterKey();
  const fallback = generateLocalReading(input);
  if (!key) return fallback;
  const today = getJapanTodayLabel();
  const spreadName = input.spreadName || "ワンオラクル";
  const draws =
    input.tarotDraws && input.tarotDraws.length > 0
      ? input.tarotDraws
      : [{ position: "今日のメッセージ", tarot: input.tarot, reversed: input.reversed }];
  const tarotLines = draws
    .map(
      (draw, index) =>
        `${index + 1}. ${draw.position}: ${draw.tarot.jpName}（${draw.tarot.name}）${
          draw.reversed ? "逆位置" : "正位置"
        }、意味: ${draw.reversed ? draw.tarot.reversed : draw.tarot.upright}`,
    )
    .join("\n");
  const isOneOracle = !input.partner && draws.length === 1 && spreadName === "ワンオラクル";
  const spreadSpec = getSpreadReadingSpec(spreadName, Boolean(input.partner));
  const partnerBlock = input.partner
    ? `\n相手: ${input.partner.name}\n相手の生年月日: ${input.partner.birthDate}\n相手の宿曜: ${input.partner.shuku.name}宿（${input.partner.shuku.reading}）、テーマ: ${input.partner.shuku.theme}、強み: ${input.partner.shuku.strength}、注意: ${input.partner.shuku.caution}\n相手の暦: ${
        input.partner.calendar
          ? `${formatLunarDate(input.partner.calendar)}、月相${input.partner.calendar.moon_phase ?? "不明"}、六曜${input.partner.calendar.rokuyo ?? "不明"}、干支${input.partner.calendar.sexagenary ?? "不明"}`
          : "暦DB未登録のため推定"
      }`
    : "";
  const requestTitle = input.partner
    ? "相性リーディング"
    : isOneOracle
      ? "今日の占い"
      : `${spreadName}のリーディング`;
  const lengthRequirement = isOneOracle ? "2,200〜2,800字程度。最大でも3,000字以内" : "1,800〜2,200字程度。最大でも2,500字以内";
  const focusRequirement = input.partner
    ? "あなたと相手の宿曜の違い、近づきやすい点、すれ違いやすい点、関係をよくする具体策を多めに書く。"
    : isOneOracle
      ? "前半は「この人自身の性格・思考癖・対人傾向・仕事の進め方」を多めに書く。ユーザーが当たっているか判断しやすい描写にする。"
      : `${spreadName}の固有の目的、ポジション同士の関係、結論の出し方を中心に読む。今日の運勢としては書かない。`;
  const structure = spreadSpec.structure;

  try {
    const response = await fetchOpenRouter(
      key,
      [
        {
          role: "system",
          content:
            "You are a Japanese fortune-telling writer. Give grounded, elegant, specific entertainment-only readings. Avoid medical, legal, financial guarantees. Output Japanese only.",
        },
        {
          role: "user",
          content: `次の情報から「${requestTitle}」として、宿曜、暦、タロットスプレッドを統合した占い結果を作成してください。
名前: ${input.profileName}
生年月日: ${input.birthDate}
今日: ${today}
宿曜: ${input.shuku.name}宿（${input.shuku.reading}）、テーマ: ${input.shuku.theme}、強み: ${input.shuku.strength}、注意: ${input.shuku.caution}
暦: ${input.calendar ? `${formatLunarDate(input.calendar)}、月相${input.calendar.moon_phase ?? "不明"}、六曜${input.calendar.rokuyo ?? "不明"}、干支${input.calendar.sexagenary ?? "不明"}` : "暦DB未登録のため推定"}
${partnerBlock}
スプレッド: ${spreadName}
タロット:
${tarotLines}

要件:
- 日本語で${lengthRequirement}に収める。
- 占いはエンタメとして断定しすぎず、それでも具体的に。
- ${focusRequirement}
- 宿曜だけで読む本人特性の章を必ず入れる。この章ではタロットに触れない。
- ${isOneOracle ? "今日の占いとして、今日の気分、判断、仕事、恋愛・人間関係、注意点、今日やるとよい行動に落とし込む。" : "「今日の占い」という見出しや日運中心の書き方にはしない。選んだテーマや関係性、問題の流れを読む。"}
- 生年月日からわかる宿曜と、暦、引いたカードの順に根拠を自然に説明する。
- タロットに関する説明は、小学5年生でもわかる言葉にする。むずかしい熟語や専門用語は避け、短い文で「つまり今日どうすればいいか」を書く。
- タロットの章は、特にやさしい言葉で書く。1文は長くしすぎない。
- スプレッド名だけを置き換えた汎用文にしない。必ず次の「スプレッド専用ルール」に従う。
- カードの意味を順番に並べるだけで終わらせない。最低2回は、別々のポジション同士を比較して流れを説明する。
- 医療、法律、投資、ギャンブルの保証や断定は避ける。

スプレッド専用ルール:
- 目的: ${spreadSpec.purpose}
- ポジションの読み方: ${spreadSpec.positionRule}
- 総合判断の出し方: ${spreadSpec.synthesisRule}
- 避ける書き方: ${spreadSpec.avoid}

構成:
${structure}`,
        },
      ],
      0.8,
    );

    if (!response.ok) return fallback;
    const data = await response.json();
    const reading = data?.choices?.[0]?.message?.content?.trim();
    return isUsableReading(reading) ? reading : fallback;
  } catch {
    return fallback;
  }
}

export async function answerQuestion(context: string, question: string) {
  const key = getOpenRouterKey();
  if (!key) {
    return "OpenRouter APIキーが未設定です。占い結果の文脈では、今は結果文の中で一番引っかかる言葉を一つ選び、その理由を短く書き出すのが次の一手になります。";
  }

  let response: Response;
  try {
    response = await fetchOpenRouter(
      key,
      [
        {
          role: "system",
          content:
            "You answer follow-up questions about a Japanese entertainment fortune reading. Be concise, practical, and non-deterministic. Japanese only.",
        },
        { role: "user", content: `占い結果:\n${context}\n\n質問:\n${question}` },
      ],
      0.7,
    );
  } catch {
    return "LLM応答が時間内に返りませんでした。占い結果の中で一番気になる言葉を一つ選び、その理由を短く書き出すところから始めてください。";
  }

  if (!response.ok) {
    return "今はLLM応答を取得できませんでした。質問を少し短くして再送するか、OpenRouterのモデル設定を確認してください。";
  }
  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || "回答を生成できませんでした。";
}

function fetchOpenRouter(
  key: string,
  messages: Array<{ role: "system" | "user"; content: string }>,
  temperature: number,
) {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout>;

  const request = fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal: controller.signal,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Shukuyo Tarot MVP",
    },
    body: JSON.stringify({
      model: defaultModel,
      messages,
      temperature,
    }),
  });

  const timeoutRequest = new Promise<Response>((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new Error("OpenRouter request timed out"));
    }, openRouterTimeoutMs);
  });

  return Promise.race([request, timeoutRequest]).finally(() => clearTimeout(timeout));
}

export function generateLocalReading(input: ReadingInput) {
  const position = input.reversed ? "逆位置" : "正位置";
  const tarotMeaning = input.reversed ? input.tarot.reversed : input.tarot.upright;
  const today = getJapanTodayLabel();
  const spreadName = input.spreadName || "ワンオラクル";
  const draws =
    input.tarotDraws && input.tarotDraws.length > 0
      ? input.tarotDraws
      : [{ position: "今日のメッセージ", tarot: input.tarot, reversed: input.reversed }];
  const spreadSummary = draws
    .map(
      (draw, index) =>
        `${index + 1}. ${draw.position}は${draw.tarot.jpName}（${draw.reversed ? "逆位置" : "正位置"}）。${
          draw.reversed ? draw.tarot.reversed : draw.tarot.upright
        }`,
    )
    .join("\n");
  const calendarLine = input.calendar
    ? `${formatLunarDate(input.calendar)}、${input.calendar.moon_phase ?? "月相未登録"}、${input.calendar.rokuyo ?? "六曜未登録"}の気配`
    : "暦DB未登録日のため、太陽暦からの推定";
  const isOneOracle = !input.partner && draws.length === 1 && spreadName === "ワンオラクル";
  const spreadSpec = getSpreadReadingSpec(spreadName, Boolean(input.partner));
  const partnerLine = input.partner
    ? `\n相性の相手は${input.partner.name}さんです。生年月日から見る相手の宿曜は${input.partner.shuku.name}宿で、テーマは「${input.partner.shuku.theme}」です。あなたの${input.shuku.name}宿は${input.shuku.strength}ところが強みで、相手の${input.partner.shuku.name}宿は${input.partner.shuku.strength}ところに良さがあります。二人の相性では、同じ速さで進もうとするより、得意な役割を分けるほど関係が安定します。あなたが細部を整え、相手が別の角度から流れを作るようにすると、お互いの良さがぶつからずに出やすくなります。一方で、疲れている時は、相手の何気ない言葉を重く受け取りやすいので、すぐに結論を出さず「今の意味をもう少し教えて」と確認するのがよいでしょう。`
    : "";

  if (!isOneOracle) {
    return `${input.partner ? "相性リーディング" : `${spreadName}のリーディング`}
${input.profileName}さんの宿曜は${input.shuku.name}宿です。これは「${input.shuku.theme}」を核に持つ宿で、物事を見る時に自分なりの基準を大切にします。暦では${calendarLine}が重なっているため、今のテーマは勢いだけで進めるより、関係や状況の細部を見直すことにあります。今回の${spreadName}では、カードを一枚ずつ独立して見るより、前後のつながりを読むことが大切です。${partnerLine}

宿曜だけで見るあなたの基本特性
${input.shuku.name}宿の人は、表面的には落ち着いて見えても、内側にはかなりはっきりした美学や判断基準を持っています。人から強く言われたから動くというより、自分の中で納得できた瞬間に一気に集中力が出るタイプです。強みは${input.shuku.strength}こと。注意点は「${input.shuku.caution}」です。自分の感覚が鋭いぶん、納得できない相手や雑な進め方に対して、心の中で距離を置きやすいところがあります。

スプレッド各ポジションの読み
${spreadSummary}

このスプレッドの目的
${spreadSpec.purpose} ${spreadSpec.positionRule} そのため、中心になる${input.tarot.jpName}（${position}）だけで結論を出さず、隣り合う位置や対になる位置を比べて読みます。「${tarotMeaning}」という意味は、今の状況では、急に大きな答えを出すより、まず一つの態度を決めることが大切だと示しています。${spreadSpec.synthesisRule}

今見えている課題と流れ
このリーディングでは、気持ちの中にある本音を無視しないことが大切です。人に合わせて進めるほど一時的には楽になりますが、あとで小さな不満が残りやすくなります。逆に、自分の希望だけを押し出すと、相手や周囲との呼吸が合いにくくなります。今は、言葉を短く、具体的にするほど流れが整います。

具体的な行動のヒント
まず、今いちばん気になっていることを一文にしてください。次に、その一文を相手や関係者に伝えるなら、どの言い方ならやわらかく届くかを考えます。最後に、今日決めきれないことは無理に結論を出さず、確認する項目を三つに絞ってください。カードは、焦るより整えること、黙るより短く伝えることを勧めています。

キーフレーズ: 答えを急がず、関係の流れを整える。`;
  }

  return `今日の占い
${today}の${input.profileName}さんは、外へ勢いよく出るよりも、自分の中にある判断基準を整えるほど運が開きます。生年月日から見る宿曜は${input.shuku.name}宿。これは「${input.shuku.theme}」を核に持つ宿で、今日の流れでは、周囲に合わせるだけではなく「自分は本当は何を大事にしたいのか」を確認することが大切です。暦では${calendarLine}が重なっているため、気分は少し繊細になりやすく、普段なら流せる一言や小さな予定変更にも反応しやすい日です。ただし、それは悪いことではありません。細かな違和感に気づけるぶん、早めに軌道修正できる日でもあります。

宿曜だけで見るあなたの基本特性
${input.shuku.name}宿の人は、表面的には落ち着いて見えても、内側にはかなりはっきりした美学や判断基準を持っています。人から強く言われたから動くというより、自分の中で納得できた瞬間に一気に集中力が出るタイプです。強みは${input.shuku.strength}こと。派手な勢いで目立つより、積み重ねた経験や観察から「これはこうした方がいい」と見抜く力があります。周囲がまだ雰囲気で話している段階でも、あなたは細部の矛盾、相手の本音、物事の弱い部分に先に気づいていることが多いはずです。

一方で、${input.shuku.name}宿の注意点は「${input.shuku.caution}」です。自分の感覚が鋭いぶん、納得できない相手や雑な進め方に対して、心の中で距離を置きやすいところがあります。嫌いになったわけではなくても、説明するより自分で抱えた方が早いと感じてしまう。その結果、周囲からは「何を考えているかわからない」「急に温度が下がった」と受け取られる場合があります。本来のあなたは冷たい人ではなく、むしろ大切なものを雑に扱いたくない人です。だからこそ、今日のような日は、黙って我慢するよりも、短い言葉で境界線を伝える方が運を崩しません。

今日の心の動きと運勢
今日は、頭では前に進みたいのに、気持ちのどこかで確認作業をしたくなる日です。新しいことを始めるより、すでに始まっているものの精度を上げる方が向いています。予定、連絡、資料、買い物、約束など、細部を一つ整えるだけで流れが軽くなります。逆に、違和感を無視して勢いだけで決めると、あとから小さな修正が増えそうです。今日の開運ポイントは、完璧を目指すことではなく「ここだけは外したくない」という一点を決めることです。

また、今日は人の期待に合わせすぎると、自分の本音が見えにくくなります。頼まれごとを受ける前に、時間、気力、優先順位を一度だけ確認してください。すぐに返事をしなくても、ていねいに考えて返す方が、あなたらしい誠実さとして伝わります。

仕事・創作・お金まわり
仕事や創作では、広げるより絞る日です。アイデアを増やす、資料を盛る、人に良く見せる、という方向よりも、目的に合わないものを削る方が成果につながります。${input.profileName}さんはもともと、場の空気に流されながらも、内心ではかなり冷静に優先順位を見ています。今日はその感覚を信じて大丈夫です。お金まわりでは、衝動的な購入や勢いの契約より、比較、見直し、保留が吉。欲しいものがあるなら、今日すぐ決めるより「なぜ欲しいのか」を一度言葉にすると、必要なものと気分で欲しいものが分かれます。

恋愛・人間関係
人間関係では、相手の反応を読みすぎないことが大切です。今日のあなたは、相手の言葉の裏側や表情の変化に敏感になりやすい状態です。好きな人、近い人、仕事で関わる人ほど「本当はどう思っているのだろう」と考えすぎるかもしれません。ただ、今日の運勢では、相手の気持ちを推理するより、自分の希望を丁寧に出す方が関係が安定します。恋愛では、重い確認よりも軽い提案が合います。「少し話せる？」「この日どう？」のように、相手が答えやすい形にすると流れが動きます。

タロットが示す今日の選択
今回のスプレッドは${spreadName}です。
${spreadSummary}

中心になるカードは${input.tarot.jpName}（${input.tarot.name}）の${position}です。このカードの意味は「${tarotMeaning}」です。むずかしく言うと、タロットは今日の選び方を教えてくれる合図です。かんたんに言うと、「いつもの考え方だけで決めないで、少しだけやり方を変えてみよう」ということです。今日は、大きな決断をいきなりする日ではありません。まず一つだけ試す。短く連絡する。少しだけ見せる。このくらいの小さな行動が合っています。うまくいくか心配なことも、全部を完璧にしようとしなくて大丈夫です。小さく始めれば、あとから直せます。

今日の開運アクション
今日やるとよいことは三つです。まず、気になっている未完了の連絡を一つだけ終わらせること。次に、作業環境やスマホ内の不要なものを五分だけ整理すること。最後に、自分の本音を一文でメモすることです。「本当はこうしたい」「これは無理しすぎている」「ここは譲りたくない」と短く書くだけで、今日の判断がぶれにくくなります。運を上げる色は青みのある白、または深いネイビー。持ち物は、メモ帳、細いペン、透明感のある小物が合います。

キーフレーズ: 自分の違和感を、静かな判断力に変える。`;
}

function getSpreadReadingSpec(spreadName: string, hasPartner: boolean): SpreadReadingSpec {
  const compatibilityPrefix = hasPartner
    ? "相性では、あなた側と相手側の宿曜差、カードの位置、会話のすれ違いを重ねて読む。"
    : "";

  if (spreadName === "ツーオラクル") {
    return {
      title: "ツーオラクル",
      purpose: `${compatibilityPrefix}2枚を「現状」と「対策」の対比として読み、今起きていることと次に取るべき態度を分けて出す。`,
      positionRule:
        "1枚目は今の状態、2枚目は動かし方として扱う。2枚のカードが同じ方向なら後押し、反対方向なら迷いの原因として説明する。",
      synthesisRule:
        "結論では、現状カードから対策カードへ移るための小さな一歩を一つに絞る。A/B比較の相談に見える場合は、2枚を選択肢の違いとしても補足する。",
      structure: `1. ツーオラクルの結論
2. 宿曜だけで見るあなたの基本特性
3. 現状カードが示す今の状態
4. 対策カードが示す動かし方
5. 2枚を比べた具体的な行動
最後に一言のキーフレーズ。`,
      avoid: "2枚を別々の一枚引きのように説明して終わらせない。",
    };
  }

  if (spreadName === "スリーカード") {
    return {
      title: "スリーカード",
      purpose: `${compatibilityPrefix}過去、現在、未来を一本の流れとして読み、何が原因で今になり、次にどこへ向かうかを見る。`,
      positionRule:
        "過去は背景、現在は今の課題、未来はこのまま進んだ時の着地点として扱う。必ず過去から現在、現在から未来への変化を説明する。",
      synthesisRule:
        "結論では、過去の癖をどう手放し、現在の行動をどう変えると未来カードが良く働くかを書く。",
      structure: `1. スリーカードで見える流れ
2. 宿曜だけで見るあなたの基本特性
3. 過去から現在へ起きた変化
4. 現在から未来へ向かう道筋
5. 今からできる具体的な調整
最後に一言のキーフレーズ。`,
      avoid: "過去・現在・未来を単発の運勢として並べない。",
    };
  }

  if (spreadName === "ギリシャ十字") {
    return {
      title: "ギリシャ十字",
      purpose: `${compatibilityPrefix}現状、障害、対策、結果、最終的な答えを十字型に整理し、問題解決の方向を出す。`,
      positionRule:
        "現状と障害で問題の形を決め、対策が結果にどうつながるかを読む。最後のカードは全体を統合した答えとして扱う。",
      synthesisRule:
        "結論では、障害を避ける方法ではなく、対策カードを使って結果カードへ進む道を具体化する。",
      structure: `1. ギリシャ十字の最終答え
2. 宿曜だけで見るあなたの基本特性
3. 現状と障害の読み
4. 対策から結果への流れ
5. 最終的な答えと実行ポイント
最後に一言のキーフレーズ。`,
      avoid: "5枚目をただの追加カードとして扱わない。必ず1〜4枚目をまとめる答えにする。",
    };
  }

  if (spreadName === "ヘキサグラム") {
    return {
      title: "ヘキサグラム",
      purpose: `${compatibilityPrefix}過去から未来への流れ、自分、相手や周囲、障害、最終結果を六芒星のように立体的に読む。`,
      positionRule:
        "過去・現在・近い未来で時間の流れを作り、自分の気持ちと相手や周囲を対比する。障害は二者の間にあるズレとして読む。",
      synthesisRule:
        "結論では、自分側の望みと相手や周囲の状態を比べ、最終結果へ近づくための関わり方を出す。",
      structure: `1. ヘキサグラムで見える全体像
2. 宿曜だけで見るあなたの基本特性
3. 過去・現在・近い未来の流れ
4. 自分と相手や周囲のズレ
5. 障害と最終結果から見る関わり方
最後に一言のキーフレーズ。`,
      avoid: "恋愛や人間関係の相談なのに、自分側だけの話で終わらせない。",
    };
  }

  if (spreadName === "ケルト十字") {
    return {
      title: "ケルト十字",
      purpose: `${compatibilityPrefix}問題の核心、妨げ、意識と無意識、過去と近未来、自分、周囲、願望と不安、最終結果を多角的に読む。`,
      positionRule:
        "1枚目と2枚目を中心テーマと葛藤として最優先で読む。3枚目と4枚目は頭で考えていることと心の底の差、5枚目と6枚目は過去から近未来への流れ、7〜10枚目は自分と外側の影響から結論への道として扱う。",
      synthesisRule:
        "最終結果は10枚目だけで断定しない。中心十字、時間軸、周囲の影響を合わせて、なぜその結果に向かうのかを説明する。",
      structure: `1. ケルト十字の核心
2. 宿曜だけで見るあなたの基本特性
3. 中心テーマと葛藤
4. 意識・無意識・過去・近未来
5. 自分、周囲、願望と不安、最終結果
6. 全体から見た具体的な行動
最後に一言のキーフレーズ。`,
      avoid: "10枚を長い箇条書きにしない。中心十字、時間軸、外部要因に分けて統合する。",
    };
  }

  if (spreadName === "二者択一") {
    return {
      title: "二者択一",
      purpose: `${compatibilityPrefix}AとBの2つの道を比べ、どちらが絶対に正しいかではなく、それぞれの得失と選ぶ基準を見る。`,
      positionRule:
        "現状カードで迷いの原因を押さえ、Aを選んだ場合とAの未来、Bを選んだ場合とBの未来をペアで読む。",
      synthesisRule:
        "結論では、AとBの良い点、注意点、向いている人の状態を比べる。最後に選ぶための判断軸を一つ提示する。",
      structure: `1. 二者択一の結論
2. 宿曜だけで見るあなたの基本特性
3. 現状と迷いの原因
4. Aを選んだ場合の流れ
5. Bを選んだ場合の流れ
6. 選ぶための判断軸
最後に一言のキーフレーズ。`,
      avoid: "AかBかを雑に断定しない。両方の未来を公平に比べる。",
    };
  }

  if (spreadName === "ホロスコープ") {
    return {
      title: "ホロスコープ",
      purpose: `${compatibilityPrefix}全体運と12ハウスを使い、自分、お金、学び、家庭、恋愛、健康、対人、深い縁、成長、仕事、仲間、心の奥を広く読む。`,
      positionRule:
        "13枚を孤立させず、全体運を基準にして、自己・生活・関係・社会・内面の5領域へまとめる。",
      synthesisRule:
        "結論では、1年または大きな周期のテーマとして、どの領域を先に整えると他の領域も良くなるかを示す。",
      structure: `1. ホロスコープ全体のテーマ
2. 宿曜だけで見るあなたの基本特性
3. 自分・お金・学び・家庭の流れ
4. 恋愛・健康・対人・深い縁の流れ
5. 成長・仕事・仲間・心の奥の流れ
6. 全体運から見た優先順位
最後に一言のキーフレーズ。`,
      avoid: "13枚すべてを同じ重さで細切れに説明しない。領域ごとにまとめて読む。",
    };
  }

  return {
    title: "ワンオラクル",
    purpose: "1枚のカードを今日の中心メッセージとして読み、気分、判断、行動のヒントに落とし込む。",
    positionRule:
      "カード1枚の正位置または逆位置を、今日の選択、注意点、開運アクションに結びつける。イエス/ノーは断定せず傾向として書く。",
    synthesisRule: "結論では、今日すぐできる小さな行動を一つ以上出す。",
    structure: `1. 今日の占い
2. 宿曜だけで見るあなたの基本特性
3. 今日の心の動きと運勢
4. 仕事・創作・お金まわり
5. 恋愛・人間関係
6. タロットが示す今日の選択
7. 今日の開運アクション
最後に一言のキーフレーズ。`,
    avoid: "カード名の一般的な意味だけで終わらせない。",
  };
}

function formatLunarDate(calendar: NonNullable<ReadingInput["calendar"]>) {
  return `旧暦${calendar.is_leap_month ? "閏" : ""}${calendar.lunar_month}月${calendar.lunar_day}日`;
}

function isUsableReading(reading: unknown): reading is string {
  if (typeof reading !== "string") return false;
  const length = [...reading].length;
  if (length < 1500 || length > 3200) return false;
  if (!reading.includes("宿曜") || !reading.includes("タロット")) return false;
  return !/(.)\1{5,}|([ぁ-ん]{2,4})\2{2,}/.test(reading);
}

function getJapanTodayLabel() {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());
}

function getOpenRouterKey() {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key || key === "your-openrouter-api-key") return "";
  return key;
}
