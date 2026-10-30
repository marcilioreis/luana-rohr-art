import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  useGetOrderQuery,
  useUpdateOrderStatusMutation,
  useConfirmPaymentMutation,
} from "../../account/ordersApi";
import type { OrderStatus } from "../../account/orders.types";
import { ORDER_STATUS_LABELS } from "../../account/orders.types";
import OrderStatusBadge from "../../account/OrderStatusBadge";
import { formatBRL, formatDateTime } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Próximas transições válidas (espelha o service do backend)
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  aguardando_pagamento: ["pago", "cancelado"],
  pago: ["enviado", "cancelado"],
  enviado: ["entregue", "cancelado"],
  entregue: [],
  cancelado: [],
};

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const { data: order, isLoading } = useGetOrderQuery(orderId);
  const [updateStatus, { isLoading: updating }] =
    useUpdateOrderStatusMutation();
  const [confirmPayment, { isLoading: confirming }] =
    useConfirmPaymentMutation();

  if (isLoading)
    return <div className="p-6 text-muted-foreground">Carregando...</div>;
  if (!order) return <div className="p-6">Pedido não encontrado.</div>;

  const transition = async (status: OrderStatus) => {
    try {
      if (status === "pago") {
        await confirmPayment(orderId).unwrap();
      } else {
        await updateStatus({ id: orderId, status }).unwrap();
      }
      toast.success(`Status atualizado para "${ORDER_STATUS_LABELS[status]}".`);
    } catch (err) {
      const e = err as { data?: { error?: string } };
      toast.error(e?.data?.error ?? "Erro ao atualizar status.");
    }
  };

  const addr = order.shippingAddress;
  const busy = updating || confirming;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 pb-20">
      <Link
        to="/admin/pedidos"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Pedidos
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            Criado em {formatDateTime(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Ações de transição */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gestão do pedido</CardTitle>
        </CardHeader>
        <CardContent>
          {NEXT[order.status].length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Este pedido está finalizado ({ORDER_STATUS_LABELS[order.status]}).
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {NEXT[order.status].map((s) => (
                <Button
                  key={s}
                  variant={s === "cancelado" ? "destructive" : "default"}
                  disabled={busy}
                  onClick={() => transition(s)}
                  data-testid={`transition-${s}`}
                >
                  {s === "pago"
                    ? "Confirmar pagamento"
                    : `Marcar como ${ORDER_STATUS_LABELS[s]}`}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cliente</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>{order.customerName}</p>
          <p className="text-muted-foreground">{order.customerEmail}</p>
          {order.customerPhone && (
            <p className="text-muted-foreground">{order.customerPhone}</p>
          )}
          {addr && (
            <p className="mt-2 text-muted-foreground">
              {addr.street}, {addr.number}
              {addr.complement ? ` — ${addr.complement}` : ""} · {addr.district}{" "}
              · {addr.city}/{addr.state} · CEP {addr.cep}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Itens */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Itens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {order.items.map((it) => (
            <div key={it.id} className="flex justify-between">
              <span>
                {it.quantity}× {it.productName}
                {it.variantLabel && (
                  <span className="text-muted-foreground">
                    {" "}
                    — {it.variantLabel}
                  </span>
                )}
              </span>
              <span>{formatBRL(it.lineTotal)}</span>
            </div>
          ))}
          <div className="space-y-1 border-t pt-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatBRL(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frete</span>
              <span>{formatBRL(order.shippingFee)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatBRL(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
