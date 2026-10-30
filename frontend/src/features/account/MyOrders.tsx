import { Link } from "react-router-dom";
import { useGetMyOrdersQuery } from "./ordersApi";
import OrderStatusBadge from "./OrderStatusBadge";
import { formatBRL, formatDate } from "@/utils/format";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function MyOrders() {
  const { data: orders, isLoading } = useGetMyOrdersQuery();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 text-muted-foreground">
        Carregando...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Meus pedidos</h1>
      {!orders || orders.length === 0 ? (
        <div className="rounded-xl border p-12 text-center">
          <p className="text-muted-foreground">
            Você ainda não fez nenhum pedido.
          </p>
          <Button asChild className="mt-4">
            <Link to="/loja">Ir para a loja</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id} data-testid={`order-row-${o.id}`}>
                  <TableCell className="font-medium">{o.orderNumber}</TableCell>
                  <TableCell>{formatDate(o.createdAt)}</TableCell>
                  <TableCell>{o.itemCount}</TableCell>
                  <TableCell>{formatBRL(o.total)}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/conta/pedidos/${o.id}`}>Detalhes</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
