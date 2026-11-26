// 外から来る文字列の長さ上限。通常の利用では届かない長さだけを断る。
export const LIMITS = {
  // 結果文は、LLM の文が最大 3,200 字（isUsableReading）、手元で作る文も 3,300 字未満。余裕を見て倍以上にする。
  chatContext: 8000,
  chatQuestion: 2000,
  name: 100,
  spreadName: 100,
  position: 100,
} as const;

/** 文字数（サロゲートペアを1字と数える）が上限以内か */
export function withinLimit(value: string, max: number) {
  // UTF-16 の長さは文字数以上で、文字数の2倍以下。数えずに決まる場合は先に返す。
  if (value.length <= max) return true;
  if (value.length > max * 2) return false;
  return [...value].length <= max;
}
