// src/modules/products/products.service.ts
import { eq, and, or, desc, asc, ilike, inArray, sql } from 'drizzle-orm';
import { db } from '../../shared/db/index.js';
import {
  products,
  productVariants,
  productImages,
  productRelated,
  collections,
} from '../../shared/db/schema/products.js';
import type {
  InsertProduct,
  InsertProductVariant,
  InsertProductImage,
} from '../../shared/db/schema/products.js';
import { cached, cacheDel } from '../../shared/redis/cache.js';
import { pickRelatedIds } from './related.logic.js';

// Quantas peças a seção "Produtos relacionados" exibe (configurável via env).
const RELATED_LIMIT = Math.max(1, parseInt(process.env.RELATED_PRODUCTS_LIMIT ?? '4', 10) || 4);
const RELATED_CACHE_TTL = 60;

// ========== COLEÇÕES ==========
export const listCollections = async () =>
  db
    .select()
    .from(collections)
    .where(eq(collections.active, true))
    .orderBy(asc(collections.sortOrder), asc(collections.id));

const resolveCollectionId = async (slug: string): Promise<number | null> => {
  const [row] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(eq(collections.slug, slug));
  return row?.id ?? null;
};

export const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 110);

const ensureUniqueSlug = async (base: string, ignoreId?: number): Promise<string> => {
  const slug = base || 'produto';
  let candidate = slug;
  let i = 1;
  // Tenta sufixos numéricos até achar um slug livre
  for (;;) {
    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, candidate));
    if (!existing || existing.id === ignoreId) return candidate;
    i += 1;
    candidate = `${slug}-${i}`;
  }
};

export interface ProductListFilters {
  search?: string;
  collection?: string;
  active?: boolean;
  limit?: number;
  offset?: number;
}

// ========== LEITURA PÚBLICA (PLP/PDP) ==========
export const listPublic = async (filters: ProductListFilters = {}) => {
  const limit = filters.limit ?? 24;
  const offset = filters.offset ?? 0;
  const conditions = [eq(products.active, true)];
  if (filters.search) {
    conditions.push(ilike(products.name, `%${filters.search}%`));
  }
  if (filters.collection) {
    const collectionId = await resolveCollectionId(filters.collection);
    // Coleção inexistente → nenhum produto (condição impossível)
    conditions.push(collectionId ? eq(products.collectionId, collectionId) : sql`false`);
  }

  const rows = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(desc(products.createdAt))
    .limit(limit)
    .offset(offset);

  // Anexa a imagem principal (menor order) de cada produto
  return Promise.all(
    rows.map(async (p) => {
      const [image] = await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, p.id))
        .orderBy(asc(productImages.order))
        .limit(1);
      return { ...p, image: image ?? null };
    })
  );
};

// Produto em destaque no hero da Home (mais recente marcado como featured).
export const getFeaturedPublic = async () => {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.active, true), eq(products.featured, true)))
    .orderBy(desc(products.createdAt))
    .limit(1);
  if (!product) return null;
  const [image] = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, product.id))
    .orderBy(asc(productImages.order))
    .limit(1);
  return { ...product, image: image ?? null };
};

export const getBySlugPublic = async (slug: string) => {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.active, true)));
  if (!product) return null;

  const [variants, images] = await Promise.all([
    db
      .select()
      .from(productVariants)
      .where(and(eq(productVariants.productId, product.id), eq(productVariants.active, true)))
      .orderBy(asc(productVariants.id)),
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(asc(productImages.order)),
  ]);

  return { ...product, variants, images };
};

// ========== PRODUTOS RELACIONADOS ==========
// Conjunto de ids de produtos ATIVOS dentre os informados (para filtrar manuais inativos).
const activeIdSet = async (ids: number[]): Promise<Set<number>> => {
  if (ids.length === 0) return new Set();
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(and(inArray(products.id, ids), eq(products.active, true)));
  return new Set(rows.map((r) => r.id));
};

// Anexa a imagem principal (menor order) a cada produto, preservando a ordem recebida.
const attachMainImage = async (ids: number[]) => {
  if (ids.length === 0) return [];
  const rows = await db.select().from(products).where(inArray(products.id, ids));
  const byId = new Map(rows.map((p) => [p.id, p]));
  const ordered = ids.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => !!p);
  return Promise.all(
    ordered.map(async (p) => {
      const [image] = await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, p.id))
        .orderBy(asc(productImages.order))
        .limit(1);
      return { ...p, image: image ?? null };
    })
  );
};

// Resolve a cascata: manual (bidirecional) → mesma coleção → destaques → mais recentes.
// Filtra inativos e o próprio produto; nunca repete; corta no limite. Os estágios de
// fallback só são consultados enquanto faltam itens (lazy).
const resolveRelated = async (
  productId: number,
  collectionId: number | null,
  limit: number
): Promise<number[]> => {
  const stages: number[][] = [];

  // 1) Relações manuais, tratadas como bidirecionais (A→B também vale em B).
  const manualRows = await db
    .select({
      id: sql<number>`case when ${productRelated.productId} = ${productId} then ${productRelated.relatedId} else ${productRelated.productId} end`,
      sortOrder: productRelated.sortOrder,
    })
    .from(productRelated)
    .where(or(eq(productRelated.productId, productId), eq(productRelated.relatedId, productId)))
    .orderBy(asc(productRelated.sortOrder));
  const manualIds = [...new Set(manualRows.map((r) => Number(r.id)))];
  const manualActive = await activeIdSet(manualIds);
  stages.push(manualIds.filter((id) => manualActive.has(id)));
  let picked = pickRelatedIds(productId, stages, limit);

  // 2) Fallback: mesma coleção.
  if (picked.length < limit && collectionId != null) {
    const rows = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.active, true), eq(products.collectionId, collectionId)))
      .orderBy(desc(products.createdAt));
    stages.push(rows.map((r) => r.id));
    picked = pickRelatedIds(productId, stages, limit);
  }

  // 3) Fallback: produtos em destaque.
  if (picked.length < limit) {
    const rows = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.active, true), eq(products.featured, true)))
      .orderBy(desc(products.createdAt));
    stages.push(rows.map((r) => r.id));
    picked = pickRelatedIds(productId, stages, limit);
  }

  // 4) Fallback final: mais recentes (garante que a seção nunca fique vazia).
  if (picked.length < limit) {
    const rows = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.active, true))
      .orderBy(desc(products.createdAt))
      .limit(limit + manualIds.length + 1);
    stages.push(rows.map((r) => r.id));
    picked = pickRelatedIds(productId, stages, limit);
  }

  return picked;
};

// Leitura pública (PDP): lista de relacionados com imagem principal, cacheada ~60s.
export const getRelatedPublic = async (slug: string, limit = RELATED_LIMIT) => {
  const [product] = await db
    .select({ id: products.id, collectionId: products.collectionId })
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.active, true)));
  if (!product) return [];

  const ids = await cached(`related:${product.id}`, RELATED_CACHE_TTL, () =>
    resolveRelated(product.id, product.collectionId, limit)
  );
  return attachMainImage(ids);
};

// Leitura admin: apenas as relações manuais "próprias" deste produto (productId = id).
export const getRelatedAdmin = async (productId: number) =>
  db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      active: products.active,
    })
    .from(productRelated)
    .innerJoin(products, eq(products.id, productRelated.relatedId))
    .where(eq(productRelated.productId, productId))
    .orderBy(asc(productRelated.sortOrder));

// Substitui a lista manual de relacionados do produto (ordem = sortOrder).
export const setRelated = async (productId: number, relatedIds: number[]): Promise<number[]> => {
  const [exists] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId));
  if (!exists) throw new Error('Produto não encontrado');

  // Dedup preservando ordem e remove auto-relação.
  const cleanIds = [...new Set(relatedIds)].filter((id) => id !== productId);

  if (cleanIds.length > 0) {
    const found = await db
      .select({ id: products.id })
      .from(products)
      .where(inArray(products.id, cleanIds));
    if (found.length !== cleanIds.length) {
      throw new Error('Produto relacionado não encontrado');
    }
  }

  // Caches a invalidar: o próprio + antigos + novos (relação é bidirecional).
  const previous = await db
    .select({ relatedId: productRelated.relatedId })
    .from(productRelated)
    .where(eq(productRelated.productId, productId));
  const affected = new Set<number>([productId, ...cleanIds, ...previous.map((r) => r.relatedId)]);

  await db.transaction(async (tx) => {
    await tx.delete(productRelated).where(eq(productRelated.productId, productId));
    if (cleanIds.length > 0) {
      await tx
        .insert(productRelated)
        .values(cleanIds.map((relatedId, i) => ({ productId, relatedId, sortOrder: i })));
    }
  });

  await Promise.all([...affected].map((id) => cacheDel(`related:${id}`)));
  return cleanIds;
};

// ========== LEITURA ADMIN ==========
export const listAdmin = async () => {
  const rows = await db.select().from(products).orderBy(desc(products.createdAt));
  return Promise.all(
    rows.map(async (p) => {
      const [{ count: variantCount }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(productVariants)
        .where(eq(productVariants.productId, p.id));
      const [{ stock }] = await db
        .select({ stock: sql<number>`coalesce(sum(${productVariants.stock}), 0)::int` })
        .from(productVariants)
        .where(eq(productVariants.productId, p.id));
      return { ...p, variantCount, totalStock: stock };
    })
  );
};

export const getByIdAdmin = async (id: number) => {
  const [product] = await db.select().from(products).where(eq(products.id, id));
  if (!product) return null;
  const [variants, images] = await Promise.all([
    db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, id))
      .orderBy(asc(productVariants.id)),
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(asc(productImages.order)),
  ]);
  return { ...product, variants, images };
};

// ========== ESCRITA ==========
export const create = async (
  data: Omit<InsertProduct, 'slug' | 'createdBy'> & { slug?: string },
  userId: string,
  variants: Omit<InsertProductVariant, 'productId'>[] = [],
  images: Omit<InsertProductImage, 'productId'>[] = []
) => {
  const slug = await ensureUniqueSlug(data.slug ? slugify(data.slug) : slugify(data.name));

  return db.transaction(async (tx) => {
    const [product] = await tx
      .insert(products)
      .values({ ...data, slug, createdBy: userId })
      .returning();

    if (variants.length > 0) {
      await tx
        .insert(productVariants)
        .values(variants.map((v) => ({ ...v, productId: product.id })));
    }
    if (images.length > 0) {
      await tx
        .insert(productImages)
        .values(images.map((img, i) => ({ ...img, order: img.order ?? i, productId: product.id })));
    }
    return product;
  });
};

export const update = async (id: number, data: Partial<Omit<InsertProduct, 'createdBy'>>) => {
  const patch = { ...data };
  if (patch.slug) patch.slug = await ensureUniqueSlug(slugify(patch.slug), id);
  const [product] = await db.update(products).set(patch).where(eq(products.id, id)).returning();
  // active/collection podem mudar a cascata de relacionados deste produto.
  await cacheDel(`related:${id}`);
  return product;
};

export const remove = async (id: number) => {
  const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();
  await cacheDel(`related:${id}`);
  return deleted;
};

// ========== VARIANTES ==========
export const addVariant = async (
  productId: number,
  data: Omit<InsertProductVariant, 'productId'>
) => {
  const [variant] = await db
    .insert(productVariants)
    .values({ ...data, productId })
    .returning();
  return variant;
};

export const updateVariant = async (
  variantId: number,
  data: Partial<Omit<InsertProductVariant, 'productId' | 'id'>>
) => {
  const [variant] = await db
    .update(productVariants)
    .set(data)
    .where(eq(productVariants.id, variantId))
    .returning();
  return variant;
};

export const deleteVariant = async (variantId: number) => {
  const [deleted] = await db
    .delete(productVariants)
    .where(eq(productVariants.id, variantId))
    .returning();
  return deleted;
};

// ========== IMAGENS ==========
export const addImage = async (productId: number, data: Omit<InsertProductImage, 'productId'>) => {
  const [image] = await db
    .insert(productImages)
    .values({ ...data, productId })
    .returning();
  return image;
};

export const deleteImage = async (imageId: number) => {
  const [deleted] = await db.delete(productImages).where(eq(productImages.id, imageId)).returning();
  return deleted;
};
