// src/graphql/types.ts
export interface GraphQLContext {
  userId?: string;
}

export interface PeriodArgs {
  granularity?: 'day' | 'month';
}

export interface TopProductsArgs {
  limit?: number;
}
