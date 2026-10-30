export type OrderStatus =
  "aguardando_pagamento" | "pago" | "enviado" | "entregue" | "cancelado";

export interface OrderItem {
  id: number;
  productId: number | null;
  variantId: number | null;
  productName: string;
  variantLabel: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface ShippingAddress {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: string | null;
  status: OrderStatus;
  statusLabel: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  pixPayload: string | null;
  pixTxid: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingAddress: ShippingAddress | null;
  notes: string | null;
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  itemCount: number;
  items: OrderItem[];
}

export interface CheckoutPayload {
  items: Array<{ variantId: number; quantity: number }>;
  customer: { name: string; email: string; phone?: string };
  shippingAddress: ShippingAddress;
  shippingFee?: number;
  notes?: string;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};
