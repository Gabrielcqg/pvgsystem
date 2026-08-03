import { createClient } from "@supabase/supabase-js";

import { frontendConfig, hasAuthConfig } from "./config";

export const supabase = hasAuthConfig()
  ? createClient(frontendConfig.supabaseUrl, frontendConfig.supabaseKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;
