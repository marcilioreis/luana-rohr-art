import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLoader from "@/components/common/PageLoader";
import { useGetAdminOrdersQuery } from "../../account/ordersApi";
import type { OrderStatus } from "../../account/orders.types";
import { ORDER_STATUS_LABELS } from "../../account/orders.types";
import OrderStatusBadge from "../../account/OrderStatusBadge";
import ExportButton from "./ExportButton";
import { formatBRL, formatDate } from "@/utils/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "todos";

export default function AdminOrderList() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<OrderStatus | typeof ALL>(ALL);
  const { data: orders, isLoading } = useGetAdminOrdersQuery(
    status === ALL ? undefined : { status },
  );

  return (
    <div className="space-y-4 p-4 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-medium tracking-tight">Pedidos</h1>
        <div className="flex items-center gap-3">
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as OrderStatus | typeof ALL)}
          >
            <SelectTrigger className="h-9 w-48" data-testid="status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os status</SelectItem>
              {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ExportButton status={status === ALL ? undefined : status} />
        </div>
      </div>

      {isLoading ? (
        <PageLoader label="Carregando pedidos…" />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((o) => (
                <TableRow
                  key={o.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/pedidos/${o.id}`)}
                  data-testid={`admin-order-${o.id}`}
                >
                  <TableCell className="font-medium">{o.orderNumber}</TableCell>
                  <TableCell>{o.customerName}</TableCell>
                  <TableCell>{formatDate(o.createdAt)}</TableCell>
                  <TableCell>{o.itemCount}</TableCell>
                  <TableCell>{formatBRL(o.total)}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                </TableRow>
              ))}
              {(!orders || orders.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    Nenhum pedido encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
