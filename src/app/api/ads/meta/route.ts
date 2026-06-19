import { NextResponse } from "next/server";
import { fetchMetaAds } from "@/lib/server/meta-ads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const data = await fetchMetaAds(searchParams.get("preset") || "last_30d");
  return NextResponse.json(data);
}
