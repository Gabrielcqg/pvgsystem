import { defineConfig } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(configDir, "..");

function parseEnvValue(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).replace(/\\n/g, "\n");
  }
  return trimmed;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] === undefined) process.env[key] = parseEnvValue(rawValue);
  }
}

for (const filePath of [
  path.join(repoRoot, ".env"),
  path.join(configDir, ".env"),
  path.join(configDir, ".env.local"),
]) {
  loadEnvFile(filePath);
}

const frontendUrl = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:5175";
const apiUrl = process.env.VITE_API_URL || "http://127.0.0.1:8010";
const corsOrigins = [
  process.env.CORS_ALLOWED_ORIGINS,
  "http://127.0.0.1:5175",
  "http://localhost:5175",
]
  .filter(Boolean)
  .join(",");

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: { timeout: 45_000 },
  workers: 1,
  reporter: "list",
  use: {
    baseURL: frontendUrl,
    trace: "off",
    video: "off",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: ".venv/bin/uvicorn app.api.main:app --host 127.0.0.1 --port 8010",
      cwd: "..",
      url: `${apiUrl.replace(/\/+$/, "")}/health`,
      reuseExistingServer: false,
      env: {
        ...process.env,
        PYTHONPATH: path.join(repoRoot, "backend"),
        CORS_ALLOWED_ORIGINS: corsOrigins,
      },
      timeout: 60_000,
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5175 --strictPort",
      url: frontendUrl,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
