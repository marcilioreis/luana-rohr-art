import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

const client = postgres(process.env.DATABASE_URL!, {
  max: 20, // conexões máximas no pool
  idle_timeout: 30, // segundos
  connect_timeout: 10,
});
export const db = drizzle(client, { schema });
