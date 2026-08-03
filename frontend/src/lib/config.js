const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const rawSupabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "";
const rawApiUrl = import.meta.env.VITE_API_URL || "";

export const frontendConfig = {
  supabaseUrl: rawSupabaseUrl.trim(),
  supabaseKey: rawSupabaseKey.trim(),
  apiUrl: (rawApiUrl.trim() || "http://localhost:8000").replace(/\/+$/, ""),
};

export function missingFrontendEnv() {
  const missing = [];
  if (!frontendConfig.supabaseUrl) missing.push("VITE_SUPABASE_URL");
  if (!frontendConfig.supabaseKey) missing.push("VITE_SUPABASE_ANON_KEY");
  if (!frontendConfig.apiUrl) missing.push("VITE_API_URL");
  return missing;
}

export function hasAuthConfig() {
  return missingFrontendEnv().length === 0;
}
