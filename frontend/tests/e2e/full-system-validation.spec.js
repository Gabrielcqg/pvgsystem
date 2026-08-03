import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const email = process.env.SUPABASE_TEST_EMAIL;
const password = process.env.SUPABASE_TEST_PASSWORD;
const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const supabaseAnon =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";
const apiUrl = (process.env.VITE_API_URL || "http://127.0.0.1:8010").replace(/\/+$/, "");
const evidenceRoot = path.resolve(process.cwd(), "..", "docs", "evidence", "full-system-validation");
const screenshotsDir = path.join(evidenceRoot, "screenshots");

async function login(page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Senha" }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();
}

async function openView(page, name) {
  await page.getByRole("button", { name, exact: true }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
}

async function getToken(request) {
  const response = await request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    headers: { apikey: supabaseAnon },
    data: { email, password, gotrue_meta_security: {} },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.access_token;
}

async function api(request, token, method, route, data) {
  const response = await request.fetch(`${apiUrl}${route}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    data,
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { response, body };
}

async function apiJson(request, token, route) {
  const { response, body } = await api(request, token, "GET", route);
  expect(response.ok()).toBeTruthy();
  return body;
}

async function firstRow(request, token, route, predicate = () => true) {
  const rows = await apiJson(request, token, route);
  return rows.find(predicate) || null;
}

async function waitForRow(request, token, route, predicate = () => true) {
  return expect
    .poll(async () => {
      const row = await firstRow(request, token, route, predicate);
      return row?.id || row?.chave || "";
    }, { timeout: 45_000 })
    .not.toBe("");
}

async function safeDelete(request, token, route) {
  const { response } = await api(request, token, "DELETE", route);
  if (![200, 204, 404].includes(response.status())) {
    throw new Error(`cleanup failed ${response.status()} ${route}`);
  }
}

function sanitizeUrl(url) {
  const parsed = new URL(url);
  if (parsed.pathname.includes("/auth/v1/token")) parsed.search = "";
  return `${parsed.origin}${parsed.pathname}${parsed.search}`;
}

test.describe("Full authenticated system validation", () => {
  test.setTimeout(900_000);
  test.skip(!email || !password || !supabaseUrl || !supabaseAnon, "Real Supabase auth env is required");

  test("executes real UI to FastAPI to Supabase flows and records evidence", async ({ page, request }) => {
    fs.mkdirSync(screenshotsDir, { recursive: true });
    const prefix = `E2E_TEST_${Date.now()}`;
    const token = await getToken(request);
    const created = {
      parceiros: [],
      contratos: [],
      parcelas: [],
      lancamentos: [],
      custosFixos: [],
      tarefas: [],
      processos: [],
    };
    const evidence = {
      prefix,
      modules: [],
      created,
      network: [],
      cleanup: [],
      apiChecks: [],
    };

    page.on("response", (response) => {
      const url = response.url();
      if (!url.startsWith(apiUrl) && !url.includes("/auth/v1/token")) return;
      evidence.network.push({
        method: response.request().method(),
        url: sanitizeUrl(url),
        status: response.status(),
      });
    });

    const screenshot = async (name) => {
      const file = path.join(screenshotsDir, `${name}.png`);
      await page.screenshot({ path: file, fullPage: true });
      evidence.modules.push({ name, screenshot: path.relative(evidenceRoot, file), result: "PASS" });
    };

    try {
      await login(page);
      await screenshot("01-painel");

      for (const view of ["Importação", "Contratos", "Parcelas", "Parceiros", "Radar processual", "Lançamentos", "Custos fixos", "Fluxo de caixa", "DRE", "Balanço", "Tarefas", "Ajustes", "Auditoria"]) {
        await openView(page, view);
        await screenshot(`view-${view.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/\s+/g, "-").toLowerCase()}`);
      }

      const partnerName = `${prefix}_PARCEIRO`;
      await openView(page, "Parceiros");
      await page.getByPlaceholder("Novo parceiro / origem").fill(partnerName);
      await page.getByRole("button", { name: "Adicionar" }).click();
      await waitForRow(request, token, `/parceiros?nome=${encodeURIComponent(partnerName)}`);
      const parceiro = await firstRow(request, token, `/parceiros?nome=${encodeURIComponent(partnerName)}`);
      created.parceiros.push(parceiro.id);
      await screenshot("flow-parceiro-criado");

      const contractName = `${prefix}_CONTRATO`;
      const editedContractName = `${contractName}_EDITADO`;
      await page.getByRole("button", { name: "+ Contrato" }).first().click();
      await page.getByLabel("CLIENTE").fill(contractName);
      await page.getByLabel("PARCEIRO / ORIGEM").selectOption({ label: partnerName });
      await page.getByLabel("STATUS").selectOption({ label: "Proposta" });
      await page.getByLabel("TIPO DE HONORÁRIO").selectOption({ label: "Fixo parcelado" });
      await page.getByLabel("FIXO TOTAL (R$)").fill("900");
      await page.getByLabel("OBSERVAÇÕES").fill(`${prefix}_OBS`);
      await page.getByRole("button", { name: "Salvar contrato" }).click();
      await waitForRow(request, token, `/contratos?cliente=${encodeURIComponent(contractName)}`);
      let contrato = await firstRow(request, token, `/contratos?cliente=${encodeURIComponent(contractName)}`);
      created.contratos.push(contrato.id);

      await openView(page, "Contratos");
      await page.getByPlaceholder("Buscar cliente…").fill(contractName);
      const contractCard = page.locator(".card").filter({ hasText: contractName }).first();
      await expect(contractCard).toBeVisible();
      await contractCard.getByRole("button", { name: "Editar" }).click();
      await page.getByLabel("CLIENTE").fill(editedContractName);
      await page.getByRole("button", { name: "Atualizar contrato" }).click();
      await waitForRow(request, token, `/contratos?cliente=${encodeURIComponent(editedContractName)}`);
      contrato = await firstRow(request, token, `/contratos?cliente=${encodeURIComponent(editedContractName)}`);
      await screenshot("flow-contrato-editado");

      await openView(page, "Contratos");
      await page.getByPlaceholder("Buscar cliente…").fill(editedContractName);
      await page.locator(".card").filter({ hasText: editedContractName }).first().getByRole("button", { name: "Registrar fechamento" }).click();
      await page.getByLabel("PARCELAS DO FIXO").fill("3");
      await page.getByRole("button", { name: "Registrar fechamento" }).last().click();
      await expect.poll(async () => {
        const rows = await apiJson(request, token, `/parcelas?contrato_id=${contrato.id}`);
        return rows.length;
      }, { timeout: 45_000 }).toBe(3);
      const parcelasGeradas = await apiJson(request, token, `/parcelas?contrato_id=${contrato.id}`);
      created.parcelas.push(...parcelasGeradas.map((row) => row.id));
      const parcela = parcelasGeradas[0];
      evidence.apiChecks.push({ name: "fechamento_gera_parcelas", contract: contrato.id, parcelas: parcelasGeradas.length, result: "PASS" });

      await page.reload();
      await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();
      await openView(page, "Parcelas");
      await expect(page.locator("tr").filter({ hasText: editedContractName }).first()).toBeVisible();
      await page.locator("tr").filter({ hasText: editedContractName }).first().getByRole("button", { name: "Confirmar recebimento" }).click();
      await expect.poll(async () => {
        const rows = await apiJson(request, token, `/parcelas?contrato_id=${contrato.id}`);
        return rows.some((row) => row.recebido === true);
      }, { timeout: 45_000 }).toBeTruthy();
      const parcelasAposRecebimento = await apiJson(request, token, `/parcelas?contrato_id=${contrato.id}`);
      const parcelaRecebida = parcelasAposRecebimento.find((row) => row.recebido === true);
      const lancParcela = await firstRow(request, token, `/lancamentos?origem=parcela&origem_id=${parcelaRecebida.id}`);
      if (lancParcela) created.lancamentos.push(lancParcela.id);
      await page.getByRole("button", { name: "Recebidas" }).click();
      await page.locator("tr").filter({ hasText: editedContractName }).first().getByRole("button", { name: "estornar" }).click();
      await expect.poll(async () => {
        const rows = await apiJson(request, token, `/parcelas?contrato_id=${contrato.id}`);
        return rows.every((row) => row.recebido === false);
      }, { timeout: 45_000 }).toBeTruthy();
      evidence.apiChecks.push({ name: "parcela_confirmar_estornar", before: parcela.id, receivedRow: parcelaRecebida.id, result: "PASS" });
      await screenshot("flow-parcela-confirmada-estornada");

      const entradaDesc = `${prefix}_ENTRADA`;
      const saidaDesc = `${prefix}_SAIDA`;
      await page.getByRole("button", { name: "+ Entrada / Saída" }).click();
      await page.getByLabel("DESCRIÇÃO / CLIENTE").fill(entradaDesc);
      await page.getByLabel("VALOR (R$)").fill("700");
      await page.getByLabel("CATEGORIA").selectOption({ label: "Consultoria" });
      await page.getByRole("button", { name: "Salvar lançamento" }).click();
      await waitForRow(request, token, `/lancamentos?descricao=${encodeURIComponent(entradaDesc)}`);
      const entrada = await firstRow(request, token, `/lancamentos?descricao=${encodeURIComponent(entradaDesc)}`);
      created.lancamentos.push(entrada.id);

      await page.getByRole("button", { name: "+ Entrada / Saída" }).click();
      await page.getByRole("button", { name: "Saída", exact: true }).click();
      await page.getByLabel("DESCRIÇÃO / CLIENTE").fill(saidaDesc);
      await page.getByLabel("VALOR (R$)").fill("120");
      await page.getByLabel("CATEGORIA").selectOption({ label: "Infraestrutura" });
      await page.getByRole("button", { name: "Salvar lançamento" }).click();
      await waitForRow(request, token, `/lancamentos?descricao=${encodeURIComponent(saidaDesc)}`);
      const saida = await firstRow(request, token, `/lancamentos?descricao=${encodeURIComponent(saidaDesc)}`);
      created.lancamentos.push(saida.id);
      await screenshot("flow-lancamentos-criados");

      await openView(page, "Lançamentos");
      await page.locator("tr").filter({ hasText: entradaDesc }).first().getByText("editar").click();
      await page.getByLabel("DESCRIÇÃO / CLIENTE").fill(`${entradaDesc}_EDITADA`);
      await page.getByRole("button", { name: "Atualizar lançamento" }).click();
      await waitForRow(request, token, `/lancamentos?descricao=${encodeURIComponent(`${entradaDesc}_EDITADA`)}`);

      const custoDesc = `${prefix}_CUSTO`;
      await openView(page, "Custos fixos");
      await page.getByRole("button", { name: "+ Novo custo fixo" }).click();
      await page.getByLabel("DESCRIÇÃO").fill(custoDesc);
      await page.getByLabel("VALOR MENSAL (R$)").fill("80");
      await page.getByLabel("DIA DO VENCIMENTO").fill("5");
      await page.getByRole("button", { name: "Salvar custo fixo" }).click();
      await waitForRow(request, token, `/custos-fixos?descricao=${encodeURIComponent(custoDesc)}`);
      const custo = await firstRow(request, token, `/custos-fixos?descricao=${encodeURIComponent(custoDesc)}`);
      created.custosFixos.push(custo.id);
      await expect(page.locator("tr").filter({ hasText: custoDesc }).first()).toBeVisible({ timeout: 45_000 });
      const lancarCustoButton = page
        .locator("div")
        .filter({ hasText: custoDesc })
        .filter({ has: page.getByRole("button", { name: "Lançar no caixa" }) })
        .first()
        .getByRole("button", { name: "Lançar no caixa" });
      await expect(lancarCustoButton).toBeVisible({ timeout: 45_000 });
      await lancarCustoButton.click();
      await expect.poll(async () => {
        const row = await firstRow(request, token, `/lancamentos?origem=custo_fixo&origem_id=${encodeURIComponent(`${custo.id}:2026-07`)}`);
        return row?.id || "";
      }, { timeout: 45_000 }).not.toBe("");
      const lancCusto = await firstRow(request, token, `/lancamentos?origem=custo_fixo&origem_id=${encodeURIComponent(`${custo.id}:2026-07`)}`);
      created.lancamentos.push(lancCusto.id);
      await screenshot("flow-custo-fixo-lancado");

      const tarefaTitulo = `${prefix}_TAREFA`;
      await openView(page, "Tarefas");
      await page.getByRole("button", { name: "+ Nova tarefa" }).click();
      await page.getByRole("textbox", { name: "TÍTULO DA TAREFA", exact: true }).fill(tarefaTitulo);
      await page.getByRole("textbox", { name: "RESPONSÁVEL", exact: true }).fill("E2E");
      await page.getByRole("button", { name: "Salvar tarefa" }).click();
      await waitForRow(request, token, `/tarefas?titulo=${encodeURIComponent(tarefaTitulo)}`);
      const tarefa = await firstRow(request, token, `/tarefas?titulo=${encodeURIComponent(tarefaTitulo)}`);
      created.tarefas.push(tarefa.id);
      await page.getByRole("checkbox", { name: `Concluir tarefa ${tarefaTitulo}` }).click();
      await expect.poll(async () => {
        const row = await firstRow(request, token, `/tarefas?titulo=${encodeURIComponent(tarefaTitulo)}`);
        return row?.status;
      }, { timeout: 45_000 }).toBe("concluida");
      await expect(page.getByRole("checkbox", { name: `Reabrir tarefa ${tarefaTitulo}` })).toBeChecked({ timeout: 45_000 });
      await screenshot("flow-tarefa-concluida");

      const processNumber = `${String(Date.now()).slice(-7)}-99.2026.8.06.0001`;
      const processClient = `${prefix}_PROCESSO_TJCE`;
      await openView(page, "Radar processual");
      await page.getByRole("button", { name: "+ Adicionar processo" }).click();
      await page.getByRole("textbox", { name: "PROCESSO (Nº CNJ)", exact: true }).fill(processNumber);
      await page.getByRole("textbox", { name: "CLIENTE / VÍNCULO", exact: true }).fill(processClient);
      await page.getByRole("combobox", { name: "TRIBUNAL", exact: true }).selectOption({ label: "TJCE" });
      await page.getByRole("textbox", { name: "VARA / JUÍZO", exact: true }).fill("E2E");
      const saveProcessButton = page.getByRole("button", { name: "Adicionar ao radar" });
      await expect(saveProcessButton).toBeEnabled();
      const [processResponse] = await Promise.all([
        page.waitForResponse((response) => response.url().startsWith(`${apiUrl}/processos`) && response.request().method() === "POST", { timeout: 45_000 }),
        saveProcessButton.click(),
      ]);
      expect(processResponse.ok()).toBeTruthy();
      await waitForRow(request, token, `/processos?cliente=${encodeURIComponent(processClient)}`);
      const processo = await firstRow(request, token, `/processos?cliente=${encodeURIComponent(processClient)}`);
      created.processos.push(processo.id);
      await expect(page.getByText(processClient)).toBeVisible();
      await screenshot("flow-processo-tjce-aguardando-scraper");

      await openView(page, "Ajustes");
      const paramsBefore = await apiJson(request, token, "/parametros/2026");
      const caixaInput = page.getByLabel("Caixa inicial do ano");
      await caixaInput.fill(String(Number(paramsBefore.caixa_inicial_ano || 0) + 1));
      await page.getByRole("button", { name: "Salvar parametros" }).click();
      await expect.poll(async () => {
        const row = await apiJson(request, token, "/parametros/2026");
        return Number(row.caixa_inicial_ano || 0);
      }, { timeout: 45_000 }).toBe(Number(paramsBefore.caixa_inicial_ano || 0) + 1);
      await api(request, token, "PUT", "/parametros/2026", paramsBefore);
      await screenshot("flow-parametros-salvos-auditoria");

      await openView(page, "Auditoria");
      await expect(page.getByRole("heading", { name: "Auditoria", exact: true })).toBeVisible();
      await screenshot("flow-auditoria-consultada");

      const axe = await new AxeBuilder({ page }).analyze();
      expect(axe.violations.filter((v) => v.impact === "critical")).toEqual([]);
    } finally {
      for (const id of created.tarefas) {
        await safeDelete(request, token, `/tarefas/${id}`).then(() => evidence.cleanup.push(`tarefas:${id}`)).catch(() => {});
      }
      for (const id of created.processos) {
        await safeDelete(request, token, `/processos/${id}`).then(() => evidence.cleanup.push(`processos:${id}`)).catch(() => {});
      }
      for (const id of created.lancamentos) {
        await safeDelete(request, token, `/lancamentos/${id}`).then(() => evidence.cleanup.push(`lancamentos:${id}`)).catch(() => {});
      }
      for (const id of created.parcelas) {
        await safeDelete(request, token, `/parcelas/${id}`).then(() => evidence.cleanup.push(`parcelas:${id}`)).catch(() => {});
      }
      for (const id of created.contratos) {
        await safeDelete(request, token, `/contratos/${id}?cascade=true`).then(() => evidence.cleanup.push(`contratos:${id}`)).catch(() => {});
      }
      for (const id of created.custosFixos) {
        await safeDelete(request, token, `/custos-fixos/${id}`).then(() => evidence.cleanup.push(`custos_fixos:${id}`)).catch(() => {});
      }
      for (const id of created.parceiros) {
        await safeDelete(request, token, `/parceiros/${id}`).then(() => evidence.cleanup.push(`parceiros:${id}`)).catch(() => {});
      }
      fs.writeFileSync(path.join(evidenceRoot, "full-system-validation.json"), JSON.stringify(evidence, null, 2));
    }
  });
});
