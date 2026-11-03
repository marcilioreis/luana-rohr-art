export type OrderStatus =
  "aguardando_pagamento" | "pago" | "enviado" | "entregue" | "cancelado";

export type DeliveryMethod = "entrega" | "retirada";

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
  deliveryMethod: DeliveryMethod;
  subtotal: number;
  shippingFee: number;
  total: number;
  pixPayload: string | null;
  pixTxid: string | null;
  // Presente no retorno de criação e no track público (convidado); ausente nas listagens.
  accessToken?: string | null;
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
  deliveryMethod: DeliveryMethod;
  // Obrigatório para "entrega"; omitido para "retirada".
  shippingAddress?: ShippingAddress;
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

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  entrega: "Entrega",
  retirada: "Retirada (sem custo)",
};

// Aviso exibido para a modalidade de retirada.
export const PICKUP_NOTICE =
  "A retirada é sem custo e deve ser agendada com antecedência — entraremos em contato para combinar data e horário.";
