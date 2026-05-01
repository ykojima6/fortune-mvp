import { NextResponse } from "next/server";
import { generateLocalReading, generateReading } from "@/lib/openrouter";
import { resolveShuku, type LunarCalendarDay } from "@/lib/shukuyo";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { drawTarot, majorArcana } from "@/lib/tarot";

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name || "").trim();
  const birthDate = String(body.birthDate || "").trim();
  const partner = parsePartner(body.partner);
  const userId = await getAuthenticatedUserId(request);

  if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return NextResponse.json({ error: "name and birthDate are required" }, { status: 400 });
  }
  if (partner && !userId) {
    return NextResponse.json({ error: "相性占いはログインが必要です。" }, { status: 401 });
  }

  const calendar = await loadCalendarDay(birthDate);
  const partnerCalendar = partner ? await loadCalendarDay(partner.birthDate) : null;

  const shuku = resolveShuku(birthDate, calendar);
  const partnerShuku = partner ? resolveShuku(partner.birthDate, partnerCalendar) : null;
  const selectedCardId = Number(body.tarotCardId);
  const hasSelectedCard = Number.isInteger(selectedCardId) && selectedCardId >= 0 && selectedCardId < majorArcana.length;
  const drawn = drawTarot(`${birthDate}:${name}:${new Date().toISOString()}:${Math.random()}`);
  const card = hasSelectedCard ? majorArcana[selectedCardId] : drawn.card;
  const reversed = hasSelectedCard ? Boolean(body.tarotReversed) : drawn.reversed;
  const tarotDraws = parseTarotDraws(body.tarotDraws, card.id, reversed);
  if (tarotDraws.length > 1) {
    if (!userId) {
      return NextResponse.json({ error: "複数枚のスプレッドはログインが必要です。" }, { status: 401 });
    }
  }
  const readingInput = {
    profileName: name,
    birthDate,
    shuku,
    calendar,
    tarot: card,
    reversed,
    spreadName: String(body.spreadName || "ワンオラクル").trim(),
    tarotDraws,
    partner: partner && partnerShuku ? { ...partner, shuku: partnerShuku, calendar: partnerCalendar } : null,
  };
  const reading = await withTimeout(generateReading(readingInput), 33000, generateLocalReading(readingInput));

  return NextResponse.json({ id: null, shuku, tarot: card, reversed, calendar, reading });
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
    .slice(0, 13)
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
