import { NextResponse } from "next/server";

export const runtime = "nodejs";

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "bilimdibol-demo-verify-token";

// Meta webhook verification (GET) — used by Meta to validate the endpoint.
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

// Incoming events (POST). In demo mode we just acknowledge and log shape.
export async function POST(req: Request) {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const live = Boolean(process.env.META_PAGE_ACCESS_TOKEN);
  // In a real integration we would parse entry[].messaging[] / changes[] here
  // and route messages into the CRM. For the demo we only acknowledge.
  return NextResponse.json({
    received: true,
    mode: live ? "live" : "mock",
    note: live ? "Event accepted" : "Demo mode — no Meta token configured, event not processed",
    hasPayload: body !== null,
  });
}
