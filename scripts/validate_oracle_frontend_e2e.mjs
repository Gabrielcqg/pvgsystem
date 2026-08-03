import playwright from "../frontend/node_modules/@playwright/test/index.js";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

const repoRoot = process.cwd();
const evidenceDir = path.join(repoRoot, "docs/evidence/oracle-final-validation");
fs.mkdirSync(evidenceDir, { recursive: true });

function parseEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  for (const raw of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const rootEnv = parseEnvFile(path.join(repoRoot, ".env"));
const frontendEnv = parseEnvFile(path.join(repoRoot, "frontend/.env.local"));
const frontendUrl = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:5173";
const apiUrl = (frontendEnv.VITE_API_URL || rootEnv.RADAR_API_URL || "").replace(/\/+$/, "");
const supabaseUrl = (rootEnv.SUPABASE_URL || frontendEnv.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const supabaseKey = rootEnv.SUPABASE_ANON_KEY || frontendEnv.VITE_SUPABASE_ANON_KEY || frontendEnv.VITE_SUPABASE_PUBLISHABLE_KEY;
const email = rootEnv.SUPABASE_TEST_EMAIL;
const password = rootEnv.SUPABASE_TEST_PASSWORD;

if (!apiUrl.startsWith("http://164.152.35.255")) {
  throw new Error("VITE_API_URL/RADAR_API_URL nao aponta para a Oracle.");
}
if (!supabaseUrl || !supabaseKey || !email || !password) {
  throw new Error("Variaveis de teste Supabase ausentes.");
}

function isPortClosed(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port, timeout: 600 });
    socket.on("connect", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => resolve(true));
  });
}

async function getToken() {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: supabaseKey, "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(`Supabase Auth HTTP ${response.status}`);
  return (await response.json()).access_token;
}

async function apiRequest(token, method, apiPath, body, expected = [200, 204]) {
  const response = await fetch(`${apiUrl}${apiPath}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!expected.includes(response.status)) {
    throw new Error(`${method} ${apiPath} HTTP ${response.status}`);
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function shortId(id) {
  return String(id || "").slice(0, 8);
}

const report = {
  started_at: new Date().toISOString(),
  frontend_url: frontendUrl,
  api_points_to_oracle: apiUrl.startsWith("http://164.152.35.255"),
  local_8000_down: await isPortClosed(8000),
  unexpected_local_api_requests: [],
  console_errors: [],
  api_failures: [],
  tests: [],
  screenshots: [],
};
const { chromium } = playwright;

function addTest(funcionalidade, acao, esperado, encontrado, started, status = "PASS", correcao = "") {
  report.tests.push({
    funcionalidade,
    acao,
    resultado_esperado: esperado,
    resultado_encontrado: encontrado,
    tempo_ms: Math.round(performance.now() - started),
    evidencia_logs: "",
    status,
    correcao,
  });
}

if (!report.local_8000_down) {
  throw new Error("Existe listener local na porta 8000.");
}

const cleanupIds = {
  parceiros: [],
  contratos: [],
  lancamentos: [],
  custos: [],
  processos: [],
  tarefas: [],
};

const token = await getToken();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
const page = await context.newPage();
const apiRequests = [];

page.on("request", (request) => {
  if (request.url().includes("localhost:8000") || request.url().includes("127.0.0.1:8000")) {
    report.unexpected_local_api_requests.push({ method: request.method(), url: request.url() });
  }
});

page.on("response", async (response) => {
  const url = response.url();
  if (!url.startsWith(apiUrl)) return;
  const parsed = new URL(url);
  const item = {
    method: response.request().method(),
    path: `${parsed.pathname}${parsed.search}`,
    status: response.status(),
  };
  apiRequests.push(item);
  if (response.status() >= 500 || response.status() === 404) report.api_failures.push(item);
});

page.on("console", (message) => {
  if (["error", "warning"].includes(message.type())) {
    const text = message.text();
    if (!text.includes("favicon") && !text.includes("Failed to load resource: the server responded with a status of 404")) {
      report.console_errors.push({ type: message.type(), text: text.slice(0, 300) });
    }
  }
});

async function screenshot(name) {
  const filePath = path.join(evidenceDir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  report.screenshots.push(path.relative(repoRoot, filePath));
}

async function waitApi(method, pathPart, status = 200) {
  return page.waitForResponse((response) => (
    response.url().startsWith(apiUrl)
    && response.request().method() === method
    && response.url().includes(pathPart)
    && response.status() === status
  ), { timeout: 45_000 });
}

async function clickNav(name, expectedText = name) {
  const started = performance.now();
  await page.getByRole("button", { name, exact: true }).first().click();
  await page.waitForTimeout(350);
  await page.getByText(expectedText, { exact: false }).first().waitFor({ timeout: 20_000 });
  addTest("navegação", `abrir ${name}`, "tela carregada sem erro", `${expectedText} visível`, started);
}

async function saveModal(buttonName, method, pathPart, status = 200) {
  const started = performance.now();
  const [response] = await Promise.all([
    waitApi(method, pathPart, status),
    page.getByRole("button", { name: buttonName, exact: true }).click(),
  ]);
  return { response, started };
}

async function actionWithApi(action, method, pathPart, status = 200) {
  const started = performance.now();
  const [response] = await Promise.all([
    waitApi(method, pathPart, status),
    action(),
  ]);
  return { response, started };
}

async function visibleTaskRow(title) {
  const row = page.locator(".row", { hasText: title }).first();
  if (await row.isVisible().catch(() => false)) return row;
  const sairDoFoco = page.getByRole("button", { name: "Sair do foco" });
  if (await sairDoFoco.isVisible().catch(() => false)) {
    await sairDoFoco.click();
    await page.waitForTimeout(250);
  }
  const todas = page.getByRole("button", { name: /Filtrar tarefas todas/i }).first();
  if (await todas.isVisible().catch(() => false)) {
    await todas.click();
    await page.waitForTimeout(350);
  }
  await row.waitFor({ timeout: 20_000 });
  return row;
}

try {
  const stamp = `E2E_TEST_UI_ORACLE_${Date.now()}`;

  let started = performance.now();
  let response;
  let body;
  await page.goto(`${frontendUrl}/login`, { waitUntil: "domcontentloaded" });
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  const loginNetworkEvidence = page.waitForResponse((apiResponse) => (
    apiResponse.url().startsWith(apiUrl)
    && apiResponse.request().method() === "GET"
    && [200, 304].includes(apiResponse.status())
  ), { timeout: 20_000 }).catch(() => null);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.getByText("sistema conectado").waitFor({ timeout: 45_000 });
  const loginApiResponse = await loginNetworkEvidence;
  const protectedUiOk = await page.getByRole("button", { name: "Contratos", exact: true }).first().isVisible().catch(() => false);
  const loginApiOk = Boolean(loginApiResponse) || apiRequests.some((item) => (
    (item.path.startsWith("/bootstrap") || item.path.startsWith("/me")) && item.status === 200
  ));
  addTest(
    "login/autenticação",
    "login pelo frontend",
    "sessão autenticada e dados carregados pela Oracle",
    `sistema conectado; tela protegida=${protectedUiOk}; resposta Oracle=${loginApiOk}; /me coberto na bateria API`,
    started,
    protectedUiOk && loginApiOk ? "PASS" : "FAIL",
  );
  await screenshot("01-dashboard");

  for (const [nav, text] of [
    ["Contratos", "Contratos"],
    ["Parcelas", "Parcelas"],
    ["Parceiros", "Parceiro"],
    ["Radar processual", "Radar"],
    ["Lançamentos", "Entradas e saídas"],
    ["Custos fixos", "Custos fixos"],
    ["Fluxo de caixa", "Fluxo"],
    ["DRE", "DRE"],
    ["Balanço", "Balanço"],
    ["Tarefas", "Tarefas"],
    ["Ajustes", "Parâmetros"],
    ["Auditoria", "Auditoria"],
  ]) {
    await clickNav(nav, text);
  }

  await page.getByRole("button", { name: "Parceiros", exact: true }).first().click();
  await page.getByPlaceholder("Novo parceiro / origem").waitFor({ timeout: 20_000 });
  await page.getByPlaceholder("Novo parceiro / origem").fill(`${stamp}_Parceiro`);
  ({ response, started } = await actionWithApi(
    () => page.getByRole("button", { name: "Adicionar", exact: true }).click(),
    "POST",
    "/parceiros",
  ));
  body = await response.json();
  cleanupIds.parceiros.push(body.id);
  await page.getByText(`${stamp}_Parceiro`).waitFor({ timeout: 20_000 });
  addTest("clientes/parceiros", "criar parceiro pela UI", "parceiro aparece na tabela e API retorna 200", `id=${shortId(body.id)}`, started);

  ({ response, started } = await actionWithApi(
    () => page.locator("tr", { hasText: `${stamp}_Parceiro` }).getByRole("button", { name: "remover" }).click(),
    "DELETE",
    `/parceiros/${body.id}`,
  ));
  await response.finished();
  cleanupIds.parceiros = cleanupIds.parceiros.filter((id) => id !== body.id);
  addTest("clientes/parceiros", "remover parceiro pela UI", "registro removido sem depender da API local", "DELETE 200", started);

  await page.getByRole("button", { name: "+ Contrato", exact: true }).first().click();
  await page.getByLabel("CLIENTE").fill(`${stamp}_Cliente Contrato`);
  await page.getByLabel("TIPO DE HONORÁRIO").selectOption({ label: "Fixo parcelado" });
  await page.getByLabel("FIXO TOTAL (R$)").fill("800");
  await page.getByLabel("VALOR DA CAUSA (R$)").fill("5000");
  await page.getByLabel("OBSERVAÇÕES").fill(stamp);
  ({ response, started } = await saveModal("Salvar contrato", "POST", "/contratos"));
  body = await response.json();
  cleanupIds.contratos.push(body.id);
  await page.getByRole("button", { name: "Contratos", exact: true }).first().click();
  await page.getByText(`${stamp}_Cliente Contrato`).waitFor({ timeout: 20_000 });
  addTest("contratos", "criar contrato pela UI", "contrato persistido e visível", `id=${shortId(body.id)}`, started);

  await page.locator(".card", { hasText: `${stamp}_Cliente Contrato` }).getByRole("button", { name: "Editar" }).click();
  await page.getByLabel("OBSERVAÇÕES").fill(`${stamp}_editado`);
  ({ response, started } = await saveModal("Atualizar contrato", "PATCH", `/contratos/${body.id}`));
  await response.finished();
  addTest("contratos", "editar contrato pela UI", "PATCH remoto realizado", `id=${shortId(body.id)}`, started);

  ({ response, started } = await actionWithApi(
    () => page.locator(".card", { hasText: `${stamp}_Cliente Contrato` }).getByRole("button", { name: "remover" }).click(),
    "DELETE",
    `/contratos/${body.id}`,
  ));
  await response.finished();
  cleanupIds.contratos = cleanupIds.contratos.filter((id) => id !== body.id);
  addTest("contratos", "remover contrato pela UI", "contrato removido via Oracle", "DELETE 200", started);

  await clickNav("Lançamentos", "Entradas e saídas");
  await page.getByRole("button", { name: "+ Nova entrada / saída", exact: true }).click();
  await page.getByLabel("DESCRIÇÃO / CLIENTE").fill(`${stamp}_Entrada UI`);
  await page.getByLabel("VALOR (R$)").fill("123.45");
  await page.getByLabel("CATEGORIA").selectOption({ label: "Outras entradas" });
  ({ response, started } = await saveModal("Salvar lançamento", "POST", "/lancamentos"));
  body = await response.json();
  cleanupIds.lancamentos.push(body.id);
  await page.getByText(`${stamp}_Entrada UI`).waitFor({ timeout: 20_000 });
  addTest("lançamentos", "criar entrada pela UI", "entrada persistida e aparece na lista", `id=${shortId(body.id)}`, started);

  ({ response, started } = await actionWithApi(
    () => page.locator("tr", { hasText: `${stamp}_Entrada UI` }).getByRole("button", { name: "remover" }).click(),
    "DELETE",
    `/lancamentos/${body.id}`,
  ));
  await response.finished();
  cleanupIds.lancamentos = cleanupIds.lancamentos.filter((id) => id !== body.id);
  addTest("lançamentos", "remover entrada pela UI", "lançamento removido via Oracle", "DELETE 200", started);

  await clickNav("Custos fixos", "Cadastro de custos fixos");
  await page.getByRole("button", { name: "+ Novo custo fixo", exact: true }).click();
  await page.getByLabel("DESCRIÇÃO").fill(`${stamp}_Custo UI`);
  await page.getByLabel("VALOR MENSAL (R$)").fill("222");
  ({ response, started } = await saveModal("Salvar custo fixo", "POST", "/custos-fixos"));
  body = await response.json();
  cleanupIds.custos.push(body.id);
  await page.getByText(`${stamp}_Custo UI`).first().waitFor({ timeout: 20_000 });
  addTest("custos fixos", "criar custo fixo pela UI", "custo persistido e visível", `id=${shortId(body.id)}`, started);

  ({ response, started } = await actionWithApi(
    () => page.locator(".row", { hasText: `${stamp}_Custo UI` }).getByRole("button", { name: "remover" }).click(),
    "DELETE",
    `/custos-fixos/${body.id}`,
  ));
  await response.finished();
  cleanupIds.custos = cleanupIds.custos.filter((id) => id !== body.id);
  addTest("custos fixos", "remover custo fixo pela UI", "custo removido via Oracle", "DELETE 200", started);

  await clickNav("Radar processual", "Processos monitorados");
  await page.getByRole("button", { name: "+ Adicionar processo", exact: true }).first().click();
  await page.getByLabel("ÁREA / PASTA").fill(stamp);
  await page.getByLabel("Nº INTERNO").fill("UI-1");
  await page.getByLabel("PROCESSO (Nº CNJ)").fill("0000777-77.2026.8.26.0100");
  await page.getByLabel("CLIENTE / VÍNCULO").fill(`${stamp}_Cliente Processo`);
  await page.getByLabel("AUTOR").fill(`${stamp}_Autor`);
  await page.getByLabel("RÉU").fill(`${stamp}_Reu`);
  await page.getByLabel("ASSUNTO").fill(stamp);
  ({ response, started } = await saveModal("Adicionar ao radar", "POST", "/processos"));
  body = await response.json();
  cleanupIds.processos.push(body.id);
  await page.getByText("0000777-77.2026.8.26.0100").waitFor({ timeout: 20_000 });
  addTest("processos/radar", "criar processo pela UI", "processo monitorado visível", `id=${shortId(body.id)}`, started);

  await page.locator("tr", { hasText: "0000777-77.2026.8.26.0100" }).getByRole("button", { name: "editar" }).click();
  await page.getByLabel("STATUS").fill("Ativo E2E");
  ({ response, started } = await saveModal("Atualizar processo", "PATCH", `/processos/${body.id}`));
  await response.finished();
  addTest("processos/radar", "editar processo pela UI", "PATCH remoto realizado", `id=${shortId(body.id)}`, started);

  ({ response, started } = await actionWithApi(
    () => page.locator("tr", { hasText: "0000777-77.2026.8.26.0100" }).getByRole("button", { name: "remover" }).click(),
    "DELETE",
    `/processos/${body.id}`,
  ));
  await response.finished();
  cleanupIds.processos = cleanupIds.processos.filter((id) => id !== body.id);
  addTest("processos/radar", "remover processo pela UI", "processo removido via Oracle", "DELETE 200", started);

  await clickNav("Tarefas", "Kanban");
  await page.getByRole("button", { name: "+ Nova tarefa", exact: true }).click();
  await page.getByRole("textbox", { name: "TAREFA", exact: true }).fill(`${stamp}_Tarefa UI`);
  await page.getByRole("textbox", { name: "DESCRIÇÃO", exact: true }).fill(stamp);
  await page.getByLabel("RESPONSÁVEL").fill("E2E");
  await page.getByLabel("STATUS", { exact: true }).selectOption("backlog");
  await page.getByLabel("PRIORIDADE", { exact: true }).selectOption("alta");
  ({ response, started } = await saveModal("Salvar tarefa", "POST", "/tarefas"));
  body = await response.json();
  cleanupIds.tarefas.push(body.id);
  await page.getByText(`${stamp}_Tarefa UI`).waitFor({ timeout: 20_000 });
  addTest("tarefas", "criar tarefa pela UI", "tarefa aparece no Kanban", `id=${shortId(body.id)}`, started);
  await screenshot("02-tarefas-kanban");

  ({ response, started } = await actionWithApi(
    () => page.locator(".row", { hasText: `${stamp}_Tarefa UI` }).getByLabel(`Status de ${stamp}_Tarefa UI`).selectOption("em_andamento"),
    "POST",
    `/tarefas/${body.id}/status`,
  ));
  await response.finished();
  addTest("tarefas Kanban", "mover tarefa por seletor", "status salvo sem voltar visualmente", "em_andamento", started);

  const movedTaskRow = await visibleTaskRow(`${stamp}_Tarefa UI`);
  ({ response, started } = await actionWithApi(
    () => movedTaskRow.locator("input[type='checkbox']").first().check(),
    "POST",
    `/tarefas/${body.id}/concluir`,
  ));
  await response.finished();
  await page.getByRole("button", { name: /Filtrar tarefas concluídas/i }).waitFor({ timeout: 10_000 });
  addTest("tarefas", "concluir tarefa pela UI", "tarefa concluída e visão concluídas ativada", "POST concluir 200", started);

  ({ response, started } = await actionWithApi(
    () => page.locator(".row", { hasText: `${stamp}_Tarefa UI` }).getByRole("button", { name: "arquivar" }).click(),
    "POST",
    `/tarefas/${body.id}/arquivar`,
  ));
  await response.finished();
  addTest("tarefas", "arquivar tarefa pela UI", "tarefa sai das visões normais", "POST arquivar 200", started);

  await page.getByRole("button", { name: /Arquivadas/i }).first().click();
  await page.getByText(`${stamp}_Tarefa UI`).waitFor({ timeout: 20_000 });

  ({ response, started } = await actionWithApi(
    () => page.locator(".row", { hasText: `${stamp}_Tarefa UI` }).getByRole("button", { name: "restaurar" }).click(),
    "POST",
    `/tarefas/${body.id}/restaurar`,
  ));
  await response.finished();
  addTest("tarefas", "restaurar tarefa pela UI", "tarefa restaurada", "POST restaurar 200", started);

  started = performance.now();
  await page.getByRole("button", { name: /Concluídas/i }).first().click();
  const focoAtivo = page.getByText("Modo foco ativo");
  if (!(await focoAtivo.isVisible().catch(() => false))) {
    await page.locator('[data-task-status="concluida"]').getByRole("button", { name: "foco" }).click();
  }
  await focoAtivo.waitFor({ timeout: 10_000 });
  await page.getByRole("button", { name: "Sair do foco" }).click();
  addTest("tarefas Kanban", "modo foco de coluna", "foco entra e sai sem quebrar layout", "Modo foco ativo validado", started);

  ({ response, started } = await actionWithApi(
    () => page.locator(".row", { hasText: `${stamp}_Tarefa UI` }).getByRole("button", { name: "arquivar" }).click(),
    "POST",
    `/tarefas/${body.id}/arquivar`,
  ));
  await response.finished();
  await page.getByRole("button", { name: /Arquivadas/i }).first().click();
  const sairDoFoco = page.getByRole("button", { name: "Sair do foco" });
  if (await sairDoFoco.isVisible().catch(() => false)) {
    await sairDoFoco.click();
  }
  await page.getByText(`${stamp}_Tarefa UI`).waitFor({ timeout: 20_000 });
  page.once("dialog", (dialog) => dialog.accept());
  response = await actionWithApi(
    () => page.locator(".row", { hasText: `${stamp}_Tarefa UI` }).getByRole("button", { name: "excluir" }).click(),
    "DELETE",
    `/tarefas/${body.id}`,
    204,
  ).then((result) => result.response);
  await response.finished();
  cleanupIds.tarefas = cleanupIds.tarefas.filter((id) => id !== body.id);
  addTest("tarefas", "excluir tarefa arquivada pela UI", "DELETE permanente executado", "DELETE 204", started);

  await page.reload({ waitUntil: "domcontentloaded" });
  await waitApi("GET", "/bootstrap");
  await page.getByText("sistema conectado").waitFor({ timeout: 45_000 });
  addTest("persistência/reload", "recarregar aplicação", "dados carregam novamente pela Oracle", "bootstrap 200 após reload", performance.now());

  const accountButton = page.locator("header button").filter({ hasText: email }).first();
  await accountButton.click();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await page.waitForURL(/\/login/);
  addTest("logout", "sair da sessão", "volta para /login", page.url(), performance.now());
} finally {
  for (const id of cleanupIds.tarefas) {
    await apiRequest(token, "POST", `/tarefas/${id}/arquivar`, {}, [200, 404]);
    await apiRequest(token, "DELETE", `/tarefas/${id}?permanent=true`, undefined, [200, 204, 404]);
  }
  for (const id of cleanupIds.lancamentos) await apiRequest(token, "DELETE", `/lancamentos/${id}`, undefined, [200, 404]);
  for (const id of cleanupIds.contratos) await apiRequest(token, "DELETE", `/contratos/${id}?cascade=true`, undefined, [200, 404]);
  for (const id of cleanupIds.processos) await apiRequest(token, "DELETE", `/processos/${id}`, undefined, [200, 404]);
  for (const id of cleanupIds.custos) await apiRequest(token, "DELETE", `/custos-fixos/${id}`, undefined, [200, 404]);
  for (const id of cleanupIds.parceiros) await apiRequest(token, "DELETE", `/parceiros/${id}`, undefined, [200, 404]);
  await screenshot("99-final-state").catch(() => {});
  await browser.close();
}

report.api_request_count = apiRequests.length;
report.api_request_sample = apiRequests.slice(-80);
report.completed_at = new Date().toISOString();
report.status = (
  report.tests.every((test) => test.status === "PASS")
  && report.unexpected_local_api_requests.length === 0
  && report.api_failures.length === 0
  && report.console_errors.length === 0
) ? "PASS" : "FAIL";

fs.writeFileSync(path.join(evidenceDir, "frontend-e2e-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  status: report.status,
  tests: report.tests.length,
  api_request_count: report.api_request_count,
  unexpected_local_api_requests: report.unexpected_local_api_requests.length,
  api_failures: report.api_failures.length,
  console_errors: report.console_errors.length,
  screenshots: report.screenshots,
}, null, 2));

if (report.status !== "PASS") process.exit(1);
