import { useGetSalesReportQuery } from "./reportsApi";
import { ORDER_STATUS_LABELS } from "../../account/orders.types";
import type { OrderStatus } from "../../account/orders.types";
import { formatBRL } from "@/utils/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

// Paleta categórica sóbria e acessível
const ACCENT = "#7c5cff";
const STATUS_COLORS: Record<string, string> = {
  aguardando_pagamento: "#d4a72c",
  pago: "#2f9e6f",
  enviado: "#3b82c4",
  entregue: "#6b7280",
  cancelado: "#c1544a",
};

export default function SalesReport() {
  const { data, isLoading, isError } = useGetSalesReportQuery();

  if (isLoading)
    return (
      <div className="p-6 text-muted-foreground">Carregando relatórios...</div>
    );
  if (isError || !data)
    return (
      <div className="p-6 text-destructive">
        Não foi possível carregar os relatórios.
      </div>
    );

  const { salesSummary, ordersByStatus, topProducts, revenueByPeriod } = data;

  const statusData = ordersByStatus.map((s) => ({
    ...s,
    label: ORDER_STATUS_LABELS[s.status as OrderStatus] ?? s.status,
    color: STATUS_COLORS[s.status] ?? ACCENT,
  }));

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold">Relatórios de vendas</h1>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Summary label="Pedidos" value={String(salesSummary.totalOrders)} />
        <Summary
          label="Faturamento"
          value={formatBRL(salesSummary.totalRevenue)}
        />
        <Summary
          label="Ticket médio"
          value={formatBRL(salesSummary.averageTicket)}
        />
        <Summary
          label="Aguardando pagto"
          value={String(salesSummary.pendingOrders)}
        />
      </div>

      {/* Faturamento por mês */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Faturamento por mês</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueByPeriod.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sem dados ainda.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={revenueByPeriod}
                margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip formatter={(value) => formatBRL(Number(value))} />
                <Bar
                  dataKey="revenue"
                  name="Faturamento"
                  fill={ACCENT}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pedidos por status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pedidos por status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sem dados ainda.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={statusData}
                  layout="vertical"
                  margin={{ left: 24 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={110}
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <Tooltip />
                  <Bar dataKey="count" name="Pedidos" radius={[0, 4, 4, 0]}>
                    {statusData.map((s) => (
                      <Cell key={s.status} fill={s.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Mais vendidos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Produtos mais vendidos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Unid.</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((p, i) => (
                  <TableRow key={`${p.productId}-${i}`}>
                    <TableCell className="font-medium">
                      {p.productName}
                    </TableCell>
                    <TableCell className="text-right">{p.unitsSold}</TableCell>
                    <TableCell className="text-right">
                      {formatBRL(p.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
                {topProducts.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground"
                    >
                      Sem vendas ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
