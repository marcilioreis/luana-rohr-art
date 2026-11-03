// src/modules/orders/orders.service.ts
import { randomBytes } from 'crypto';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../../shared/db/index.js';
import { orders, orderItems, ORDER_STATUSES } from '../../shared/db/schema/orders.js';
import type { OrderStatus, DeliveryMethod } from '../../shared/db/schema/orders.js';
import { products, productVariants } from '../../shared/db/schema/products.js';
import type { OrderEnriched } from '../../shared/db/schema/views.types.js';
import { buildOrderPix } from '../../shared/pix/pix.js';
import { getShippingFee } from '../../shared/shipping/shipping.js';

// ---- Mapeamento da view orders_enriched (top-level snake_case → camelCase) ----
const mapRow = (row: Record<string, unknown>): OrderEnriched => ({
  id: row.id as number,
  orderNumber: row.order_number as string,
  customerId: (row.customer_id as string | null) ?? null,
  status: row.status as OrderStatus,
  statusLabel: row.status_label as string,
  deliveryMethod: (row.delivery_method as DeliveryMethod) ?? 'entrega',
  subtotal: Number(row.subtotal),
  shippingFee: Number(row.shipping_fee),
  total: Number(row.total),
  pixPayload: (row.pix_payload as string | null) ?? null,
  pixTxid: (row.pix_txid as string | null) ?? null,
  customerName: row.customer_name as string,
  customerEmail: row.customer_email as string,
  customerPhone: (row.customer_phone as string | null) ?? null,
  shippingAddress: row.shipping_address,
  notes: (row.notes as string | null) ?? null,
  createdAt: new Date(row.created_at as string),
  paidAt: row.paid_at ? new Date(row.paid_at as string) : null,
  shippedAt: row.shipped_at ? new Date(row.shipped_at as string) : null,
  deliveredAt: row.delivered_at ? new Date(row.delivered_at as string) : null,
  cancelledAt: row.cancelled_at ? new Date(row.cancelled_at as string) : null,
  itemCount: Number(row.item_count) || 0,
  items: (row.items as OrderEnriched['items']) ?? [],
});

export const findByIdEnriched = async (id: number): Promise<OrderEnriched | null> => {
  const rows = await db.execute(sql`SELECT * FROM orders_enriched WHERE id = ${id}`);
  const list = (rows as unknown as Record<string, unknown>[]).map(mapRow);
  return list[0] ?? null;
};

export const findAllEnriched = async (status?: OrderStatus): Promise<OrderEnriched[]> => {
  const rows = status
    ? await db.execute(
        sql`SELECT * FROM orders_enriched WHERE status = ${status} ORDER BY created_at DESC`
      )
    : await db.execute(sql`SELECT * FROM orders_enriched ORDER BY created_at DESC`);
  return (rows as unknown as Record<string, unknown>[]).map(mapRow);
};

export const findByCustomerEnriched = async (customerId: string): Promise<OrderEnriched[]> => {
  const rows = await db.execute(
    sql`SELECT * FROM orders_enriched WHERE customer_id = ${customerId} ORDER BY created_at DESC`
  );
  return (rows as unknown as Record<string, unknown>[]).map(mapRow);
};

const generateOrderNumber = (): string =>
  `LR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

export interface CheckoutItem {
  variantId: number;
  quantity: number;
}
export interface CheckoutAddress {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
}
export interface CheckoutPayload {
  items: CheckoutItem[];
  customer: { name: string; email: string; phone?: string };
  deliveryMethod?: DeliveryMethod;
  // Obrigatório para 'entrega'; ignorado/omitido para 'retirada'.
  shippingAddress?: CheckoutAddress;
  // Ignorado — o frete é calculado no servidor a partir da UF (server-authoritative).
  shippingFee?: number;
  notes?: string;
}

// ========== CRIAR PEDIDO (checkout) ==========
export const createOrder = async (customerId: string | null, payload: CheckoutPayload) => {
  const deliveryMethod: DeliveryMethod = payload.deliveryMethod ?? 'entrega';
  const isPickup = deliveryMethod === 'retirada';
  // Retirada é sem custo; entrega tem frete autoritativo pelo servidor (UF do endereço),
  // nunca confiando no valor do cliente. Na retirada não guardamos endereço de entrega.
  const shippingAddress = isPickup ? null : (payload.shippingAddress ?? null);
  const shippingFee =
    isPickup || !payload.shippingAddress ? 0 : getShippingFee(payload.shippingAddress.state);

  const orderNumber = generateOrderNumber();
  const pixTxid = orderNumber.replace(/[^A-Za-z0-9]/g, '').slice(0, 25);
  // Token de acesso público só para convidado (reabre o pedido/PIX via /pedido/:token).
  // Usuário logado acompanha por /mine, então não recebe token (menor superfície de ataque).
  const accessToken = customerId ? null : randomBytes(24).toString('base64url');

  const created = await db.transaction(async (tx) => {
    let subtotal = 0;
    const itemsToInsert: Array<{
      productId: number;
      variantId: number;
      productName: string;
      variantLabel: string;
      unitPrice: number;
      quantity: number;
      lineTotal: number;
    }> = [];

    for (const item of payload.items) {
      // Baixa de estoque atômica: só decrementa se houver estoque suficiente
      const [variant] = await tx
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
        .where(
          and(
            eq(productVariants.id, item.variantId),
            eq(productVariants.active, true),
            sql`${productVariants.stock} >= ${item.quantity}`
          )
        )
        .returning();

      if (!variant) {
        throw new Error(`Estoque insuficiente para a variante ${item.variantId}`);
      }

      const [product] = await tx.select().from(products).where(eq(products.id, variant.productId));
      if (!product || !product.active) {
        throw new Error(`Produto indisponível para a variante ${item.variantId}`);
      }

      const unitPrice = variant.price ?? product.basePrice;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      itemsToInsert.push({
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        variantLabel: `${variant.size} / ${variant.color}`,
        unitPrice,
        quantity: item.quantity,
        lineTotal,
      });
    }

    const total = subtotal + shippingFee;
    const pixPayload = buildOrderPix(total, pixTxid);

    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber,
        customerId,
        status: 'aguardando_pagamento',
        deliveryMethod,
        subtotal,
        shippingFee,
        total,
        pixPayload,
        pixTxid,
        accessToken,
        customerName: payload.customer.name,
        customerEmail: payload.customer.email,
        customerPhone: payload.customer.phone,
        shippingAddress,
        notes: payload.notes,
      })
      .returning();

    await tx.insert(orderItems).values(itemsToInsert.map((it) => ({ ...it, orderId: order.id })));

    return order;
  });

  // A view orders_enriched NÃO expõe access_token; anexa-o ao objeto enriquecido
  // para que o frontend possa redirecionar o convidado para /pedido/:token.
  const enriched = await findByIdEnriched(created.id);
  return enriched ? { ...enriched, accessToken: created.accessToken } : enriched;
};

// Busca pedido pelo token de acesso público (convidado). Reusa a view enriquecida.
export const findByAccessToken = async (token: string): Promise<OrderEnriched | null> => {
  const [row] = await db
    .select({ id: orders.id, accessToken: orders.accessToken })
    .from(orders)
    .where(eq(orders.accessToken, token));
  if (!row) return null;
  const enriched = await findByIdEnriched(row.id);
  return enriched ? { ...enriched, accessToken: row.accessToken } : enriched;
};

// ========== TRANSIÇÃO DE STATUS ==========
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  aguardando_pagamento: ['pago', 'cancelado'],
  pago: ['enviado', 'cancelado'],
  enviado: ['entregue', 'cancelado'],
  entregue: [],
  cancelado: [],
};

export const isValidTransition = (from: OrderStatus, to: OrderStatus): boolean =>
  ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;

export const updateStatus = async (orderId: number, next: OrderStatus) => {
  if (!ORDER_STATUSES.includes(next)) throw new Error('Status inválido');

  // Executa a transição dentro da transação; retorna se o pedido existe.
  const found = await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId));
    if (!order) return false;

    const current = order.status as OrderStatus;
    if (current === next) return true;
    if (!isValidTransition(current, next)) {
      throw new Error(`Transição inválida: ${current} → ${next}`);
    }

    const patch: Record<string, unknown> = { status: next };
    const now = new Date();
    if (next === 'pago') patch.paidAt = now;
    if (next === 'enviado') patch.shippedAt = now;
    if (next === 'entregue') patch.deliveredAt = now;
    if (next === 'cancelado') {
      patch.cancelledAt = now;
      // Devolve o estoque ao cancelar (se ainda não foi entregue)
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
      for (const it of items) {
        if (it.variantId) {
          await tx
            .update(productVariants)
            .set({ stock: sql`${productVariants.stock} + ${it.quantity}` })
            .where(eq(productVariants.id, it.variantId));
        }
      }
    }

    await tx.update(orders).set(patch).where(eq(orders.id, orderId));
    return true;
  });

  if (!found) return null;
  // Busca o estado enriquecido já com a transação confirmada
  return findByIdEnriched(orderId);
};

// Retorna o pedido cru (para checagem de posse)
export const findRaw = async (id: number) => {
  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  return order ?? null;
};

// Dados achatados para exportação
export const getExportData = async (filters: {
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
}) => {
  const conditions = [];
  if (filters.status) conditions.push(eq(orders.status, filters.status));
  if (filters.startDate) conditions.push(sql`${orders.createdAt} >= ${filters.startDate}`);
  if (filters.endDate) conditions.push(sql`${orders.createdAt} <= ${filters.endDate}`);

  const rows = await db
    .select()
    .from(orders)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(orders.createdAt));

  return rows.map((o) => ({
    numero: o.orderNumber,
    status: o.status,
    modalidade: o.deliveryMethod,
    cliente: o.customerName,
    email: o.customerEmail,
    telefone: o.customerPhone ?? '',
    subtotal: o.subtotal,
    frete: o.shippingFee,
    total: o.total,
    criado_em: o.createdAt?.toISOString() ?? '',
    pago_em: o.paidAt?.toISOString() ?? '',
    enviado_em: o.shippedAt?.toISOString() ?? '',
  }));
};
