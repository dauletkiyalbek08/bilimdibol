-- =============================================================
-- bilimdibol — RESET demo data (clears all app tables)
-- Run this BEFORE re-running seed.sql when you need to reseed
-- (e.g. after switching employee ids to fixed UUIDs).
-- Does NOT touch Supabase Auth users (those stay).
-- =============================================================
truncate table
  deal_activities,
  call_analysis,
  calls,
  messages,
  bot_edges,
  bot_nodes,
  bot_flows,
  integration_events,
  creative_analytics,
  marketing_attribution,
  smm_content_plan,
  deals,
  leads,
  clients,
  sales,
  trials,
  attendance,
  contracts,
  funnels,
  ad_campaigns,
  ad_spend,
  finance_operations,
  payroll,
  users
restart identity cascade;
