// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carrega explicitamente o arquivo .env da raiz do backend
// Só carrega .env se a variável ainda não existir (ex.: ambiente de CI/teste já a define)
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, '.env') });
}

if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL não está definida no .env');
}

export default defineConfig({
  schema: './src/shared/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});