import { Link, useNavigate } from "react-router-dom";
import { useGetAdminOrdersQuery } from "../account/ordersApi";
import OrderStatusBadge from "../account/OrderStatusBadge";
import { formatBRL, formatDate } from "@/utils/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShoppingBag, DollarSign, Clock } from "lucide-react";

function StatsCard({
  label,
  value,
  icon: Icon,
  accent = "muted",
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent?: "blue" | "red" | "muted";
}) {
  const iconColor =
    accent === "blue"
      ? "text-primary"
      : accent === "red"
        ? "text-brand-red"
        : "text-muted-foreground";
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <p className="font-heading text-3xl font-medium">{value}</p>
      </CardContent>
    </Card>
  );
}

const PAID = new Set(["pago", "enviado", "entregue"]);

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: orders } = useGetAdminOrdersQuery();

  const total = orders?.length ?? 0;
  const revenue =
    orders
      ?.filter((o) => PAID.has(o.status))
      .reduce((s, o) => s + o.total, 0) ?? 0;
  const pending =
    orders?.filter((o) => o.status === "aguardando_pagamento").length ?? 0;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-medium tracking-tight">Painel</h1>
        <Link
          to="/admin/relatorios"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          Ver relatórios →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="Pedidos"
          value={String(total)}
          icon={ShoppingBag}
          accent="blue"
        />
        <StatsCard
          label="Faturamento"
          value={formatBRL(revenue)}
          icon={DollarSign}
          accent="red"
        />
        <StatsCard
          label="Aguardando pagamento"
          value={String(pending)}
          icon={Clock}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.slice(0, 6).map((o) => (
                <TableRow
                  key={o.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/pedidos/${o.id}`)}
                >
                  <TableCell className="font-medium">{o.orderNumber}</TableCell>
                  <TableCell>{o.customerName}</TableCell>
                  <TableCell>{formatDate(o.createdAt)}</TableCell>
                  <TableCell>{formatBRL(o.total)}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                </TableRow>
              ))}
              {(!orders || orders.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    Nenhum pedido ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { to: "/admin/produtos", label: "Produtos" },
          { to: "/admin/pedidos", label: "Pedidos" },
          { to: "/admin/users", label: "Usuários" },
          { to: "/admin/relatorios", label: "Relatórios" },
        ].map((c) => (
          <Card
            key={c.to}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => navigate(c.to)}
          >
            <CardHeader>
              <CardTitle className="text-sm">{c.label}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
