// Smoke + console/bug sweep: navega TODAS as telas e abre TODOS os modais,
// coletando erros de console, exceções não tratadas, respostas HTTP com falha e
// texto suspeito (null/NaN/undefined/Invalid Date) visível na área de conteúdo.
// Não escreve dados: só navega e abre/fecha modais por Escape. Cataloga problemas de UI/console.
import { test, expect } from "@playwright/test";

const email = process.env.SUPABASE_TEST_EMAIL;
const password = process.env.SUPABASE_TEST_PASSWORD;
const apiUrl = (process.env.VITE_API_URL || "http://127.0.0.1:8010").replace(/\/+$/, "");

const VIEWS = [
  "Painel", "Contratos", "Parcelas", "Parceiros", "Radar processual", "Lançamentos",
  "Custos fixos", "Fluxo de caixa", "DRE", "Balanço", "Tarefas", "Ajustes", "Auditoria", "Importação",
];
// Botões que abrem modais (nome do botão -> tela onde existe)
const MODAL_OPENERS = [
  { view: "Contratos", button: "+ Contrato" },
  { view: "Custos fixos", button: "+ Novo custo fixo" },
  { view: "Tarefas", button: "+ Nova tarefa" },
  { view: "Radar processual", button: "+ Adicionar processo" },
];

async function login(page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Senha" }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();
}

test.describe("Smoke + console/bug sweep", () => {
  test.setTimeout(300_000);
  test.skip(!email || !password, "SUPABASE_TEST_EMAIL/PASSWORD requeridos");

  test("varre todas as telas e modais coletando erros e texto suspeito", async ({ page }) => {
    const issues = [];
    page.on("console", (m) => {
      if (m.type() === "error") issues.push({ kind: "console.error", text: m.text().slice(0, 300) });
    });
    page.on("pageerror", (e) => issues.push({ kind: "pageerror", text: String(e).slice(0, 300) }));
    page.on("response", (r) => {
      const u = r.url();
      if (u.startsWith(apiUrl) && r.status() >= 400) {
        issues.push({ kind: "http", text: `${r.status()} ${r.request().method()} ${u.replace(apiUrl, "")}` });
      }
    });

    const SUSPECT = /(^|\W)(null|undefined|NaN|Invalid Date)(\W|$)/;
    try {
      await login(page);

      for (const view of VIEWS) {
        await page.getByRole("button", { name: view, exact: true }).click();
        await expect(page.getByRole("heading", { name: view, exact: true })).toBeVisible({ timeout: 20_000 });
        await page.waitForTimeout(500); // deixa carregar/otimista assentar
        const main = await page.locator("main").innerText().catch(() => "");
        for (const line of main.split("\n")) {
          if (SUSPECT.test(line.trim())) issues.push({ kind: "suspect-text", text: `[${view}] "${line.trim().slice(0, 120)}"` });
        }
      }

      for (const { view, button } of MODAL_OPENERS) {
        await page.getByRole("button", { name: view, exact: true }).click();
        await expect(page.getByRole("heading", { name: view, exact: true })).toBeVisible({ timeout: 20_000 });
        const opener = page.getByRole("button", { name: button }).first();
        if (await opener.count()) {
          await opener.click();
          await page.waitForTimeout(400);
          const dialogText = await page.locator("body").innerText().catch(() => "");
          for (const line of dialogText.split("\n")) {
            if (SUSPECT.test(line.trim())) issues.push({ kind: "suspect-text-modal", text: `[modal ${button}] "${line.trim().slice(0, 120)}"` });
          }
          await expect(page.getByRole("dialog")).toBeVisible();
          await page.keyboard.press("Escape");
          await expect(page.getByRole("dialog")).toHaveCount(0);
          await page.waitForTimeout(300);
        } else {
          issues.push({ kind: "missing-button", text: `[${view}] botão "${button}" não encontrado` });
        }
      }
    } finally {
      // Sempre imprime o catálogo, mesmo se algo acima falhar/estourar timeout.
      console.log("\n===== SWEEP ISSUES (" + issues.length + ") =====");
      for (const i of issues) console.log(`  · ${i.kind}: ${i.text}`);
      console.log("===== FIM SWEEP =====\n");
    }

    const graves = issues.filter((i) => i.kind === "pageerror" || i.kind === "console.error" || i.kind === "missing-button");
    expect(graves, JSON.stringify(graves, null, 2)).toEqual([]);
  });
});
