import { test, expect } from '@playwright/test';
import { adminApi } from '../utis/api';

type ManageProduct = { id: number; name: string; slug: string; active: boolean };

async function activeProducts(): Promise<{ api: Awaited<ReturnType<typeof adminApi>>; list: ManageProduct[] }> {
  const api = await adminApi();
  const res = await api.get('/api/products/manage');
  const list = ((await res.json()) as ManageProduct[]).filter((p) => p.active);
  return { api, list };
}

// A curadoria altera dados; rodamos em série e limpamos ao final de cada teste.
test.describe.serial('Produtos relacionados', () => {
  test('PDP exibe a seção de relacionados (fallback automático)', async ({ page }) => {
    const { api, list } = await activeProducts();
    await api.dispose();
    test.skip(list.length < 2, 'Precisa de ao menos 2 produtos ativos semeados');

    await page.goto(`/produto/${list[0].slug}`);
    const grid = page.getByTestId('related-grid');
    await expect(grid).toBeVisible();
    // Pelo fallback, há ao menos um card de outra obra (espera o fetch resolver).
    await expect(grid.getByRole('link').first()).toBeVisible();
  });

  test('relação manual aparece primeiro e é bidirecional', async ({ page }) => {
    const { api, list } = await activeProducts();
    test.skip(list.length < 2, 'Precisa de ao menos 2 produtos ativos semeados');
    const [a, b] = list;

    // Fixa b como relacionado de a.
    const put = await api.put(`/api/products/manage/${a.id}/related`, {
      data: { relatedIds: [b.id] },
    });
    expect(put.status()).toBe(200);

    // PDP de a mostra b.
    await page.goto(`/produto/${a.slug}`);
    await expect(
      page.getByTestId('related-grid').locator(`a[href="/produto/${b.slug}"]`)
    ).toBeVisible();

    // Bidirecional: PDP de b mostra a.
    await page.goto(`/produto/${b.slug}`);
    await expect(
      page.getByTestId('related-grid').locator(`a[href="/produto/${a.slug}"]`)
    ).toBeVisible();

    // Limpa.
    await api.put(`/api/products/manage/${a.id}/related`, { data: { relatedIds: [] } });
    await api.dispose();
  });

  test('admin adiciona e salva um relacionado pela UI', async ({ page }) => {
    const { api, list } = await activeProducts();
    test.skip(list.length < 2, 'Precisa de ao menos 2 produtos ativos semeados');
    const [target, other] = list;

    await page.goto(`/admin/produtos/${target.id}/editar`);
    const section = page
      .getByRole('heading', { name: 'Produtos relacionados' })
      .locator('xpath=ancestor::div[1]');
    await expect(section).toBeVisible();

    await section.getByTestId('related-add').selectOption(String(other.id));
    await expect(section.getByTestId('related-selected')).toContainText(other.name);

    await section.getByTestId('related-save').click();
    await expect(page.getByText(/Produtos relacionados salvos/i)).toBeVisible();

    // Persistiu no backend.
    const check = await api.get(`/api/products/manage/${target.id}/related`);
    const saved = (await check.json()) as ManageProduct[];
    expect(saved.map((p) => p.id)).toContain(other.id);

    // Limpa.
    await api.put(`/api/products/manage/${target.id}/related`, { data: { relatedIds: [] } });
    await api.dispose();
  });
});
