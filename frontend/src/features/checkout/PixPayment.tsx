import { useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import type { Order } from "../account/orders.types";
import { formatBRL } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, CheckCircle2 } from "lucide-react";

export default function PixPayment({ order }: { order: Order }) {
  const [copied, setCopied] = useState(false);

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
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
        <h1 className="mt-3 text-2xl font-bold">Pedido criado!</h1>
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
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <Button asChild>
          <Link to="/conta/pedidos">Ver meus pedidos</Link>
        </Button>
      </div>
    </div>
  );
}
