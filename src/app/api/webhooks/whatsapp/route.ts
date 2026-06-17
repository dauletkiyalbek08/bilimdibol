import { NextResponse } from "next/server";

export const runtime = "nodejs";

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "bilimdibol-demo-verify-token";

// WhatsApp Cloud API also uses Meta-style GET verification.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(req: Request) {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const live = Boolean(process.env.WHATSAPP_ACCESS_TOKEN);
  return NextResponse.json({
    received: true,
    mode: live ? "live" : "mock",
    note: live
      ? "WhatsApp event accepted"
      : "Demo mode — no WhatsApp token configured, message not processed",
    hasPayload: body !== null,
  });
}
