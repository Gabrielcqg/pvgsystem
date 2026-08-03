import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 0) continue;
    const key = trimmed.slice(0, separator).trim();
    if (!key || process.env[key]) continue;
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function sanitizeUrl(url) {
  const parsed = new URL(url);
  if (parsed.pathname.endsWith("/auth/v1/token")) parsed.search = "";
  return parsed.toString();
}

loadEnv(path.resolve("..", ".env"));
loadEnv(path.resolve(".env"));

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !adminKey) throw new Error("Supabase admin config ausente");

const frontendUrl = (process.env.AUTH_DIAG_FRONTEND_URL || "http://127.0.0.1:5173").replace(/\/+$/, "");
const admin = createClient(supabaseUrl, adminKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = `codex-outsider-${Date.now()}-${crypto.randomUUID()}@example.com`;
const password = `Codex-${crypto.randomBytes(24).toString("base64url")}1!`;
const events = [];
let createdUserId = null;

try {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  createdUserId = data.user?.id || null;
  if (!createdUserId) throw new Error("Usuario temporario nao foi criado");

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    page.on("response", (response) => {
      const url = response.url();
      const pathName = new URL(url).pathname;
      if (url.includes("/auth/v1/token") || pathName === "/me" || pathName === "/api/me") {
        events.push({ method: response.request().method(), url: sanitizeUrl(url), status: response.status() });
      }
    });
    page.on("requestfailed", (request) => {
      const url = request.url();
      const pathName = new URL(url).pathname;
      if (url.includes("/auth/v1/token") || pathName === "/me" || pathName === "/api/me") {
        events.push({ method: request.method(), url: sanitizeUrl(url), failed: request.failure()?.errorText || "request failed" });
      }
    });

    await page.goto(`${frontendUrl}/login`, { waitUntil: "domcontentloaded" });
    await page.getByLabel(/e-?mail/i).fill(email);
    await page.getByLabel(/^senha$/i).fill(password);
    await page.getByRole("button", { name: /^entrar$/i }).click();
    await page.getByRole("heading", { name: "Sem acesso" }).waitFor({ timeout: 15_000 });

    console.log(JSON.stringify({ blocked: true, finalUrl: page.url(), h1: "Sem acesso", events }, null, 2));
  } finally {
    await browser.close();
  }
} finally {
  if (createdUserId) {
    await admin.auth.admin.deleteUser(createdUserId);
  }
}
