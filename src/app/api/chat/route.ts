import { NextResponse } from "next/server";
import { answerQuestion } from "@/lib/openrouter";
import { LIMITS, withinLimit } from "@/lib/input-limits";

export async function POST(request: Request) {
  const body = await request.json();
  const context = String(body.context || "").trim();
  const question = String(body.question || "").trim();

  if (!context || !question) {
    return NextResponse.json({ error: "context and question are required" }, { status: 400 });
  }
  if (!withinLimit(context, LIMITS.chatContext) || !withinLimit(question, LIMITS.chatQuestion)) {
    return NextResponse.json({ error: "質問または結果文が長すぎます。" }, { status: 413 });
  }

  const answer = await answerQuestion(context, question);
  return NextResponse.json({ answer });
}
