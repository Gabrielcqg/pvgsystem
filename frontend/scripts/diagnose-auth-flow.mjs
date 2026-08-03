import fs from "node:fs";
import path from "node:path";

import { chromium } from "@playwright/test";

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
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

function shouldCapture(url) {
  try {
    const parsed = new URL(url);
    return (
      parsed.pathname.endsWith("/auth/v1/token") ||
      parsed.pathname === "/me" ||
      parsed.pathname === "/api/me" ||
      parsed.port === "8000" ||
      parsed.port === "8010"
    );
  } catch {
    return false;
  }
}

function sanitizeUrl(url) {
  const parsed = new URL(url);
  if (parsed.pathname.endsWith("/auth/v1/token")) parsed.search = "";
  return parsed.toString();
}

loadEnv(path.resolve("..", ".env"));
loadEnv(path.resolve(".env"));

const email = process.env.SUPABASE_TEST_EMAIL;
const password = process.env.SUPABASE_TEST_PASSWORD;
if (!email || !password) {
  throw new Error("SUPABASE_TEST_EMAIL/SUPABASE_TEST_PASSWORD ausentes");
}

const frontendUrl = (process.env.AUTH_DIAG_FRONTEND_URL || "http://127.0.0.1:5173").replace(/\/+$/, "");
const events = [];

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  page.on("response", (response) => {
    if (!shouldCapture(response.url())) return;
    events.push({
      method: response.request().method(),
      url: sanitizeUrl(response.url()),
      status: response.status(),
    });
  });
  page.on("requestfailed", (request) => {
    if (!shouldCapture(request.url())) return;
    events.push({
      method: request.method(),
      url: sanitizeUrl(request.url()),
      failed: request.failure()?.errorText || "request failed",
    });
  });

  await page.goto(`${frontendUrl}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel(/e-?mail/i).fill(email);
  await page.getByLabel(/^senha$/i).fill(password);
  await page.getByRole("button", { name: /^entrar$/i }).click();
  await page.waitForTimeout(5000);

  const visibleError = await page
    .locator(".inline-alert.danger, [role=alert]")
    .first()
    .textContent()
    .catch(() => "");
  const h1 = await page.locator("h1").first().textContent().catch(() => "");

  console.log(JSON.stringify({ finalUrl: page.url(), h1, visibleError, events }, null, 2));
} finally {
  await browser.close();
}
