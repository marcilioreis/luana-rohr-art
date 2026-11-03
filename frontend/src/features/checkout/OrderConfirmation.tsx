import { useParams, Link } from "react-router-dom";
import { useGetOrderByTokenQuery } from "../account/ordersApi";
import { DELIVERY_METHOD_LABELS, PICKUP_NOTICE } from "../account/orders.types";
import OrderStatusBadge from "../account/OrderStatusBadge";
import PixPayment from "./PixPayment";
import { formatBRL } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrderConfirmation() {
  const { token = "" } = useParams();
  const { data: order, isLoading, isError } = useGetOrderByTokenQuery(token);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">Carregando...</div>
    );
  }

  if (isError || !order) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted-foreground">
          Pedido não encontrado. Verifique o link e tente novamente.
        </p>
        <Button asChild className="mt-4">
          <Link to="/loja">Ir para a loja</Link>
        </Button>
      </div>
    );
  }

  // Aguardando pagamento → mostra o PIX (QR + copia e cola) + link persistente
  if (order.status === "aguardando_pagamento") {
    return <PixPayment order={order} />;
  }

  // Já pago/enviado/entregue/cancelado → resumo de status (sem PIX)
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>Pedido {order.orderNumber}</span>
            <OrderStatusBadge status={order.status} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Olá, {order.customerName}! Acompanhe aqui a situação do seu pedido.
          </p>
          <div className="rounded-md border p-3">
            <p className="font-medium">
              {DELIVERY_METHOD_LABELS[order.deliveryMethod]}
            </p>
            {order.deliveryMethod === "retirada" && (
              <p className="mt-1 text-xs text-muted-foreground">
                {PICKUP_NOTICE}
              </p>
            )}
          </div>
          <ul className="space-y-2 border-t pt-4">
            {order.items.map((it) => (
              <li key={it.id} className="flex justify-between gap-2">
                <span className="text-muted-foreground">
                  {it.quantity}× {it.productName}
                  {it.variantLabel ? ` (${it.variantLabel})` : ""}
                </span>
                <span>{formatBRL(it.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t pt-4 text-base font-semibold">
            <span>Total</span>
            <span>{formatBRL(order.total)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
