import { NextResponse } from "next/server";
import { simulateBotRun } from "@/lib/mock/chatbot";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { flowId?: string; message?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.flowId) {
    return NextResponse.json({ error: "Field 'flowId' is required" }, { status: 400 });
  }

  const conversation = simulateBotRun(body.flowId, body.message ?? "");
  return NextResponse.json({ mode: "mock", flowId: body.flowId, conversation });
}
