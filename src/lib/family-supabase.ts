import { createClient } from "@supabase/supabase-js";
import { familyConfiguration } from "@/game/family-config";
export const familyConfig = familyConfiguration(
  import.meta.env["VITE_SUPABASE_URL"] ?? "",
  import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? "",
);
export const familyClient =
  familyConfig.mode === "supabase"
    ? createClient(familyConfig.url, familyConfig.key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
        realtime: { params: { eventsPerSecond: 5 } },
      })
    : null;
