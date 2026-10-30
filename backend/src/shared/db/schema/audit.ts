// src/shared/db/schema/audit.ts
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  jsonb,
  timestamp,
  inet,
} from 'drizzle-orm/pg-core';
import { user } from './auth.js';

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }),
  entityId: integer('entity_id'),
  details: jsonb('details'),
  ip: inet('ip'),
  createdAt: timestamp('created_at').defaultNow(),
});
