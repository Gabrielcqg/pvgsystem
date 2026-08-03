import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const email = process.env.SUPABASE_TEST_EMAIL;
const password = process.env.SUPABASE_TEST_PASSWORD;

async function fillLogin(page, nextEmail = email, nextPassword = password) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(nextEmail);
  await page.getByRole("textbox", { name: "Senha" }).fill(nextPassword);
  await page.getByRole("button", { name: "Entrar" }).click();
}

async function expectNoA11yViolations(page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
}

test.describe("Supabase Auth to FastAPI", () => {
  test.skip(!email || !password, "SUPABASE_TEST_EMAIL and SUPABASE_TEST_PASSWORD are required for the real auth flow");

  test("logs in and loads member-only dashboard through FastAPI", async ({ page, request }) => {
    const apiUrl = (process.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
    const health = await request.get(`${apiUrl}/health`);
    expect(health.ok()).toBe(true);

    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    await fillLogin(page);

    await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();
    await expect(page.getByText("sistema conectado")).toBeVisible();
    await expectNoA11yViolations(page);
    await page.getByRole("button", { name: "Contratos" }).click();
    await expect(page.getByRole("heading", { name: "Contratos" })).toBeVisible();
    await expectNoA11yViolations(page);

    expect(consoleErrors).toEqual([]);
  });

  test("shows a clear message for invalid credentials", async ({ page }) => {
    const authResponses = [];
    page.on("response", (response) => {
      if (response.url().includes("/auth/v1/token")) authResponses.push(response.status());
    });

    await fillLogin(page, email, `${password}-invalid`);

    await expect(page.getByRole("alert")).toContainText("Credenciais incorretas");
    expect(authResponses.some((status) => status >= 400)).toBe(true);
  });

  test("requests a real recovery email through Supabase Auth", async ({ page }) => {
    const recoveryEmail = process.env.SUPABASE_RECOVERY_TEST_EMAIL || email.replace("@", `+reset-${Date.now()}@`);
    const recoverResponse = page.waitForResponse((response) => response.url().includes("/auth/v1/recover"));

    await page.goto("/redefinir-senha");
    await page.getByLabel("Email").fill(recoveryEmail);
    await page.getByRole("button", { name: "Enviar link de recuperacao" }).click();

    const response = await recoverResponse;
    if (response.status() === 429) {
      await expect(page.getByRole("alert")).toContainText("Muitas solicitacoes recentes");
      return;
    }
    expect(response.ok()).toBe(true);
    await expect(page.getByRole("status")).toContainText("link seguro");
  });

  test("shows the new-password screen separately when no recovery link is active", async ({ page }) => {
    await page.goto("/definir-nova-senha");

    await expect(page.getByRole("heading", { name: "Definir nova senha" })).toBeVisible();
    await expect(page.getByRole("alert")).toContainText("Link expirado ou ausente");
    await expect(page.getByRole("link", { name: "Solicitar novo link" })).toBeVisible();
  });

  test("logs out and starts a new authenticated session", async ({ page }) => {
    await fillLogin(page);
    await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();

    await page.getByRole("button", { name: new RegExp(email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).click();
    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page.getByRole("heading", { name: "Bom te ver de volta" })).toBeVisible();

    await fillLogin(page);
    await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();
  });
});
