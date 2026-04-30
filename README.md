# 宿曜タロット MVP

Supabase Auth、暦データベース、宿曜算出、タロット大アルカナ1枚引き、OpenRouter LLM生成、結果チャットをまとめた Next.js MVP です。

## セットアップ

```bash
npm install
cp .env.example .env.local
```

`.env.local` に Supabase と OpenRouter の値を設定してください。

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=openrouter/free
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

OpenRouter の無料モデル名は変わることがあるため、MVPでは無料モデルを自動選択する `openrouter/free` を既定にしています。APIキー未設定でも、ローカルの定型文フォールバックで占い結果は表示されます。

## Supabase

Supabase SQL Editor で次を実行します。

1. `supabase/schema.sql`
2. `supabase/calendar_seed.sql`

暦シードは `scripts/generate-calendar-seed.py` で生成しています。`lunardate` による 1900-2099 年の旧暦変換を使い、閏月も `is_leap_month` として保存します。

```bash
python3 -m pip install --user lunardate==0.2.2
python3 scripts/generate-calendar-seed.py
```

## 開発

```bash
npm run dev
```

## 生成済みアセット

オリジナル大アルカナSVG 22枚は `public/tarot/` にあります。再生成する場合:

```bash
npm run generate:tarot
```

GPT Image APIでPNGを生成して上書きする場合:

```bash
OPENAI_API_KEY=... OPENAI_IMAGE_MODEL=gpt-image-1.5 npm run generate:tarot:gpt
```

## 検証

```bash
npm run lint
npm run build
```
