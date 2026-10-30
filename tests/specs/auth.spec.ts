import { test, expect } from '@playwright/test';

test.describe('Autenticação', () => {
  test('tela de login é exibida', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();
  });

  test('cadastro de novo cliente redireciona para a loja', async ({ page }) => {
    const email = `cliente${Date.now()}@teste.com`;
    await page.goto('/register');
    await page.fill('[data-testid="register-name"]', 'Cliente Novo');
    await page.fill('[data-testid="register-email"]', email);
    await page.fill('[data-testid="register-password"]', 'cliente12345');
    await page.fill('[data-testid="register-confirm-password"]', 'cliente12345');
    await page.click('[data-testid="register-submit"]');

    // Após cadastro, recarrega na home
    await page.waitForURL((url) => url.pathname === '/');
    await expect(page).toHaveURL('/');
  });

  test('credenciais inválidas mostram erro', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'naoexiste@teste.com');
    await page.fill('[data-testid="login-password"]', 'senhaerrada');
    await page.click('[data-testid="login-submit"]');
    await expect(page.getByTestId('login-error')).toBeVisible();
  });
});
