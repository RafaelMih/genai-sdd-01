import { expect, test } from "@playwright/test";

const pokemonListResponse = {
  results: [
    { name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" },
    { name: "ivysaur", url: "https://pokeapi.co/api/v2/pokemon/2/" },
  ],
};

async function mockPokemonApi(page: Parameters<typeof test>[0]["page"]) {
  await page.route("https://pokeapi.co/api/v2/pokemon?limit=20&offset=0", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(pokemonListResponse),
    });
  });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await mockPokemonApi(page);
});

test("signup cria conta e redireciona para o dashboard", async ({ page }) => {
  await page.goto("/signup");

  await page.getByLabel("Nome").fill("Ash Ketchum");
  await page.getByLabel("E-mail").fill("ash@test.com");
  await page.locator("#password").fill("pikachu123");
  await page.locator("#confirmPassword").fill("pikachu123");
  await page.getByLabel("Telefone").fill("+5511999999999");
  await page.getByRole("button", { name: "Criar conta" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Dashboard")).toBeVisible();
  await expect(page.getByText("Bulbasaur")).toBeVisible();
});

test("login valido redireciona para o dashboard", async ({ page }) => {
  await page.goto("/signup");

  await page.getByLabel("Nome").fill("Misty");
  await page.getByLabel("E-mail").fill("misty@test.com");
  await page.locator("#password").fill("starmie123");
  await page.locator("#confirmPassword").fill("starmie123");
  await page.getByRole("button", { name: "Criar conta" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByTestId("logout-button").click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("E-mail").fill("misty@test.com");
  await page.locator("#password").fill("starmie123");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Ivysaur")).toBeVisible();
});

test("logout redireciona para login e bloqueia retorno ao dashboard", async ({ page }) => {
  await page.goto("/signup");

  await page.getByLabel("Nome").fill("Brock");
  await page.getByLabel("E-mail").fill("brock@test.com");
  await page.locator("#password").fill("onix1234");
  await page.locator("#confirmPassword").fill("onix1234");
  await page.getByRole("button", { name: "Criar conta" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByTestId("logout-button").click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goBack();
  await expect(page).not.toHaveURL(/\/dashboard$/);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
});
