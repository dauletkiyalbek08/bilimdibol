// Чтение статистики Meta Ads (Marketing API). Используется и эндпоинтом
// /api/ads/meta (вывод данных), и /api/ads/analyze (ИИ-таргетолог).
const GRAPH = "https://graph.facebook.com/v21.0";

export const AD_PRESETS = new Set([
  "today",
  "yesterday",
  "last_7d",
  "last_14d",
  "last_30d",
  "last_90d",
  "this_month",
  "last_month",
]);

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  leads: number;
  cpl: number | null;
}

export interface MetaAdsData {
  mode: "live" | "mock" | "error";
  preset?: string;
  note?: string;
  error?: string;
  account: {
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    cpm: number;
    reach: number;
    leads: number;
    cpl: number | null;
  } | null;
  campaigns: MetaCampaign[];
}

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

// Лиды дублируются под разными action_type — берём один канонический показатель.
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
  const vals = actions.filter((a) => LEAD_TYPES.includes(a.action_type)).map((a) => parseFloat(a.value) || 0);
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

export async function fetchMetaAds(presetInput: string): Promise<MetaAdsData> {
  const token = process.env.META_ADS_TOKEN;
  const account = process.env.META_AD_ACCOUNT_ID;
  const preset = AD_PRESETS.has(presetInput) ? presetInput : "last_30d";

  if (!token || !account) {
    return { mode: "mock", note: "META_ADS_TOKEN / META_AD_ACCOUNT_ID не заданы", account: null, campaigns: [] };
  }

  try {
    const acc = account.startsWith("act_") ? account : `act_${account}`;

    const accJson = await gget(
      `${GRAPH}/${acc}/insights?fields=spend,impressions,clicks,ctr,cpc,cpm,reach,actions&date_preset=${preset}&access_token=${token}`,
    );
    const a: InsightRow = accJson.data?.[0] ?? {};
    const accLeads = leadsFrom(a.actions);
    const accSpend = num(a.spend);

    const campJson = await gget(
      `${GRAPH}/${acc}/campaigns?fields=id,name,status,objective&limit=200&access_token=${token}`,
    );
    const statusMap = new Map<string, { status: string; objective: string }>();
    for (const c of campJson.data ?? []) statusMap.set(c.id, { status: c.status, objective: c.objective });

    const insJson = await gget(
      `${GRAPH}/${acc}/insights?level=campaign&fields=campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,actions&date_preset=${preset}&limit=200&access_token=${token}`,
    );
    const campaigns: MetaCampaign[] = ((insJson.data as InsightRow[]) ?? []).map((r) => {
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

    return {
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
    };
  } catch (e) {
    return { mode: "error", error: String(e), account: null, campaigns: [] };
  }
}
