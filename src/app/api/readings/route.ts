import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { majorArcana } from "@/lib/tarot";

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase service role is not configured." }, { status: 500 });
  }

  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const body = await request.json();
  const shukuName = String(body.shukuName || "").trim();
  const shukuIndex = Number(body.shukuIndex);
  const tarotCardId = Number(body.tarotCardId);
  const tarotReversed = Boolean(body.tarotReversed);
  const calendarDate = String(body.calendarDate || "").trim();
  const resultText = String(body.resultText || "").trim();

  if (
    !shukuName ||
    !Number.isInteger(shukuIndex) ||
    !Number.isInteger(tarotCardId) ||
    tarotCardId < 0 ||
    tarotCardId >= majorArcana.length ||
    !/^\d{4}-\d{2}-\d{2}$/.test(calendarDate) ||
    !resultText
  ) {
    return NextResponse.json({ error: "保存する占い結果が不正です。" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("readings")
    .insert({
      user_id: userId,
      shuku_name: shukuName,
      shuku_index: shukuIndex,
      tarot_card_id: tarotCardId,
      tarot_reversed: tarotReversed,
      calendar_date: calendarDate,
      result_text: resultText,
    })
    .select("id,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "履歴の保存に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase service role is not configured." }, { status: 500 });
  }

  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const body = await request.json();
  const id = String(body.id || "").trim();
  if (!id) {
    return NextResponse.json({ error: "削除する履歴IDが必要です。" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("readings").delete().eq("id", id).eq("user_id", userId);
  if (error) {
    return NextResponse.json({ error: "履歴の削除に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function getAuthenticatedUserId(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token || !supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}
