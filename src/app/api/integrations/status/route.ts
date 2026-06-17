import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Reports which integrations are configured via env (without exposing secrets). */
export async function GET() {
  const has = (k: string) => Boolean(process.env[k]);

  const integrations = [
    { id: "instagram", connected: has("IG_BUSINESS_ACCOUNT_ID") && has("META_PAGE_ACCESS_TOKEN") },
    { id: "messenger", connected: has("FACEBOOK_PAGE_ID") && has("META_PAGE_ACCESS_TOKEN") },
    {
      id: "whatsapp",
      connected: has("WHATSAPP_ACCESS_TOKEN") && has("WHATSAPP_PHONE_NUMBER_ID"),
    },
    { id: "meta-capi", connected: has("META_APP_ID") && has("META_APP_SECRET") },
    { id: "deepseek", connected: has("DEEPSEEK_API_KEY") },
    {
      id: "supabase",
      connected: has("NEXT_PUBLIC_SUPABASE_URL") && has("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    },
    { id: "vercel", connected: has("NEXT_PUBLIC_APP_URL") },
  ];

  return NextResponse.json({
    mode: integrations.some((i) => i.connected) ? "partial" : "mock",
    verifyToken: process.env.META_VERIFY_TOKEN || "bilimdibol-demo-verify-token",
    integrations,
  });
}
