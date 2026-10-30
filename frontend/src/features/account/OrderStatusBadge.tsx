import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "./orders.types";
import { ORDER_STATUS_LABELS } from "./orders.types";

const VARIANT: Record<
  OrderStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  aguardando_pagamento: "secondary",
  pago: "default",
  enviado: "default",
  entregue: "outline",
  cancelado: "destructive",
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={VARIANT[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}
