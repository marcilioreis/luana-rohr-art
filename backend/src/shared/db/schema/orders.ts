// src/shared/db/schema/orders.ts
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  jsonb,
  timestamp,
  doublePrecision,
} from 'drizzle-orm/pg-core';
import { user } from './auth.js';
import { products, productVariants } from './products.js';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

// Status do pedido — ARMAZENADO (workflow real persistido na coluna status).
// aguardando_pagamento → pago → enviado → entregue | cancelado
export const ORDER_STATUSES = [
  'aguardando_pagamento',
  'pago',
  'enviado',
  'entregue',
  'cancelado',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: varchar('order_number', { length: 30 }).unique().notNull(),
  // Cliente autenticado (nullable permite checkout de convidado no futuro)
  customerId: text('customer_id').references(() => user.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 30 }).default('aguardando_pagamento').notNull(),
  subtotal: doublePrecision('subtotal').notNull(),
  shippingFee: doublePrecision('shipping_fee').default(0).notNull(),
  total: doublePrecision('total').notNull(),
  // PIX "copia e cola" (payload EMV) + txid
  pixPayload: text('pix_payload'),
  pixTxid: varchar('pix_txid', { length: 40 }),
  // Snapshot dos dados do cliente no momento da compra
  customerName: varchar('customer_name', { length: 150 }).notNull(),
  customerEmail: varchar('customer_email', { length: 150 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 30 }),
  // Endereço de entrega (jsonb: cep, street, number, complement, district, city, state)
  shippingAddress: jsonb('shipping_address'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  paidAt: timestamp('paid_at'),
  shippedAt: timestamp('shipped_at'),
  deliveredAt: timestamp('delivered_at'),
  cancelledAt: timestamp('cancelled_at'),
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
  variantId: integer('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
  // Snapshots para preservar o histórico mesmo se o produto mudar/for removido
  productName: varchar('product_name', { length: 200 }).notNull(),
  variantLabel: varchar('variant_label', { length: 80 }),
  unitPrice: doublePrecision('unit_price').notNull(),
  quantity: integer('quantity').notNull(),
  lineTotal: doublePrecision('line_total').notNull(),
});

// Tipos inferidos
export type Order = InferSelectModel<typeof orders>;
export type InsertOrder = InferInsertModel<typeof orders>;
export type OrderItem = InferSelectModel<typeof orderItems>;
export type InsertOrderItem = InferInsertModel<typeof orderItems>;
