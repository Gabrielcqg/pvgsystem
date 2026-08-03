const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const rawSupabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "";
const rawApiUrl = import.meta.env.VITE_API_URL || "";
const prodSupabaseRef = import.meta.env.DEV ? "rforddrnuwtaefxojfte" : "";

export const frontendConfig = {
  supabaseUrl: rawSupabaseUrl.trim(),
  supabaseKey: rawSupabaseKey.trim(),
  apiUrl: rawApiUrl.trim().replace(/\/+$/, ""),
};

export function missingFrontendEnv() {
  const missing = [];
  if (!frontendConfig.supabaseUrl) missing.push("VITE_SUPABASE_URL");
  if (!frontendConfig.supabaseKey) missing.push("VITE_SUPABASE_ANON_KEY");
  if (!frontendConfig.apiUrl) missing.push("VITE_API_URL");
  if (import.meta.env.DEV && frontendConfig.supabaseUrl.includes(prodSupabaseRef)) {
    missing.push("VITE_SUPABASE_URL aponta para PROD, mas o frontend esta em desenvolvimento.");
  }
  if (import.meta.env.PROD && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(frontendConfig.apiUrl)) {
    missing.push("VITE_API_URL aponta para localhost em build de producao.");
  }
  return missing;
}

export function hasAuthConfig() {
  return missingFrontendEnv().length === 0;
}
