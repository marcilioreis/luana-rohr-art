import { test, expect } from '@playwright/test';

// Fluxo público da loja: Home → Sobre → PLP → PDP → carrinho → checkout (redireciona p/ login)
test.describe('Loja pública', () => {
  test('home exibe destaques e navega para a loja', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /arte autoral/i })).toBeVisible();
    await page.getByRole('link', { name: 'Ver a loja' }).click();
    await expect(page).toHaveURL('/loja');
    await expect(page.getByTestId('product-grid')).toBeVisible();
  });

  test('página Sobre carrega', async ({ page }) => {
    await page.goto('/sobre');
    await expect(page.getByRole('heading', { name: /Sobre a artista/i })).toBeVisible();
  });

  test('PLP lista produtos e abre a PDP', async ({ page }) => {
    await page.goto('/loja');
    const firstCard = page.getByTestId('product-grid').getByRole('link').first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/produto\//);
    await expect(page.getByTestId('add-to-cart')).toBeVisible();
  });

  test('adiciona ao carrinho e abre o checkout (exige login)', async ({ page }) => {
    await page.goto('/loja');
    await page.getByTestId('product-grid').getByRole('link').first().click();
    // Seleciona primeira cor e primeiro tamanho disponíveis
    await page.getByTestId(/^color-/).first().click();
    await page.getByTestId(/^size-/).first().click();
    await page.getByTestId('add-to-cart').click();
    await expect(page.getByText(/Adicionado ao carrinho/i)).toBeVisible();

    // Abre o carrinho e vai para o checkout
    await page.getByTestId('cart-icon').click();
    await page.getByTestId('checkout-button').click();
    // Sem sessão, o checkout redireciona para login
    await expect(page).toHaveURL('/login');
  });
});
