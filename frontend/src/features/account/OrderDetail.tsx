import { useParams, Link } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { useGetOrderQuery } from "./ordersApi";
import OrderStatusBadge from "./OrderStatusBadge";
import { formatBRL, formatDateTime } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy } from "lucide-react";

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError } = useGetOrderQuery(Number(id));

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 text-muted-foreground">
        Carregando...
      </div>
    );
  }
  if (isError || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Pedido não encontrado.</p>
        <Button asChild className="mt-4">
          <Link to="/conta/pedidos">Voltar</Link>
        </Button>
      </div>
    );
  }

  const addr = order.shippingAddress;
  const copyPix = async () => {
    if (!order.pixPayload) return;
    await navigator.clipboard.writeText(order.pixPayload);
    toast.success("Código PIX copiado!");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        to="/conta/pedidos"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Meus pedidos
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Pedido {order.orderNumber}
        </h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="text-sm text-muted-foreground">
        Feito em {formatDateTime(order.createdAt)}
      </p>

      {/* PIX pendente */}
      {order.status === "aguardando_pagamento" && order.pixPayload && (
        <Card className="mt-6 border-primary/40">
          <CardHeader>
            <CardTitle className="text-base">
              Pagamento pendente — PIX
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            <div className="rounded-lg bg-white p-3">
              <QRCodeCanvas value={order.pixPayload} size={140} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Pague{" "}
                <strong className="text-foreground">
                  {formatBRL(order.total)}
                </strong>{" "}
                com o código abaixo. O pedido será preparado após a confirmação.
              </p>
              <textarea
                readOnly
                value={order.pixPayload}
                className="mt-2 h-16 w-full resize-none rounded-md border bg-muted/40 p-2 text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={copyPix}
              >
                <Copy className="mr-2 h-4 w-4" /> Copiar código PIX
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Itens */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Itens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {order.items.map((it) => (
            <div key={it.id} className="flex justify-between gap-2 text-sm">
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
          <div className="space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatBRL(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frete</span>
              <span>{formatBRL(order.shippingFee)}</span>
            </div>
            <div className="flex justify-between pt-1 font-semibold">
              <span>Total</span>
              <span>{formatBRL(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entrega */}
      {addr && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Entrega</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              {addr.street}, {addr.number}
              {addr.complement ? ` — ${addr.complement}` : ""}
            </p>
            <p>
              {addr.district} — {addr.city}/{addr.state}
            </p>
            <p>CEP {addr.cep}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
