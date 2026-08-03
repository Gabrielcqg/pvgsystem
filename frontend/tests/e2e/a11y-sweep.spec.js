// Sweep de acessibilidade (axe-core) nas 14 telas autenticadas.
// Cataloga violações sérias/críticas por tela. Não escreve dados.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const email = process.env.SUPABASE_TEST_EMAIL;
const password = process.env.SUPABASE_TEST_PASSWORD;

const VIEWS = [
  "Painel", "Contratos", "Parcelas", "Parceiros", "Radar processual", "Lançamentos",
  "Custos fixos", "Fluxo de caixa", "DRE", "Balanço", "Tarefas", "Ajustes", "Auditoria", "Importação",
];

async function login(page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Senha" }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();
}

test.describe("Acessibilidade (axe) — todas as telas", () => {
  test.setTimeout(240_000);
  test.skip(!email || !password, "SUPABASE_TEST_EMAIL/PASSWORD requeridos");

  test("varre violações sérias/críticas por tela", async ({ page }) => {
    const summary = [];
    const detail = {}; // ruleId -> { impact, views:Set, nodes }
    try {
      await login(page);
      for (const view of VIEWS) {
        await page.getByRole("button", { name: view, exact: true }).click();
        await expect(page.getByRole("heading", { name: view, exact: true })).toBeVisible({ timeout: 20_000 });
        await page.waitForTimeout(400);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa"])
          .analyze();
        const graves = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        summary.push({ view, total: results.violations.length, graves: graves.length,
          rules: graves.map((v) => `${v.id}(${v.nodes.length})`) });
        for (const v of graves) {
          detail[v.id] = detail[v.id] || { impact: v.impact, views: new Set(), nodes: 0, help: v.help };
          detail[v.id].views.add(view);
          detail[v.id].nodes += v.nodes.length;
        }
      }
    } finally {
      console.log("\n===== A11Y POR TELA =====");
      for (const s of summary) console.log(`  ${s.view}: ${s.graves} sérias/críticas [${s.rules.join(", ")}] (total ${s.total})`);
      console.log("\n===== A11Y AGREGADO (regra → telas) =====");
      for (const [rule, d] of Object.entries(detail).sort((a, b) => b[1].nodes - a[1].nodes)) {
        console.log(`  · [${d.impact}] ${rule}: ${d.nodes} nós em ${d.views.size} telas — ${d.help}`);
      }
      console.log("===== FIM A11Y =====\n");
    }
    // Catálogo: não falha o build por a11y (registro). Só sinaliza contagem.
    const totalGraves = summary.reduce((n, s) => n + s.graves, 0);
    console.log(`TOTAL sérias/críticas somadas: ${totalGraves}`);
    expect(summary.length).toBe(VIEWS.length);
  });
});
