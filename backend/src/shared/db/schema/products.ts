// src/shared/db/schema/products.ts
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  doublePrecision,
} from 'drizzle-orm/pg-core';
import { user } from './auth.js';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

// ========== PRODUTOS (camisetas) ==========
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 120 }).unique().notNull(),
  description: text('description'),
  basePrice: doublePrecision('base_price').notNull(),
  active: boolean('active').default(true).notNull(),
  // Estilo visual / tags opcionais (ex.: coleção, material) em JSON
  customStyle: jsonb('custom_style'),
  tags: jsonb('tags'),
  createdBy: text('created_by').references(() => user.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// Variante = unidade vendável (tamanho/cor) com estoque próprio
export const productVariants = pgTable('product_variants', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  size: varchar('size', { length: 20 }).notNull(),
  color: varchar('color', { length: 40 }).notNull(),
  sku: varchar('sku', { length: 60 }).unique(),
  // Preço opcional que sobrescreve o basePrice do produto
  price: doublePrecision('price'),
  stock: integer('stock').default(0).notNull(),
  active: boolean('active').default(true).notNull(),
});

export const productImages = pgTable('product_images', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  // URL pública ou key do StorageProvider
  url: text('url').notNull(),
  key: varchar('key', { length: 255 }),
  alt: varchar('alt', { length: 200 }),
  order: integer('order').default(0),
});

// Tipos inferidos
export type Product = InferSelectModel<typeof products>;
export type InsertProduct = InferInsertModel<typeof products>;
export type ProductVariant = InferSelectModel<typeof productVariants>;
export type InsertProductVariant = InferInsertModel<typeof productVariants>;
export type ProductImage = InferSelectModel<typeof productImages>;
export type InsertProductImage = InferInsertModel<typeof productImages>;
