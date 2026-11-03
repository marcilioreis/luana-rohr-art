// src/shared/db/schema/views.types.ts
import type { OrderStatus, DeliveryMethod } from './orders.js';

// Formato retornado pela view orders_enriched (campos derivados + itens agregados).
export type OrderEnriched = {
  id: number;
  orderNumber: string;
  customerId: string | null;
  status: OrderStatus;
  statusLabel: string;
  deliveryMethod: DeliveryMethod;
  subtotal: number;
  shippingFee: number;
  total: number;
  pixPayload: string | null;
  pixTxid: string | null;
  // Não vem da view orders_enriched; anexado no caminho de criação/track (convidado).
  accessToken?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingAddress: unknown;
  notes: string | null;
  createdAt: Date;
  paidAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  itemCount: number;
  items: Array<{
    id: number;
    productId: number | null;
    variantId: number | null;
    productName: string;
    variantLabel: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
};
