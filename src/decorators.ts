import { ScopeMetadataStorage } from './metadata';
import { ScopeDefinition, ScopeOptions } from './types';

/**
 * Decorator to define scopes on an entity with type-safe scope names
 * @example
 * // Without type-safe names:
 * @Scopes<User>({
 *   active: { where: { isActive: true } }
 * })
 * 
 * // With type-safe names:
 * @Scopes<User, { active: any; verified: any }>({
 *   active: { where: { isActive: true } },
 *   verified: { where: { isVerified: true } }
 * })
 * @Entity()
 * class User { ... }
 */
export function Scopes<T, S extends Record<string, ScopeDefinition<T>> = Record<string, ScopeDefinition<T>>>(scopes: S) {
  return function <C extends new (...args: any[]) => T>(target: C): C & { __scopeNames?: keyof S } {
    Object.entries(scopes).forEach(([name, scope]) => {
      ScopeMetadataStorage.addScope<T>(target, name, scope);
    });
    
    return target as C & { __scopeNames?: keyof S };
  };
}

/**
 * Decorator to define a default scope on an entity
 * @example
 * @DefaultScope<User>({ where: { isActive: true } })
 * @Entity()
 * class User { ... }
 */
export function DefaultScope<T>(scope: ScopeOptions<T>) {
  return function (target: Function) {
    ScopeMetadataStorage.setDefaultScope<T>(target, scope);
  };
}
