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

function safeEvent(response) {
  const url = new URL(response.url());
  return {
    method: response.request().method(),
    url: `${url.origin}${url.pathname}`,
    status: response.status(),
  };
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

const email = `codex-reset-${Date.now()}-${crypto.randomUUID()}@example.com`;
const initialPassword = `Codex-${crypto.randomBytes(24).toString("base64url")}1!`;
const updatedPassword = `Codex-${crypto.randomBytes(24).toString("base64url")}2!`;
const events = [];
let createdUserId = null;

try {
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: initialPassword,
    email_confirm: true,
  });
  if (createError) throw createError;
  createdUserId = created.user?.id || null;
  if (!createdUserId) throw new Error("Usuario temporario nao foi criado");

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${frontendUrl}/definir-nova-senha` },
  });
  if (linkError) throw linkError;
  const actionLink = linkData?.properties?.action_link;
  if (!actionLink) throw new Error("Link de recovery nao foi gerado");

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    page.on("response", (response) => {
      const url = response.url();
      const pathname = new URL(url).pathname;
      if (url.includes("/auth/v1/verify") || url.includes("/auth/v1/token") || pathname === "/auth/v1/user" || pathname === "/me") {
        events.push(safeEvent(response));
      }
    });

    try {
      await page.goto(actionLink, { waitUntil: "domcontentloaded", timeout: 20_000 });
      await page.waitForURL((url) => url.pathname === "/definir-nova-senha", { timeout: 20_000 });
    } catch {
      throw new Error("Recovery redirect nao chegou em /definir-nova-senha");
    }

    await page.getByRole("textbox", { name: "Nova senha" }).fill(updatedPassword);
    await page.getByRole("textbox", { name: "Confirmar senha" }).fill(updatedPassword);
    await page.getByRole("button", { name: "Salvar senha" }).click();
    await page.getByRole("heading", { name: "Bom te ver de volta" }).waitFor({ timeout: 15_000 });
    await page.getByRole("status").filter({ hasText: "Senha atualizada" }).waitFor({ timeout: 15_000 });

    await page.getByLabel(/e-?mail/i).fill(email);
    await page.getByLabel(/^senha$/i).fill(updatedPassword);
    await page.getByRole("button", { name: /^entrar$/i }).click();
    await page.getByRole("heading", { name: "Sem acesso" }).waitFor({ timeout: 15_000 });

    console.log(JSON.stringify({ redirect: true, passwordUpdated: true, newLoginBlockedByAppMembers: true, events }, null, 2));
  } finally {
    await browser.close();
  }
} finally {
  if (createdUserId) {
    await admin.auth.admin.deleteUser(createdUserId);
  }
}
