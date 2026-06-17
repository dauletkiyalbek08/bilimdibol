// NOTE: server-only module. Import exclusively from API routes / server code.
// Uses the service-role key — must never reach the browser bundle.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/** True when service-role access is available (server-side only). */
export const isAdminConfigured = Boolean(url && serviceKey);

let cached: SupabaseClient | null = null;

/**
 * Server-side admin client (service role). NEVER import this in client code.
 * Returns null when not configured.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isAdminConfigured) return null;
  if (!cached) {
    cached = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
