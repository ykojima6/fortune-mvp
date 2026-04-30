import { NextResponse } from "next/server";
import { answerQuestion } from "@/lib/openrouter";

export async function POST(request: Request) {
  const body = await request.json();
  const context = String(body.context || "").trim();
  const question = String(body.question || "").trim();

  if (!context || !question) {
    return NextResponse.json({ error: "context and question are required" }, { status: 400 });
  }

  const answer = await answerQuestion(context, question);
  return NextResponse.json({ answer });
}
