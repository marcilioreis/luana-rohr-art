// src/graphql/schema.ts
export const typeDefs = `#graphql
  scalar JSON
  scalar DateTime

  type SalesSummary {
    totalOrders: Int!
    totalRevenue: Float!
    paidOrders: Int!
    pendingOrders: Int!
    averageTicket: Float!
  }

  type StatusBucket {
    status: String!
    count: Int!
    revenue: Float!
  }

  type TopProduct {
    productId: Int
    productName: String!
    unitsSold: Int!
    revenue: Float!
  }

  type RevenuePoint {
    period: String!
    orderCount: Int!
    revenue: Float!
  }

  type Query {
    # Resumo geral de vendas (faturamento considera pedidos pagos/enviados/entregues)
    salesSummary: SalesSummary!

    # Contagem e faturamento por status de pedido
    ordersByStatus: [StatusBucket!]!

    # Produtos mais vendidos
    topProducts(limit: Int): [TopProduct!]!

    # Faturamento por período (dia ou mês)
    revenueByPeriod(granularity: String): [RevenuePoint!]!
  }
`;
