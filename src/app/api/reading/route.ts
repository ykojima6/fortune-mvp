import { NextResponse } from "next/server";
import { generateLocalReading, generateReading } from "@/lib/openrouter";
import { resolveShuku, type LunarCalendarDay } from "@/lib/shukuyo";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { drawTarot, majorArcana } from "@/lib/tarot";
import { LIMITS, withinLimit } from "@/lib/input-limits";

// 一度に扱うタロットの枚数の上限（長さの検査と読み取りで同じ値を使う）
const MAX_TAROT_DRAWS = 13;

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name || "").trim();
  const birthDate = String(body.birthDate || "").trim();
  const gender = parseGender(body.gender);
  const partner = parsePartner(body.partner);
  const userId = await getAuthenticatedUserId(request);

  if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return NextResponse.json({ error: "name and birthDate are required" }, { status: 400 });
  }
  if (!withinTextLimits(body, name)) {
    return NextResponse.json({ error: "入力が長すぎます。" }, { status: 413 });
  }
  if (partner && !userId) {
    return NextResponse.json({ error: "相性占いはログインが必要です。" }, { status: 401 });
  }

  const calendar = await loadCalendarDay(birthDate);
  const partnerCalendar = partner ? await loadCalendarDay(partner.birthDate) : null;

  const shuku = resolveShuku(birthDate, calendar);
  const partnerShuku = partner ? resolveShuku(partner.birthDate, partnerCalendar) : null;
  const tarotless = Boolean(partner);
  const selectedCardId = Number(body.tarotCardId);
  const hasSelectedCard = Number.isInteger(selectedCardId) && selectedCardId >= 0 && selectedCardId < majorArcana.length;
  const drawn = drawTarot(`${birthDate}:${name}:${new Date().toISOString()}:${Math.random()}`);
  const card = hasSelectedCard ? majorArcana[selectedCardId] : drawn.card;
  const reversed = hasSelectedCard ? Boolean(body.tarotReversed) : drawn.reversed;
  const tarotDraws = tarotless ? [] : parseTarotDraws(body.tarotDraws, card.id, reversed);
  if (!tarotless && tarotDraws.length > 1) {
    if (!userId) {
      return NextResponse.json({ error: "複数枚のスプレッドはログインが必要です。" }, { status: 401 });
    }
  }
  const readingInput = {
    profileName: name,
    profileGender: gender,
    birthDate,
    shuku,
    calendar,
    tarot: card,
    reversed,
    tarotless,
    spreadName: String(body.spreadName || "ワンオラクル").trim(),
    tarotDraws,
    partner: partner && partnerShuku ? { ...partner, shuku: partnerShuku, calendar: partnerCalendar } : null,
  };
  const reading = await withTimeout(generateReading(readingInput), 33000, generateLocalReading(readingInput));

  return NextResponse.json({ id: null, shuku, tarot: card, reversed, tarotless, calendar, reading });
}

// LLM に渡る自由入力の長さを確かめる（通常の利用では引っかからない上限）
function withinTextLimits(body: Record<string, unknown>, name: string) {
  if (!withinLimit(name, LIMITS.name)) return false;
  if (!withinLimit(String(body.spreadName || ""), LIMITS.spreadName)) return false;
  const partner = body.partner as Record<string, unknown> | null | undefined;
  if (partner && typeof partner === "object" && !withinLimit(String(partner.name || ""), LIMITS.name)) return false;
  if (Array.isArray(body.tarotDraws)) {
    for (const item of body.tarotDraws.slice(0, MAX_TAROT_DRAWS)) {
      if (item && typeof item === "object" && !withinLimit(String((item as Record<string, unknown>).position || ""), LIMITS.position)) {
        return false;
      }
    }
  }
  return true;
}

function parseGender(value: unknown): "male" | "female" | "other" | null {
  return value === "male" || value === "female" || value === "other" ? value : null;
}

async function loadCalendarDay(date: string) {
  if (!supabase) return null;
  const { data } = await withTimeout(
    Promise.resolve(
      supabase
        .from("calendar_days")
        .select("solar_date,lunar_month,lunar_day,is_leap_month,moon_phase,rokuyo,sexagenary")
        .eq("solar_date", date)
        .maybeSingle(),
    ),
    5000,
    { data: null } as never,
  );
  return data as LunarCalendarDay | null;
}

function parsePartner(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const birthDate = String(record.birthDate || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  return {
    name: String(record.name || "相手").trim() || "相手",
    birthDate,
  };
}

function parseTarotDraws(value: unknown, fallbackCardId: number, fallbackReversed: boolean) {
  if (!Array.isArray(value)) {
    return [{ position: "今日のメッセージ", tarot: majorArcana[fallbackCardId], reversed: fallbackReversed }];
  }

  const parsed = value
    .slice(0, MAX_TAROT_DRAWS)
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const cardId = Number(record.cardId);
      if (!Number.isInteger(cardId) || cardId < 0 || cardId >= majorArcana.length) return null;
      return {
        position: String(record.position || `${index + 1}枚目`).trim(),
        tarot: majorArcana[cardId],
        reversed: Boolean(record.reversed),
      };
    })
    .filter((item) => item !== null);

  return parsed.length > 0
    ? parsed
    : [{ position: "今日のメッセージ", tarot: majorArcana[fallbackCardId], reversed: fallbackReversed }];
}

async function getAuthenticatedUserId(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token || !supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), timeoutMs);
    }),
  ]);
}
