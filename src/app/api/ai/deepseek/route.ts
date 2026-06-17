import { NextResponse } from "next/server";
import { analyzeCallWithDeepSeek } from "@/lib/ai/deepseek";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { transcript?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const transcript = body.transcript;
  if (!transcript) {
    return NextResponse.json({ error: "Field 'transcript' is required" }, { status: 400 });
  }

  const mode = process.env.DEEPSEEK_API_KEY ? "live" : "mock";
  const analysis = await analyzeCallWithDeepSeek(
    transcript as Parameters<typeof analyzeCallWithDeepSeek>[0],
  );

  return NextResponse.json({ mode, model: process.env.DEEPSEEK_MODEL || "deepseek-v4-pro", analysis });
}
