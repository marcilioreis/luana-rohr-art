import { useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import type { Order } from "../account/orders.types";
import { formatBRL } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, Link2, Truck, Store } from "lucide-react";
import { Mandala } from "@/components/brand/Mandala";
import { useAppSelector } from "@/app/hooks";
import { DELIVERY_METHOD_LABELS, PICKUP_NOTICE } from "../account/orders.types";

export default function PixPayment({ order }: { order: Order }) {
  const [copied, setCopied] = useState(false);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const trackUrl = order.accessToken
    ? `${window.location.origin}/pedido/${order.accessToken}`
    : null;
  const [linkCopied, setLinkCopied] = useState(false);

  const copyTrackLink = async () => {
    if (!trackUrl) return;
    try {
      await navigator.clipboard.writeText(trackUrl);
      setLinkCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const copyPix = async () => {
    if (!order.pixPayload) return;
    try {
      await navigator.clipboard.writeText(order.pixPayload);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
          <Mandala className="h-9 w-9 text-primary" />
        </div>
        <h1 className="text-2xl font-medium">Pedido criado!</h1>
        <p className="text-muted-foreground">
          Pedido <strong>{order.orderNumber}</strong> — aguardando pagamento.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center text-base">
            Pague {formatBRL(order.total)} via PIX
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.pixPayload && (
            <div className="flex justify-center rounded-lg bg-white p-4">
              <QRCodeCanvas
                value={order.pixPayload}
                size={200}
                data-testid="pix-qrcode"
              />
            </div>
          )}

          <div>
            <p className="mb-1 text-sm font-medium">PIX copia e cola</p>
            <div className="flex gap-2">
              <textarea
                readOnly
                value={order.pixPayload ?? ""}
                className="h-20 flex-1 resize-none rounded-md border bg-muted/40 p-2 text-xs"
                data-testid="pix-payload"
              />
            </div>
            <Button
              variant="outline"
              className="mt-2 w-full"
              onClick={copyPix}
              data-testid="copy-pix"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" /> Copiar código
                </>
              )}
            </Button>
          </div>

          <div className="rounded-md bg-accent/40 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Como pagar:</p>
            <ol className="mt-1 list-decimal space-y-1 pl-4">
              <li>Abra o app do seu banco e escolha PIX → Copia e cola.</li>
              <li>Cole o código ou escaneie o QR code acima.</li>
              <li>Confirme o valor de {formatBRL(order.total)} e finalize.</li>
              <li>
                Assim que confirmarmos o pagamento, seu pedido será preparado.
              </li>
            </ol>
          </div>

          <div className="rounded-md border p-3 text-xs">
            <p className="flex items-center gap-2 font-medium text-foreground">
              {order.deliveryMethod === "retirada" ? (
                <Store className="h-4 w-4" />
              ) : (
                <Truck className="h-4 w-4" />
              )}
              {DELIVERY_METHOD_LABELS[order.deliveryMethod]}
            </p>
            {order.deliveryMethod === "retirada" && (
              <p
                className="mt-1 text-muted-foreground"
                data-testid="pickup-notice"
              >
                {PICKUP_NOTICE}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {isAuthenticated ? (
        <div className="mt-6 text-center">
          <Button asChild>
            <Link to="/conta/pedidos">Ver meus pedidos</Link>
          </Button>
        </div>
      ) : trackUrl ? (
        <div className="mt-6 space-y-2 rounded-md border bg-accent/30 p-4 text-sm">
          <p className="flex items-center gap-2 font-medium text-foreground">
            <Link2 className="h-4 w-4" /> Salve este link para acompanhar seu
            pedido
          </p>
          <p className="text-xs text-muted-foreground">
            Você não está logada. Guarde o endereço abaixo para reabrir este
            pedido e o PIX quando quiser.
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={trackUrl}
              className="flex-1 rounded-md border bg-muted/40 p-2 text-xs"
              data-testid="track-link"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={copyTrackLink}
              data-testid="copy-track-link"
            >
              {linkCopied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
