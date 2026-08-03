import { expect, test } from "@playwright/test";

const email = process.env.SUPABASE_TEST_EMAIL;
const password = process.env.SUPABASE_TEST_PASSWORD;

const protectedViews = [
  "Painel",
  "Importação",
  "Contratos",
  "Parcelas",
  "Parceiros",
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

test.describe("Protected production views", () => {
  test.skip(!email || !password, "SUPABASE_TEST_EMAIL and SUPABASE_TEST_PASSWORD are required for protected route validation");

  test("loads every planned protected view through FastAPI", async ({ page }) => {
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    await login(page);
    for (const heading of protectedViews) {
      await page.getByRole("button", { name: heading }).click();
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
      await expect(page.getByRole("main")).toBeVisible();
    }

    expect(consoleErrors).toEqual([]);
  });
});
