import { ScopeMetadata } from './types';

const SCOPE_METADATA_KEY = Symbol('typeorm:scopes');

export class ScopeMetadataStorage {
  private static storage = new Map<Function, ScopeMetadata>();

  static getMetadata<T>(target: Function): ScopeMetadata<T> {
    if (!this.storage.has(target)) {
      this.storage.set(target, {
        scopes: new Map(),
      });
    }
    return this.storage.get(target)!;
  }

  static setDefaultScope<T>(target: Function, scope: any): void {
    const metadata = this.getMetadata<T>(target);
    metadata.defaultScope = scope;
  }

  static addScope<T>(target: Function, name: string, scope: any): void {
    const metadata = this.getMetadata<T>(target);
    metadata.scopes.set(name, scope);
  }
}
