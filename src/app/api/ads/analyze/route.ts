import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { fetchMetaAds } from "@/lib/server/meta-ads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM = `Ты — опытный таргетолог (медиабайер) для онлайн-школы английского языка в Казахстане.
Анализируешь реальную статистику рекламных кампаний из Meta Ads (Facebook/Instagram).
Валюта — доллары США. Цель кампаний — заявки (лиды).

Дай практичные, конкретные рекомендации на РУССКОМ языке:
- что МАСШТАБИРОВАТЬ (низкий CPL, много лидов, хороший CTR) — с указанием на сколько поднять бюджет;
- что ОСТАНОВИТЬ или пересобрать (расход без лидов, очень высокий CPL, низкий CTR);
- что ПОЧИНИТЬ (где растёт CPL/падает CTR — обновить креатив/аудиторию/оффер);
- 3-5 идей ТЕКСТОВ объявлений под аудиторию (родители и взрослые, изучающие английский).

Будь конкретным: упоминай названия кампаний и цифры. Ориентир: хороший CPL ≤ $3, приемлемый ≤ $5, плохой > $5.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string", description: "Краткий вывод по кабинету: где деньги работают, где сливаются" },
    scale: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { campaign: { type: "string" }, reason: { type: "string" } },
        required: ["campaign", "reason"],
      },
    },
    pause: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { campaign: { type: "string" }, reason: { type: "string" } },
        required: ["campaign", "reason"],
      },
    },
    fix: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { campaign: { type: "string" }, reason: { type: "string" } },
        required: ["campaign", "reason"],
      },
    },
    creatives: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "scale", "pause", "fix", "creatives"],
};

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ mode: "mock", note: "ANTHROPIC_API_KEY не задан в окружении" });
  }

  let preset = "last_30d";
  try {
    const body = await req.json();
    if (typeof body?.preset === "string") preset = body.preset;
  } catch {
    /* default preset */
  }

  const ads = await fetchMetaAds(preset);
  if (ads.mode !== "live" || !ads.account) {
    return NextResponse.json({ mode: ads.mode, note: ads.note || ads.error || "Нет живых данных для анализа" });
  }

  const payload = {
    period: preset,
    account: ads.account,
    campaigns: ads.campaigns.map((c) => ({
      name: c.name,
      status: c.status,
      spend: c.spend,
      clicks: c.clicks,
      ctr: c.ctr,
      leads: c.leads,
      cpl: c.cpl,
    })),
  };

  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4000,
      system: SYSTEM,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [
        {
          role: "user",
          content: `Проанализируй статистику рекламного кабинета и дай рекомендации.\n\nДанные (JSON):\n${JSON.stringify(payload, null, 2)}`,
        },
      ],
    } as Anthropic.MessageCreateParamsNonStreaming);

    const text = message.content.find((b) => b.type === "text");
    const raw = text && "text" in text ? text.text : "{}";
    const analysis = JSON.parse(raw);
    return NextResponse.json({ mode: "live", preset, analysis });
  } catch (e) {
    return NextResponse.json({ mode: "error", error: String(e) }, { status: 200 });
  }
}
