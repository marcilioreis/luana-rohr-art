// tests/global.teardown.ts
import postgres from 'postgres';

async function globalTeardown() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL não definida para o ambiente de teste');
  }

  console.log('🧹 Limpando banco de teste...');
  const sql = postgres(databaseUrl, { max: 1 });
  try {
    await sql`TRUNCATE orders, order_items, products, product_variants, product_images CASCADE`;
  } finally {
    await sql.end();
  }
}

export default globalTeardown;
