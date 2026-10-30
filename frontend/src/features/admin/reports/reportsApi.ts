import { api } from "../../../lib/api";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface SalesReport {
  salesSummary: {
    totalOrders: number;
    totalRevenue: number;
    paidOrders: number;
    pendingOrders: number;
    averageTicket: number;
  };
  ordersByStatus: Array<{ status: string; count: number; revenue: number }>;
  topProducts: Array<{
    productId: number | null;
    productName: string;
    unitsSold: number;
    revenue: number;
  }>;
  revenueByPeriod: Array<{
    period: string;
    orderCount: number;
    revenue: number;
  }>;
}

const QUERY = `{
  salesSummary { totalOrders totalRevenue paidOrders pendingOrders averageTicket }
  ordersByStatus { status count revenue }
  topProducts(limit: 8) { productId productName unitsSold revenue }
  revenueByPeriod(granularity: "month") { period orderCount revenue }
}`;

export const reportsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSalesReport: builder.query<SalesReport, void>({
      queryFn: async () => {
        try {
          const token = localStorage.getItem("auth-token");
          const res = await fetch(`${API_BASE}/graphql`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ query: QUERY }),
          });
          const json = await res.json();
          if (json.errors) {
            return {
              error: {
                status: 400,
                data: json.errors[0]?.message ?? "Erro GraphQL",
              },
            };
          }
          return { data: json.data as SalesReport };
        } catch (e) {
          const message = e instanceof Error ? e.message : "Erro de rede";
          return { error: { status: 500, data: message } };
        }
      },
    }),
  }),
});

export const { useGetSalesReportQuery } = reportsApi;
