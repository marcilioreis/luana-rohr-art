import { test, expect, request } from '@playwright/test';
import { adminApi } from '../utis/api';

const ORIGIN = 'http://localhost:5173';

// Cria um pedido via API e retorna o id (admin também é um cliente autenticado válido).
async function createOrder(): Promise<number> {
  const api = await adminApi();
  const prodRes = await api.get('/api/products');
  const products = (await prodRes.json()) as Array<{ slug: string }>;
  const pdp = await api.get(`/api/products/${products[0].slug}`);
  const product = (await pdp.json()) as { variants: Array<{ id: number }> };
  const variantId = product.variants[0].id;

  const res = await api.post('/api/orders', {
    data: {
      items: [{ variantId, quantity: 1 }],
      customer: { name: 'Cliente E2E', email: 'e2e@teste.com' },
      shippingAddress: {
        cep: '01001000',
        street: 'Praça da Sé',
        number: '1',
        district: 'Sé',
        city: 'São Paulo',
        state: 'SP',
      },
      shippingFee: 10,
    },
  });
  expect(res.status()).toBe(201);
  const order = (await res.json()) as { id: number; pixPayload: string };
  expect(order.pixPayload).toContain('br.gov.bcb.pix');
  await api.dispose();
  return order.id;
}

test.describe('Administração', () => {
  test('painel e listas carregam', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByText('Painel')).toBeVisible();
    await page.goto('/admin/produtos');
    await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible();
    await page.goto('/admin/pedidos');
    await expect(page.getByRole('heading', { name: 'Pedidos' })).toBeVisible();
  });

  test('confirmar pagamento muda status para Pago e permite avançar para Enviado', async ({
    page,
  }) => {
    const orderId = await createOrder();
    await page.goto(`/admin/pedidos/${orderId}`);

    await expect(page.getByText('Aguardando pagamento')).toBeVisible();
    await page.getByTestId('transition-pago').click();
    await expect(page.getByText('Pago')).toBeVisible();

    await page.getByTestId('transition-enviado').click();
    await expect(page.getByText('Enviado')).toBeVisible();
  });

  test('relatórios de vendas carregam', async ({ page }) => {
    await page.goto('/admin/relatorios');
    await expect(page.getByRole('heading', { name: /Relatórios de vendas/i })).toBeVisible();
    await expect(page.getByText('Faturamento')).toBeVisible();
  });

  test('RBAC: cliente comum recebe 403 em rotas administrativas', async () => {
    const email = `cli${Date.now()}@teste.com`;
    const ctx = await request.newContext({ baseURL: 'http://localhost:3000' });
    await ctx.post('/api/auth/sign-up/email', {
      headers: { Origin: ORIGIN },
      data: { email, password: 'cliente12345', name: 'Cliente' },
    });
    const signIn = await ctx.post('/api/auth/sign-in/email', {
      headers: { Origin: ORIGIN },
      data: { email, password: 'cliente12345' },
    });
    const token = signIn.headers()['set-auth-token'];
    const authed = await request.newContext({
      baseURL: 'http://localhost:3000',
      extraHTTPHeaders: { Authorization: `Bearer ${token}`, Origin: ORIGIN },
    });

    const ordersList = await authed.get('/api/orders'); // admin-only
    expect(ordersList.status()).toBe(403);
    const createProduct = await authed.post('/api/products', {
      data: { name: 'x', basePrice: 10 },
    });
    expect(createProduct.status()).toBe(403);
    const mine = await authed.get('/api/orders/mine'); // permitido
    expect(mine.status()).toBe(200);

    await ctx.dispose();
    await authed.dispose();
  });
});
