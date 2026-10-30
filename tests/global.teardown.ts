// tests/global.teardown.ts
import { execSync } from 'child_process';
import path from 'path';

async function globalTeardown() {
  const backendDir = path.resolve(__dirname, '..', 'backend');
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL não definida para o ambiente de teste');
  }

  console.log('🧹 Limpando banco de teste...');
  execSync(
    `psql $DATABASE_URL -c "TRUNCATE orders, order_items, products, product_variants, product_images CASCADE;"`,
    {
      cwd: backendDir,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'inherit',
    }
  );
}

export default globalTeardown;