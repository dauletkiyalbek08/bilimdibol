// Настройки приложения (геозона офиса) — из Supabase, иначе дефолт из geo.ts.
import { getSupabase } from "../supabase/client";
import { OFFICE } from "../geo";

export interface OfficeSettings {
  lat: number;
  lng: number;
  radiusM: number;
}

const PID = "english-course";
const fallback: OfficeSettings = { lat: OFFICE.lat, lng: OFFICE.lng, radiusM: OFFICE.radiusM };

export async function fetchOfficeSettings(): Promise<OfficeSettings> {
  const sb = getSupabase();
  if (!sb) return fallback;
  try {
    const { data, error } = await sb
      .from("app_settings")
      .select("office_lat, office_lng, office_radius_m")
      .eq("project_id", PID)
      .single();
    if (error || !data) return fallback;
    return {
      lat: data.office_lat ?? fallback.lat,
      lng: data.office_lng ?? fallback.lng,
      radiusM: data.office_radius_m ?? fallback.radiusM,
    };
  } catch {
    return fallback;
  }
}

/** Сохранить геозону офиса (только админ — проверяется RLS). */
export async function saveOfficeSettings(s: OfficeSettings): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from("app_settings").upsert({
      project_id: PID,
      office_lat: s.lat,
      office_lng: s.lng,
      office_radius_m: Math.round(s.radiusM),
      updated_at: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}
