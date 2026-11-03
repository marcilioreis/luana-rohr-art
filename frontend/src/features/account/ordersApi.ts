import { api } from "../../lib/api";
import type { Order, OrderStatus, CheckoutPayload } from "./orders.types";

export interface ExportStatus {
  id: number;
  status: "pendente" | "processando" | "concluido" | "falha";
  downloadLink: string | null;
}

export interface ShippingQuote {
  uf: string;
  region: "norte" | "nordeste" | "centro_oeste" | "sudeste" | "sul" | null;
  fee: number;
}

export const ordersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ---- Cliente ----
    createOrder: builder.mutation<Order, CheckoutPayload>({
      query: (body) => ({ url: "/orders", method: "POST", body }),
      invalidatesTags: ["Order"],
    }),
    getMyOrders: builder.query<Order[], void>({
      query: () => "/orders/mine",
      providesTags: ["Order"],
    }),
    getOrder: builder.query<Order, number>({
      query: (id) => `/orders/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Order", id }],
    }),
    // Acesso público por token (checkout de convidado — reabre pedido/PIX)
    getOrderByToken: builder.query<Order, string>({
      query: (token) => `/orders/track/${token}`,
      providesTags: (_r, _e, token) => [{ type: "Order", id: token }],
    }),
    // Cotação de frete por UF (pública) — usada no checkout
    getShippingQuote: builder.query<ShippingQuote, string>({
      query: (uf) => `/orders/shipping-quote?uf=${uf}`,
    }),

    // ---- Admin ----
    getAdminOrders: builder.query<Order[], { status?: OrderStatus } | void>({
      query: (args) => {
        const status = args && "status" in args ? args.status : undefined;
        return status ? `/orders?status=${status}` : "/orders";
      },
      providesTags: ["AdminOrder"],
    }),
    updateOrderStatus: builder.mutation<
      Order,
      { id: number; status: OrderStatus }
    >({
      query: ({ id, status }) => ({
        url: `/orders/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "AdminOrder", id },
        "AdminOrder",
        { type: "Order", id },
      ],
    }),
    confirmPayment: builder.mutation<Order, number>({
      query: (id) => ({ url: `/orders/${id}/confirm-payment`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "AdminOrder", id },
        "AdminOrder",
        { type: "Order", id },
      ],
    }),

    // ---- Exportação (BullMQ) ----
    requestExport: builder.mutation<
      { exportId: number; status: string },
      { format: "csv" | "xlsx" | "pdf"; filters?: { status?: OrderStatus } }
    >({
      query: (body) => ({ url: "/orders/exports", method: "POST", body }),
    }),
    getExportStatus: builder.query<ExportStatus, number>({
      query: (exportId) => `/orders/exports/${exportId}/status`,
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useGetMyOrdersQuery,
  useGetOrderQuery,
  useGetOrderByTokenQuery,
  useLazyGetShippingQuoteQuery,
  useGetAdminOrdersQuery,
  useUpdateOrderStatusMutation,
  useConfirmPaymentMutation,
  useRequestExportMutation,
  useLazyGetExportStatusQuery,
} = ordersApi;
