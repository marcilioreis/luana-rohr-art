import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import path from 'path';

// Carrega variáveis do .env.test (se existir) para ficarem disponíveis em process.env
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export const STORAGE_STATE = path.join(__dirname, '.auth/user.json');

export default defineConfig({
  testDir: './specs',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },

  projects: [
    // Projeto de setup (autenticação) – será executado uma vez
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // Testes que dependem de login de admin já realizado
    {
      name: 'authenticated',
      testMatch: ['admin.spec.ts'],
      dependencies: ['setup'],
      use: {
        storageState: STORAGE_STATE,  // reutiliza sessão
      },
    },
    // Testes que rodam sem autenticação (loja pública + auth)
    {
      name: 'public',
      testMatch: ['store.spec.ts', 'auth.spec.ts'],
    },
  ],

  webServer: [
    // Backend
    {
      command: 'cd ../backend && npm run dev',
      url: 'http://localhost:3000/health',
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
      env: {
        DATABASE_URL: process.env.DATABASE_URL!,
        REDIS_URL: process.env.REDIS_URL!,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
        BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
        NODE_ENV: 'test',
      },
    },
    // Frontend
    {
      command: 'cd ../frontend && npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
      env: {
        VITE_API_URL: 'http://localhost:3000',
      },
    },
  ],

  globalSetup: './global.setup.ts',
  globalTeardown: './global.teardown.ts',
});