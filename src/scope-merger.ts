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
        result.select = this.mergeSelect(result.select, scope.select);
      }

      // Override scalar values (last scope wins)
      if (scope.skip !== undefined) result.skip = scope.skip;
      if (scope.take !== undefined) result.take = scope.take;
      if (scope.cache !== undefined) result.cache = scope.cache;
    }

    return result;
  }

  static mergeSelect<T>(current: any, next: any): any {
    if (current === undefined || current === null) {
      return this.cloneSelect(next);
    }

    if (next === undefined || next === null) {
      return this.cloneSelect(current);
    }

    const currentIsObject = this.isPlainObject(current);
    const nextIsObject = this.isPlainObject(next);

    if (currentIsObject && nextIsObject) {
      const merged: Record<string, any> = { ...current };

      for (const [key, value] of Object.entries(next)) {
        merged[key] = this.mergeSelect(merged[key], value);
      }

      return merged;
    }

    if (nextIsObject) {
      return this.cloneSelect(next);
    }

    if (currentIsObject) {
      return this.cloneSelect(current);
    }

    return Boolean(current) || Boolean(next);
  }

  private static cloneSelect(value: any): any {
    if (Array.isArray(value)) {
      return [...value];
    }

    if (this.isPlainObject(value)) {
      const cloned: Record<string, any> = {};
      for (const [key, nestedValue] of Object.entries(value)) {
        cloned[key] = this.cloneSelect(nestedValue);
      }
      return cloned;
    }

    return value;
  }

  private static isPlainObject(value: any): value is Record<string, any> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }
}
