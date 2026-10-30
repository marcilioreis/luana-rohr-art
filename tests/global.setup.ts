import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import path from 'path';
import postgres from 'postgres';

async function globalSetup() {
  // Carrega variáveis do .env.test (se existir)
  dotenv.config({ path: path.resolve(__dirname, '.env.test') });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL não definida');

  // 1. Recriar banco de dados de teste
  const dbUrl = new URL(databaseUrl);
  const dbName = dbUrl.pathname.slice(1);
  dbUrl.pathname = '/postgres';
  const adminSql = postgres(dbUrl.toString(), { max: 1 });
  try {
    await adminSql`DROP DATABASE IF EXISTS ${adminSql(dbName)}`;
    await adminSql`CREATE DATABASE ${adminSql(dbName)}`;
    console.log(`✅ Banco '${dbName}' recriado.`);
  } finally {
    await adminSql.end();
  }

  // 2. Executar migrações (inclui a view orders_enriched)
  console.log('🔧 Executando migrações (tsx scripts/migrate.ts)...');
  const backendDir = path.resolve(__dirname, '..', 'backend');
  execSync('npx tsx scripts/migrate.ts', {
    cwd: backendDir,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });

  // 3. Verificar tabelas + a view orders_enriched
  const checkSql = postgres(databaseUrl, { max: 1 });
  try {
    const tables = await checkSql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('permissions', 'products', 'orders')
    `;
    if (tables.length < 3) {
      throw new Error('Migrações não criaram as tabelas esperadas (products/orders).');
    }
    const views = await checkSql`
      SELECT table_name FROM information_schema.views
      WHERE table_schema = 'public' AND table_name = 'orders_enriched'
    `;
    if (views.length < 1) {
      throw new Error('A view orders_enriched não foi criada.');
    }
    console.log('✅ Tabelas e view orders_enriched existem.');
  } finally {
    await checkSql.end();
  }

  // 4. Executar seed
  console.log('🌱 Executando seed...');
  execSync('npx tsx scripts/seed.ts', {
    cwd: backendDir,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
}

export default globalSetup;