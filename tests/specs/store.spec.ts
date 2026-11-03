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

  test('checkout como convidado gera PIX em página pública reabrível', async ({ page }) => {
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
    await expect(page).toHaveURL('/checkout');

    // Sem sessão, o checkout oferece a escolha: entrar ou seguir como convidado
    await expect(page.getByTestId('checkout-login')).toBeVisible();
    await page.getByTestId('checkout-guest').click();

    // Preenche os dados do convidado
    await page.getByTestId('co-name').fill('Convidada Teste');
    await page.getByTestId('co-email').fill('convidada@example.com');
    await page.getByTestId('co-cep').fill('01001-000');
    await page.getByTestId('co-street').fill('Praça da Sé');
    await page.getByTestId('co-number').fill('100');
    await page.getByTestId('co-district').fill('Sé');
    await page.getByTestId('co-city').fill('São Paulo');
    // Preencher a UF e sair do campo dispara a cotação de frete (server-side).
    await page.getByTestId('co-state').fill('SP');
    await page.getByTestId('co-state').blur();

    // Frete calculado no servidor (SP = Sudeste) e botão habilitado.
    await expect(page.getByTestId('shipping-fee')).toHaveText(/R\$/);
    const placeOrder = page.getByTestId('place-order');
    await expect(placeOrder).toBeEnabled();
    await placeOrder.click();

    // Cai na página pública do pedido com o QR do PIX
    await expect(page).toHaveURL(/\/pedido\/.+/);
    await expect(page.getByTestId('pix-qrcode')).toBeVisible();
    await expect(page.getByTestId('pix-payload')).not.toHaveValue('');

    // Convidado vê o link persistente para reabrir o pedido
    const trackUrl = await page.getByTestId('track-link').inputValue();
    const orderUrl = page.url();

    // Reabrir a URL numa nova aba mostra o mesmo pedido
    const newPage = await page.context().newPage();
    await newPage.goto(orderUrl);
    await expect(newPage.getByTestId('pix-qrcode')).toBeVisible();
    await expect(newPage.getByTestId('pix-payload')).not.toHaveValue('');
    expect(trackUrl).toContain(orderUrl.split('/pedido/')[1]);
    await newPage.close();
  });

  test('checkout como convidado com retirada (sem custo, sem endereço)', async ({ page }) => {
    await page.goto('/loja');
    await page.getByTestId('product-grid').getByRole('link').first().click();
    await page.getByTestId(/^color-/).first().click();
    await page.getByTestId(/^size-/).first().click();
    await page.getByTestId('add-to-cart').click();
    await expect(page.getByText(/Adicionado ao carrinho/i)).toBeVisible();

    await page.getByTestId('cart-icon').click();
    await page.getByTestId('checkout-button').click();
    await page.getByTestId('checkout-guest').click();

    // Dados mínimos (sem endereço) e seleção de retirada
    await page.getByTestId('co-name').fill('Retirada Convidada');
    await page.getByTestId('co-email').fill('retirada@example.com');
    await page.getByTestId('delivery-retirada').click();

    // Aviso de agendamento aparece e o campo de CEP some
    await expect(page.getByTestId('pickup-notice')).toBeVisible();
    await expect(page.getByTestId('co-cep')).toHaveCount(0);
    // Frete grátis e botão habilitado mesmo sem CEP
    await expect(page.getByTestId('shipping-fee')).toHaveText(/Grátis/i);

    const placeOrder = page.getByTestId('place-order');
    await expect(placeOrder).toBeEnabled();
    await placeOrder.click();

    // Página do pedido mostra o PIX e o aviso de retirada
    await expect(page).toHaveURL(/\/pedido\/.+/);
    await expect(page.getByTestId('pix-qrcode')).toBeVisible();
    await expect(page.getByTestId('pickup-notice')).toBeVisible();
  });
});
