import { NextResponse } from "next/server";
import { ingestLead } from "@/lib/server/lead-intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public lead intake — наша форма-лендинг, квиз, Tilda-вебхук, внешние формы.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

function pick(obj: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    const found = Object.keys(obj).find((x) => x.toLowerCase() === k.toLowerCase());
    if (found && obj[found]?.trim()) return obj[found].trim();
  }
  return "";
}

export async function POST(req: Request) {
  let payload: Record<string, string> = {};
  try {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      payload = await req.json();
    } else {
      const fd = await req.formData();
      fd.forEach((v, k) => {
        payload[k] = String(v);
      });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400, headers: cors });
  }

  const result = await ingestLead({
    name: pick(payload, ["name", "Name", "fname", "имя", "client_name"]),
    phone: pick(payload, ["phone", "Phone", "tel", "телефон", "phone_number"]),
    email: pick(payload, ["email", "Email", "почта"]),
    comment: pick(payload, ["comment", "message", "Comment", "комментарий", "text"]),
    source: pick(payload, ["source", "utm_source", "Source"]) || "Landing Page",
    utmCampaign: pick(payload, ["utm_campaign", "campaign"]),
    creativeId: pick(payload, ["creative_id", "utm_content", "ad_id"]),
    instagram: pick(payload, ["instagram", "ig"]),
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400, headers: cors });
}
