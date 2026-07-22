import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabaseProjectRef = supabaseUrl?.match(/^https:\/\/([^.]+)\.supabase\.co\/?$/)?.[1];
const storageKey = supabaseProjectRef ? `sb-${supabaseProjectRef}-auth-token` : "taskflow-auth-token";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseConnectionLabel = supabaseUrl ?? "Supabase";

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: true,
        storageKey,
      },
      realtime: {
        params: {
          eventsPerSecond: 12,
        },
      },
    })
  : null;

export async function checkSupabaseReachable(timeoutMs = 4000) {
  if (!supabaseUrl) return false;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/health`, {
      cache: "no-store",
      mode: "no-cors",
      signal: controller.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function clearSupabaseSessionCache() {
  if (typeof window === "undefined") return;
  const keys = new Set([storageKey]);
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith("sb-") && key.endsWith("-auth-token")) keys.add(key);
  }
  for (const key of keys) {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  }
}
