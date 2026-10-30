// src/graphql/resolvers.ts
import { GraphQLScalarType, Kind } from 'graphql';
import { sql } from 'drizzle-orm';
import { db } from '../shared/db/index.js';
import { getUserPermissionSet } from '../shared/middleware/rbac.js';
import type { GraphQLContext, PeriodArgs, TopProductsArgs } from './types.js';

// Status que contam como faturamento efetivado
const PAID = sql`('pago','enviado','entregue')`;

const dateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar',
  serialize(value: unknown): string {
    if (value instanceof Date) return value.toISOString();
    throw new Error('DateTime can only serialize Date objects');
  },
  parseValue(value: unknown): Date {
    if (typeof value === 'string') return new Date(value);
    throw new Error('DateTime can only parse string');
  },
  parseLiteral(ast): Date | null {
    return ast.kind === Kind.STRING ? new Date(ast.value) : null;
  },
} as GraphQLScalarType);

const jsonScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar',
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral: (ast) => (ast.kind === Kind.STRING ? JSON.parse(ast.value) : null),
} as GraphQLScalarType);

// Garante que o usuário autenticado pode ver relatórios de vendas
const requireReportAccess = async (context: GraphQLContext) => {
  if (!context.userId) throw new Error('Unauthorized');
  const perms = await getUserPermissionSet(context.userId);
  if (!perms.has('order:manage') && !perms.has('order:view')) {
    throw new Error('Forbidden');
  }
};

export const resolvers = {
  DateTime: dateTimeScalar,
  JSON: jsonScalar,

  Query: {
    salesSummary: async (_p: unknown, _a: unknown, context: GraphQLContext) => {
      await requireReportAccess(context);
      const rows = (await db.execute(sql`
        SELECT
          COUNT(*)::int AS total_orders,
          COALESCE(SUM(total) FILTER (WHERE status IN ${PAID}), 0) AS total_revenue,
          COUNT(*) FILTER (WHERE status IN ${PAID})::int AS paid_orders,
          COUNT(*) FILTER (WHERE status = 'aguardando_pagamento')::int AS pending_orders
        FROM orders
      `)) as unknown as Record<string, unknown>[];
      const r = rows[0] ?? {};
      const totalRevenue = Number(r.total_revenue) || 0;
      const paidOrders = Number(r.paid_orders) || 0;
      return {
        totalOrders: Number(r.total_orders) || 0,
        totalRevenue,
        paidOrders,
        pendingOrders: Number(r.pending_orders) || 0,
        averageTicket: paidOrders > 0 ? totalRevenue / paidOrders : 0,
      };
    },

    ordersByStatus: async (_p: unknown, _a: unknown, context: GraphQLContext) => {
      await requireReportAccess(context);
      const rows = (await db.execute(sql`
        SELECT status, COUNT(*)::int AS count, COALESCE(SUM(total), 0) AS revenue
        FROM orders
        GROUP BY status
        ORDER BY count DESC
      `)) as unknown as Record<string, unknown>[];
      return rows.map((r) => ({
        status: r.status as string,
        count: Number(r.count) || 0,
        revenue: Number(r.revenue) || 0,
      }));
    },

    topProducts: async (_p: unknown, { limit }: TopProductsArgs, context: GraphQLContext) => {
      await requireReportAccess(context);
      const lim = Math.min(Math.max(limit ?? 10, 1), 50);
      const rows = (await db.execute(sql`
        SELECT oi.product_id, oi.product_name,
               SUM(oi.quantity)::int AS units_sold,
               COALESCE(SUM(oi.line_total), 0) AS revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.status IN ${PAID}
        GROUP BY oi.product_id, oi.product_name
        ORDER BY units_sold DESC
        LIMIT ${lim}
      `)) as unknown as Record<string, unknown>[];
      return rows.map((r) => ({
        productId: r.product_id != null ? Number(r.product_id) : null,
        productName: r.product_name as string,
        unitsSold: Number(r.units_sold) || 0,
        revenue: Number(r.revenue) || 0,
      }));
    },

    revenueByPeriod: async (_p: unknown, { granularity }: PeriodArgs, context: GraphQLContext) => {
      await requireReportAccess(context);
      const fmt = granularity === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM';
      const rows = (await db.execute(sql`
        SELECT to_char(created_at, ${fmt}) AS period,
               COUNT(*)::int AS order_count,
               COALESCE(SUM(total), 0) AS revenue
        FROM orders
        WHERE status IN ${PAID}
        GROUP BY period
        ORDER BY period ASC
      `)) as unknown as Record<string, unknown>[];
      return rows.map((r) => ({
        period: r.period as string,
        orderCount: Number(r.order_count) || 0,
        revenue: Number(r.revenue) || 0,
      }));
    },
  },
};
