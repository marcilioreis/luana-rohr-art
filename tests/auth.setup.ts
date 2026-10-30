import { test as setup, expect, request } from '@playwright/test';
import { STORAGE_STATE } from './playwright.config';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const BACKEND_URL = 'http://localhost:3000';

setup('realizar login e salvar sessão', async ({ page }) => {
  // 👇 Verificação rápida: a rota de login existe?
  const apiContext = await request.newContext({ baseURL: BACKEND_URL });
  const probeRes = await apiContext.post('/api/auth/sign-in/email', {
    data: { email: 'test@example.com', password: 'wrong' },
    failOnStatusCode: false,
  });
  console.log('🔍 Probe status:', probeRes.status());
  // Esperamos um erro 401 (credenciais inválidas) ou 400, não 404
  expect(probeRes.status()).not.toBe(404);
  await apiContext.dispose();

  // A partir daqui, fluxo normal de login via UI
  await page.goto('/login');
  await page.fill('[data-testid="login-email"]', ADMIN_EMAIL);
  await page.fill('[data-testid="login-password"]', ADMIN_PASSWORD);
  await page.click('[data-testid="login-submit"]');

  // O login recarrega para a home; aguardamos sair de /login
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));
  // Confirma acesso à área administrativa
  await page.goto('/admin');
  await expect(page.getByText('Painel')).toBeVisible();
  await page.context().storageState({ path: STORAGE_STATE });
});