import { ScopeOptions } from './types';

export class ScopeMerger {
  /**
   * Merges multiple scope options into a single options object
   * Similar to Sequelize's scope merging behavior
   */
  static merge<T>(...scopes: ScopeOptions<T>[]): ScopeOptions<T> {
    const result: ScopeOptions<T> = {};

    for (const scope of scopes) {
      // Merge where conditions using AND logic
      if (scope.where) {
        if (!result.where) {
          result.where = Array.isArray(scope.where) ? [...scope.where] : { ...scope.where };
        } else {
          // Merge where conditions
          if (Array.isArray(result.where) && Array.isArray(scope.where)) {
            result.where = [...result.where, ...scope.where];
          } else if (Array.isArray(result.where)) {
            result.where = [...result.where, scope.where as any];
          } else if (Array.isArray(scope.where)) {
            result.where = [result.where, ...scope.where] as any;
          } else {
            result.where = { ...result.where, ...scope.where };
          }
        }
      }

      // Merge relations
      if (scope.relations) {
        result.relations = {
          ...(result.relations || {}),
          ...scope.relations,
        };
      }

      // Merge relation scopes by relation path
      if (scope.relationScopes) {
        const mergedRelationScopes = { ...(result.relationScopes || {}) };

        for (const [path, scopeCalls] of Object.entries(scope.relationScopes)) {
          const current = mergedRelationScopes[path];
          const currentList = current ? (Array.isArray(current) ? current : [current]) : [];
          const nextList = Array.isArray(scopeCalls) ? scopeCalls : [scopeCalls];
          mergedRelationScopes[path] = [...currentList, ...nextList];
        }

        result.relationScopes = mergedRelationScopes;
      }

      // Merge order (later scopes override)
      if (scope.order) {
        result.order = {
          ...(result.order || {}),
          ...scope.order,
        };
      }

      // Merge select (combine unique fields)
      if (scope.select) {
        if (!result.select) {
          result.select = [...scope.select];
        } else {
          const combined = new Set([...result.select, ...scope.select]);
          result.select = Array.from(combined);
        }
      }

      // Override scalar values (last scope wins)
      if (scope.skip !== undefined) result.skip = scope.skip;
      if (scope.take !== undefined) result.take = scope.take;
      if (scope.cache !== undefined) result.cache = scope.cache;
    }

    return result;
  }
}
