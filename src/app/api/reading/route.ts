import { NextResponse } from "next/server";
import { generateLocalReading, generateReading } from "@/lib/openrouter";
import { resolveShuku, type LunarCalendarDay } from "@/lib/shukuyo";
import { supabase } from "@/lib/supabase";
import { drawTarot, majorArcana } from "@/lib/tarot";

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name || "").trim();
  const birthDate = String(body.birthDate || "").trim();

  if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return NextResponse.json({ error: "name and birthDate are required" }, { status: 400 });
  }

  let calendar: LunarCalendarDay | null = null;
  if (supabase) {
    const { data } = await withTimeout(
      Promise.resolve(
        supabase
          .from("calendar_days")
          .select("solar_date,lunar_month,lunar_day,is_leap_month,moon_phase,rokuyo,sexagenary")
          .eq("solar_date", birthDate)
          .maybeSingle(),
      ),
      5000,
      { data: null } as never,
    );
    calendar = data;
  }

  const shuku = resolveShuku(birthDate, calendar);
  const selectedCardId = Number(body.tarotCardId);
  const hasSelectedCard = Number.isInteger(selectedCardId) && selectedCardId >= 0 && selectedCardId < majorArcana.length;
  const drawn = drawTarot(`${birthDate}:${name}:${new Date().toISOString()}:${Math.random()}`);
  const card = hasSelectedCard ? majorArcana[selectedCardId] : drawn.card;
  const reversed = hasSelectedCard ? Boolean(body.tarotReversed) : drawn.reversed;
  const readingInput = {
    profileName: name,
    birthDate,
    shuku,
    calendar,
    tarot: card,
    reversed,
  };
  const reading = await withTimeout(generateReading(readingInput), 33000, generateLocalReading(readingInput));

  return NextResponse.json({ id: null, shuku, tarot: card, reversed, calendar, reading });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), timeoutMs);
    }),
  ]);
}
