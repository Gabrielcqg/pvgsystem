const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const rawSupabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const rawApiUrl = import.meta.env.VITE_API_URL || "";
const prodSupabaseRef = "rforddrnuwtaefxojfte";
const devSupabaseRef = "ddhdwgcjpqgvybmqbjmv";

function supabaseRefFromUrl(value) {
  const match = String(value || "").match(/^https:\/\/([a-z0-9]{20})\.supabase\.co/i);
  return match?.[1] || "";
}

function supabaseRefFromJwt(value) {
  const token = String(value || "");
  const parts = token.split(".");
  if (parts.length < 2 || !token.startsWith("eyJ")) return "";
  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");
    const decoded = JSON.parse(atob(padded));
    if (decoded?.ref) return String(decoded.ref);
    const issuer = String(decoded?.iss || "");
    return supabaseRefFromUrl(issuer.replace("/auth/v1", ""));
  } catch {
    return "";
  }
}

function selectSupabaseKey(url, anonKey, publishableKey) {
  const cleanAnonKey = String(anonKey || "").trim();
  const cleanPublishableKey = String(publishableKey || "").trim();
  const urlRef = supabaseRefFromUrl(url);
  const anonRef = supabaseRefFromJwt(cleanAnonKey);
  if (cleanAnonKey && urlRef && anonRef === urlRef) return cleanAnonKey;
  return cleanPublishableKey || cleanAnonKey;
}

const rawSupabaseKey = selectSupabaseKey(rawSupabaseUrl, rawSupabaseAnonKey, rawSupabasePublishableKey);
const supabaseUrlRef = supabaseRefFromUrl(rawSupabaseUrl);
const supabaseKeyRef = supabaseRefFromJwt(rawSupabaseKey);

export const frontendConfig = {
  supabaseUrl: rawSupabaseUrl.trim(),
  supabaseKey: rawSupabaseKey.trim(),
  apiUrl: rawApiUrl.trim().replace(/\/+$/, ""),
};

export function missingFrontendEnv() {
  const missing = [];
  if (!frontendConfig.supabaseUrl) missing.push("VITE_SUPABASE_URL");
  if (!frontendConfig.supabaseKey) missing.push("VITE_SUPABASE_ANON_KEY ou VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!frontendConfig.apiUrl) missing.push("VITE_API_URL");
  if (import.meta.env.DEV && frontendConfig.supabaseUrl.includes(prodSupabaseRef)) {
    missing.push("VITE_SUPABASE_URL aponta para PROD, mas o frontend esta em desenvolvimento.");
  }
  if (import.meta.env.PROD && frontendConfig.supabaseUrl.includes(devSupabaseRef)) {
    missing.push("VITE_SUPABASE_URL aponta para DEV, mas o frontend esta em producao.");
  }
  if (supabaseUrlRef && supabaseKeyRef && supabaseUrlRef !== supabaseKeyRef) {
    missing.push("A chave publica do Supabase nao pertence ao mesmo projeto de VITE_SUPABASE_URL.");
  }
  if (import.meta.env.PROD && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(frontendConfig.apiUrl)) {
    missing.push("VITE_API_URL aponta para localhost em build de producao.");
  }
  return missing;
}

export function hasAuthConfig() {
  return missingFrontendEnv().length === 0;
}
