import { expect, test } from "@playwright/test";

const email = process.env.SUPABASE_TEST_EMAIL;
const password = process.env.SUPABASE_TEST_PASSWORD;
const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const supabaseAnon =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";
const apiUrl = (process.env.VITE_API_URL || "http://127.0.0.1:8010").replace(/\/+$/, "");

async function login(page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Senha" }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();
}

async function getToken(request) {
  const response = await request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    headers: { apikey: supabaseAnon },
    data: { email, password, gotrue_meta_security: {} },
  });
  expect(response.ok(), `Supabase token request failed with status ${response.status()}`).toBeTruthy();
  const body = await response.json();
  return body.access_token;
}

async function api(request, token, method, route, data) {
  return request.fetch(`${apiUrl}${route}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    data,
  });
}

async function listTasks(request, token, title, includeArchived = false) {
  const archived = includeArchived ? "&include_archived=true" : "";
  const response = await api(request, token, "GET", `/tarefas?titulo=${encodeURIComponent(title)}${archived}`);
  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function firstTask(request, token, title, includeArchived = false) {
  const rows = await listTasks(request, token, title, includeArchived);
  return rows[0] || null;
}

test.describe("Tarefas Kanban", () => {
  test.setTimeout(180_000);
  test.skip(!email || !password || !supabaseUrl || !supabaseAnon, "Real Supabase auth env is required");

  test("moves tasks optimistically, persists status, focuses a board, and archives without reload", async ({ page, request }) => {
    const token = await getToken(request);
    const title = `E2E_TEST_KANBAN_${Date.now()}`;
    let createdId = "";

    try {
      await login(page);
      await page.getByRole("button", { name: "Tarefas", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Tarefas" })).toBeVisible();
      await expect(page.getByText("KANBAN", { exact: true })).toBeVisible();
      await expect(page.getByRole("region", { name: /^Quadro / })).toHaveCount(4);
      await expect(page.getByRole("button", { name: /^lista$/i })).toHaveCount(0);

      await page.getByRole("button", { name: "+ Nova tarefa" }).click();
      await page.getByRole("textbox", { name: "TÍTULO DA TAREFA", exact: true }).fill(title);
      await page.getByRole("textbox", { name: "RESPONSÁVEL", exact: true }).fill("E2E");
      await page.getByRole("button", { name: "Salvar tarefa" }).click();

      await expect.poll(async () => (await firstTask(request, token, title))?.id || "", { timeout: 45_000 }).not.toBe("");
      createdId = (await firstTask(request, token, title)).id;

      const backlog = page.getByRole("region", { name: "Quadro Backlog" });
      const todo = page.getByRole("region", { name: "Quadro A fazer" });
      const doing = page.getByRole("region", { name: "Quadro Em andamento" });
      const card = page.locator(".row").filter({ hasText: title }).first();

      await expect(todo.locator(".row").filter({ hasText: title }).first()).toBeVisible();
      const visualStart = Date.now();
      const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
      await card.dispatchEvent("dragstart", { dataTransfer });
      await doing.dispatchEvent("dragenter", { dataTransfer });
      await doing.dispatchEvent("dragover", { dataTransfer });
      await doing.dispatchEvent("drop", { dataTransfer });
      await expect(doing.locator(".row").filter({ hasText: title }).first()).toBeVisible({ timeout: 1000 });
      expect(Date.now() - visualStart).toBeLessThan(1000);

      await expect.poll(async () => (await firstTask(request, token, title))?.status || "", { timeout: 45_000 }).toBe("em_andamento");

      await doing.getByRole("button", { name: "foco" }).click();
      await expect(page.getByText("Foco em Em andamento")).toBeVisible();
      await expect(page.getByRole("region", { name: /^Quadro / })).toHaveCount(1);
      await expect(doing.locator(".row").filter({ hasText: title }).first()).toBeVisible();
      await page.getByRole("button", { name: "Sair do foco" }).click();
      await expect(page.getByRole("region", { name: /^Quadro / })).toHaveCount(4);

      const done = page.getByRole("region", { name: "Quadro Concluída" });
      const completeStart = Date.now();
      await page.locator(".row").filter({ hasText: title }).first().locator('input[type="checkbox"]').first().click();
      await expect(page.getByText("Foco em Concluída")).toBeVisible({ timeout: 1000 });
      await expect(done.locator(".row").filter({ hasText: title }).first()).toBeVisible({ timeout: 1000 });
      await expect(done.locator(".row").filter({ hasText: title }).first().locator('input[type="checkbox"]').first()).toBeChecked({ timeout: 1000 });
      expect(Date.now() - completeStart).toBeLessThan(1000);
      await expect.poll(async () => (await firstTask(request, token, title))?.status || "", { timeout: 45_000 }).toBe("concluida");

      await page.getByRole("button", { name: "Filtrar por concluídas" }).click();
      await expect(page.getByText("Foco em Concluída")).toBeVisible({ timeout: 1000 });
      await expect(done.locator(".row").filter({ hasText: title }).first()).toBeVisible({ timeout: 1000 });

      const reopenStart = Date.now();
      await done.locator(".row").filter({ hasText: title }).first().locator('input[type="checkbox"]').first().click();
      await expect(page.getByText("Foco em A fazer")).toBeVisible({ timeout: 1000 });
      await expect(todo.locator(".row").filter({ hasText: title }).first()).toBeVisible({ timeout: 1000 });
      expect(Date.now() - reopenStart).toBeLessThan(1000);
      await expect.poll(async () => (await firstTask(request, token, title))?.status || "", { timeout: 45_000 }).toBe("a_fazer");

      await todo.locator(".row").filter({ hasText: title }).first().locator('input[type="checkbox"]').first().click();
      await expect(done.locator(".row").filter({ hasText: title }).first()).toBeVisible({ timeout: 1000 });
      await expect.poll(async () => (await firstTask(request, token, title))?.status || "", { timeout: 45_000 }).toBe("concluida");

      await page.locator(".row").filter({ hasText: title }).first().getByRole("button", { name: "arquivar" }).click();
      await expect(page.locator(".row").filter({ hasText: title }).first()).toBeHidden({ timeout: 1000 });
      await expect.poll(async () => Boolean((await firstTask(request, token, title, true))?.archived_at), { timeout: 45_000 }).toBe(true);

      await page.getByRole("button", { name: "Arquivadas" }).click();
      await expect(page.getByText("Foco em Concluída")).toBeVisible({ timeout: 1000 });
      await expect(page.locator(".row").filter({ hasText: title }).first()).toBeVisible({ timeout: 45_000 });
      await page.locator(".row").filter({ hasText: title }).first().getByRole("button", { name: "restaurar" }).click();
      await expect.poll(async () => Boolean((await firstTask(request, token, title, true))?.archived_at), { timeout: 45_000 }).toBe(false);

      await page.getByRole("button", { name: "Filtrar por ativas" }).click();
      await expect(backlog).toBeVisible();
    } finally {
      if (createdId) {
        await api(request, token, "DELETE", `/tarefas/${createdId}?permanent=true`).catch(() => {});
      }
    }
  });
});
