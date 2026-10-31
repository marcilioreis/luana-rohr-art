import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
  max: 20, // conexões máximas no pool
  idle_timeout: 30, // segundos
  connect_timeout: 10,
  ssl: connectionString.includes('localhost') ? false : 'require',
});
export const db = drizzle(client, { schema });
