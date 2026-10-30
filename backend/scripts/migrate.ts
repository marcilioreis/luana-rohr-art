import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL is not defined');
    process.exit(1);
  }

  const sql = postgres(connectionString, { 
    max: 1,
    ssl: connectionString.includes('localhost') ? false : 'require' 
  });
  
  const db = drizzle(sql);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const migrationsFolder = path.resolve(__dirname, '../drizzle');
  const journalPath = path.join(migrationsFolder, 'meta/_journal.json');

  console.log('🚀 Checking database migration state...');

  try {
    // 1. Garantir que o schema e a tabela de migrações existam
    await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
    await sql`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `;

    // 2. Verificar se o histórico está vazio
    const appliedCountResult = await sql`SELECT count(*) FROM drizzle.__drizzle_migrations`;
    const appliedCount = parseInt(appliedCountResult[0].count);

    if (appliedCount === 0) {
      // Verificar se as tabelas principais já existem no schema public
      const tableCheck = await sql`
        SELECT count(*) FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name IN ('products', 'orders', 'user')
      `;
      
      if (parseInt(tableCheck[0].count) > 0) {
        console.log('⚠️ Database tables exist but migration history is empty. Synchronizing...');
        
        if (fs.existsSync(journalPath)) {
          const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
          for (const entry of journal.entries) {
            await sql`
              INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
              VALUES (${entry.tag}, ${entry.when})
              ON CONFLICT (hash) DO NOTHING
            `;
            console.log(`✅ Synced: ${entry.tag}`);
          }
          console.log('✨ Synchronization complete!');
        } else {
          console.warn('⚠️ Journal file not found, skipping sync.');
        }
      }
    }

    // 3. Executar as migrações pendentes normalmente
    console.log('📦 Running pending migrations...');
    await migrate(db, { migrationsFolder });
    console.log('✅ All migrations are up to date!');

  } catch (error) {
    console.error('❌ Migration process failed!');
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();

// Manual update for city conversion if needed locally
// But since we use npm run migrate, it will use the sql file.
