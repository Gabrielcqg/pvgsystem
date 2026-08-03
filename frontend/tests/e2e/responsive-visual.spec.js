import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

const email = process.env.SUPABASE_TEST_EMAIL;
const password = process.env.SUPABASE_TEST_PASSWORD;
const evidenceRoot = path.resolve(process.cwd(), "..", "docs", "evidence", "full-system-validation", "responsive");

const viewports = [
  { name: "desktop-large", width: 1440, height: 1000 },
  { name: "notebook", width: 1280, height: 800 },
  { name: "tablet", width: 834, height: 1112 },
  { name: "mobile", width: 390, height: 844 },
];

const views = [
  "Painel",
  "Contratos",
  "Parcelas",
  "Radar processual",
  "Lançamentos",
  "Custos fixos",
  "Fluxo de caixa",
  "DRE",
  "Balanço",
  "Tarefas",
  "Ajustes",
  "Auditoria",
];

async function login(page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Senha" }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();
}

async function openView(page, name) {
  if (name !== "Painel") await page.getByRole("button", { name, exact: true }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
}

test.describe("Responsive authenticated visual evidence", () => {
  test.setTimeout(240_000);
  test.skip(!email || !password, "Real Supabase auth env is required");

  for (const viewport of viewports) {
    test(`captures protected views at ${viewport.name}`, async ({ page }) => {
      fs.mkdirSync(path.join(evidenceRoot, viewport.name), { recursive: true });
      const consoleErrors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await login(page);
      for (const view of views) {
        await openView(page, view);
        const name = view.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/\s+/g, "-").toLowerCase();
        await page.screenshot({ path: path.join(evidenceRoot, viewport.name, `${name}.png`), fullPage: true });
      }
      expect(consoleErrors).toEqual([]);
    });
  }
});
