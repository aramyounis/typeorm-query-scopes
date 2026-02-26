import { FindManyOptions, FindOptionsWhere, FindOptionsOrder, FindOptionsRelations } from 'typeorm';

export type ScopeOptions<T> = {
  where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
  relations?: FindOptionsRelations<T>;
  order?: FindOptionsOrder<T>;
  skip?: number;
  take?: number;
  select?: (keyof T)[];
  cache?: boolean | number;
};

export type ScopeFunction<T> = (...args: any[]) => ScopeOptions<T>;

export type ScopeDefinition<T> = ScopeOptions<T> | ScopeFunction<T>;

export interface ScopeMetadata<T = any> {
  defaultScope?: ScopeOptions<T>;
  scopes: Map<string, ScopeDefinition<T>>;
}

// Type-safe scope names
export type ScopeName<T> = T extends { __scopeNames?: infer S } ? S : string;

// Helper type to extract scope names from scope definitions
export type ExtractScopeNames<T> = T extends Record<infer K, any> ? K : never;
