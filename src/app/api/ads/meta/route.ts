import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GRAPH = "https://graph.facebook.com/v21.0";

// Какие date_preset поддерживаем (защита от произвольного ввода).
const PRESETS = new Set(["today", "yesterday", "last_7d", "last_14d", "last_30d", "last_90d", "this_month", "last_month"]);

interface InsightRow {
  campaign_id?: string;
  campaign_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  reach?: string;
  actions?: { action_type: string; value: string }[];
}

// Лиды дублируются под разными action_type — берём один канонический показатель,
// а не сумму (иначе будет кратное переполнение).
const LEAD_TYPES = [
  "lead",
  "onsite_conversion.lead_grouped",
  "offsite_conversion.fb_pixel_lead",
  "onsite_web_lead",
];
function leadsFrom(actions?: { action_type: string; value: string }[]): number {
  if (!actions) return 0;
  const exact = actions.find((a) => a.action_type === "lead");
  if (exact) return parseFloat(exact.value) || 0;
  const vals = actions
    .filter((a) => LEAD_TYPES.includes(a.action_type))
    .map((a) => parseFloat(a.value) || 0);
  return vals.length ? Math.max(...vals) : 0;
}

function num(v?: string): number {
  return v ? parseFloat(v) || 0 : 0;
}

async function gget(url: string) {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error?.message || `HTTP ${res.status}`);
  return json;
}

export async function GET(req: Request) {
  const token = process.env.META_ADS_TOKEN;
  const account = process.env.META_AD_ACCOUNT_ID; // формат act_XXXXXXXXX
  const { searchParams } = new URL(req.url);
  const preset = PRESETS.has(searchParams.get("preset") || "") ? searchParams.get("preset")! : "last_30d";

  if (!token || !account) {
    return NextResponse.json({ mode: "mock", note: "META_ADS_TOKEN / META_AD_ACCOUNT_ID не заданы", account: null, campaigns: [] });
  }

  try {
    const acc = account.startsWith("act_") ? account : `act_${account}`;

    // 1) Сводка по кабинету
    const accFields = "spend,impressions,clicks,ctr,cpc,cpm,reach,actions";
    const accJson = await gget(`${GRAPH}/${acc}/insights?fields=${accFields}&date_preset=${preset}&access_token=${token}`);
    const a: InsightRow = accJson.data?.[0] ?? {};
    const accLeads = leadsFrom(a.actions);
    const accSpend = num(a.spend);

    // 2) Статусы кампаний
    const campJson = await gget(`${GRAPH}/${acc}/campaigns?fields=id,name,status,objective&limit=200&access_token=${token}`);
    const statusMap = new Map<string, { status: string; objective: string }>();
    for (const c of campJson.data ?? []) statusMap.set(c.id, { status: c.status, objective: c.objective });

    // 3) Инсайты по кампаниям
    const campFields = "campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,actions";
    const insJson = await gget(
      `${GRAPH}/${acc}/insights?level=campaign&fields=${campFields}&date_preset=${preset}&limit=200&access_token=${token}`,
    );
    const campaigns = (insJson.data as InsightRow[] ?? []).map((r) => {
      const spend = num(r.spend);
      const leads = leadsFrom(r.actions);
      const meta = statusMap.get(r.campaign_id || "");
      return {
        id: r.campaign_id || "",
        name: r.campaign_name || "—",
        status: meta?.status ?? "UNKNOWN",
        objective: meta?.objective ?? "",
        spend,
        impressions: num(r.impressions),
        clicks: num(r.clicks),
        ctr: num(r.ctr),
        cpc: num(r.cpc),
        leads,
        cpl: leads > 0 ? +(spend / leads).toFixed(2) : null,
      };
    });
    campaigns.sort((x, y) => y.spend - x.spend);

    return NextResponse.json({
      mode: "live",
      preset,
      account: {
        spend: accSpend,
        impressions: num(a.impressions),
        clicks: num(a.clicks),
        ctr: num(a.ctr),
        cpc: num(a.cpc),
        cpm: num(a.cpm),
        reach: num(a.reach),
        leads: accLeads,
        cpl: accLeads > 0 ? +(accSpend / accLeads).toFixed(2) : null,
      },
      campaigns,
    });
  } catch (e) {
    return NextResponse.json({ mode: "error", error: String(e), account: null, campaigns: [] }, { status: 200 });
  }
}
