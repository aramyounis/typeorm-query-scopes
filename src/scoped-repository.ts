import { Repository, FindManyOptions, FindOneOptions, ObjectLiteral, EntityTarget, DataSource } from 'typeorm';
import { ScopeMetadataStorage } from './metadata';
import { ScopeMerger } from './scope-merger';
import { ScopeOptions, ScopeCall } from './types';

// Helper type to extract scope names from entity class
type ExtractScopeNames<T> = T extends { __scopeNames?: infer S } ? S : string;

export class ScopedRepository<Entity extends ObjectLiteral, EntityClass = any> {
  private appliedScopes: ScopeOptions<Entity>[] = [];
  private includeDefaultScope = true;

  constructor(
    private target: EntityTarget<Entity>,
    private dataSource: DataSource
  ) {}

  private get repository(): Repository<Entity> {
    return this.dataSource.getRepository(this.target);
  }

  /**
   * Apply one or more scopes to the repository
   * @example
   * userRepo.scope('active', 'withPosts').find()
   * userRepo.scope({ method: ['byRole', 'admin'] }).find()
   */
  scope(...scopeNames: (ExtractScopeNames<EntityClass> | { method: [ExtractScopeNames<EntityClass>, ...any[]] } | null)[]): ScopedRepository<Entity, EntityClass> {
    const cloned = this.clone();
    const metadata = ScopeMetadataStorage.getMetadata(this.getEntityConstructor());

    for (const scopeName of scopeNames) {
      if (scopeName === null || scopeName === 'defaultScope') {
        cloned.includeDefaultScope = true;
        continue;
      }

      if (typeof scopeName === 'string') {
        const scopeDef = metadata.scopes.get(scopeName);
        if (!scopeDef) {
          throw new Error(`Scope "${scopeName}" not found on entity`);
        }

        const scopeOptions = typeof scopeDef === 'function' ? scopeDef() : scopeDef;
        cloned.appliedScopes.push(scopeOptions);
      } else if (typeof scopeName === 'object' && 'method' in scopeName && scopeName.method) {
        const [name, ...args] = scopeName.method;
        const scopeDef = metadata.scopes.get(name as string);
        if (!scopeDef) {
          throw new Error(`Scope "${String(name)}" not found on entity`);
        }
        if (typeof scopeDef !== 'function') {
          throw new Error(`Scope "${String(name)}" is not a function`);
        }

        const scopeOptions = scopeDef(...args);
        cloned.appliedScopes.push(scopeOptions);
      }
    }

    return cloned;
  }

  /**
   * Remove the default scope
   * @example
   * userRepo.unscoped().find()
   */
  unscoped(): ScopedRepository<Entity, EntityClass> {
    const cloned = this.clone();
    cloned.includeDefaultScope = false;
    cloned.appliedScopes = [];
    return cloned;
  }

  /**
   * Get merged find options with all applied scopes
   */
  private getMergedOptions(options: FindManyOptions<Entity> = {}): FindManyOptions<Entity> {
    const scopesToApply: ScopeOptions<Entity>[] = [];

    // Add default scope if enabled
    if (this.includeDefaultScope) {
      const metadata = ScopeMetadataStorage.getMetadata(this.getEntityConstructor());
      if (metadata.defaultScope) {
        scopesToApply.push(metadata.defaultScope);
      }
    }

    // Add applied scopes
    scopesToApply.push(...this.appliedScopes);

    // Add user-provided options
    scopesToApply.push(options as ScopeOptions<Entity>);

    const merged = ScopeMerger.merge(...scopesToApply) as FindManyOptions<Entity> & ScopeOptions<Entity>;
    return this.applyRelationScopes(merged) as FindManyOptions<Entity>;
  }

  private applyRelationScopes(options: ScopeOptions<Entity>): ScopeOptions<Entity> {
    if (!options.relationScopes || Object.keys(options.relationScopes).length === 0) {
      return options;
    }

    const result: ScopeOptions<Entity> = {
      ...options,
      where: this.cloneValue(options.where),
      relations: this.cloneValue(options.relations),
      order: this.cloneValue(options.order),
    };

    for (const [relationPath, configuredCalls] of Object.entries(options.relationScopes)) {
      const scopeCalls = Array.isArray(configuredCalls) ? configuredCalls : [configuredCalls];
      const relationTarget = this.getRelationTarget(relationPath);
      const relationMetadata = ScopeMetadataStorage.getMetadata(relationTarget);

      const relationScopes: ScopeOptions<any>[] = [];
      if (relationMetadata.defaultScope) {
        relationScopes.push(relationMetadata.defaultScope);
      }

      for (const scopeCall of scopeCalls) {
        relationScopes.push(this.resolveScopeCall(relationMetadata.scopes, scopeCall, relationPath));
      }

      const mergedRelationScope = ScopeMerger.merge(...relationScopes);

      // Ensure requested relation path is loaded.
      this.setNestedValue(result, 'relations', relationPath, true);

      // Apply relation where/order under the relation path on parent find options.
      if (mergedRelationScope.where) {
        this.setNestedValue(result, 'where', relationPath, mergedRelationScope.where);
      }
      if (mergedRelationScope.order) {
        this.setNestedValue(result, 'order', relationPath, mergedRelationScope.order);
      }
      if (mergedRelationScope.relations) {
        const existing = this.getNestedValue(result.relations, relationPath);
        const nestedRelations = ScopeMerger.merge({ relations: existing as any }, { relations: mergedRelationScope.relations as any }).relations;
        this.setNestedValue(result, 'relations', relationPath, nestedRelations);
      }
    }

    delete result.relationScopes;
    return result;
  }

  private resolveScopeCall(
    scopes: Map<string, any>,
    scopeCall: ScopeCall,
    relationPath: string
  ): ScopeOptions<any> {
    if (typeof scopeCall === 'string') {
      const scopeDef = scopes.get(scopeCall);
      if (!scopeDef) {
        throw new Error(`Scope "${scopeCall}" not found on relation "${relationPath}"`);
      }
      return typeof scopeDef === 'function' ? scopeDef() : scopeDef;
    }

    const [name, ...args] = scopeCall.method;
    const scopeDef = scopes.get(name);
    if (!scopeDef) {
      throw new Error(`Scope "${name}" not found on relation "${relationPath}"`);
    }
    if (typeof scopeDef !== 'function') {
      throw new Error(`Scope "${name}" on relation "${relationPath}" is not a function`);
    }

    return scopeDef(...args);
  }

  private getRelationTarget(relationPath: string): Function {
    let metadata = this.dataSource.getMetadata(this.target);
    const parts = relationPath.split('.');

    for (const part of parts) {
      const relation = metadata.findRelationWithPropertyPath(part);
      if (!relation) {
        throw new Error(`Relation "${relationPath}" not found on entity`);
      }
      metadata = relation.inverseEntityMetadata;
    }

    return metadata.target as Function;
  }

  private setNestedValue(target: any, field: 'where' | 'relations' | 'order', path: string, value: any): void {
    if (!target[field]) {
      target[field] = {};
    }

    const parts = path.split('.');
    let cursor = target[field];

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!cursor[part] || typeof cursor[part] !== 'object') {
        cursor[part] = {};
      }
      cursor = cursor[part];
    }

    const last = parts[parts.length - 1];
    const existing = cursor[last];
    if (existing && typeof existing === 'object' && typeof value === 'object') {
      cursor[last] = { ...existing, ...value };
      return;
    }
    cursor[last] = value;
  }

  private getNestedValue(target: any, path: string): any {
    if (!target || typeof target !== 'object') {
      return undefined;
    }

    return path.split('.').reduce((acc, part) => {
      if (!acc || typeof acc !== 'object') {
        return undefined;
      }
      return acc[part];
    }, target);
  }

  private cloneValue<T>(value: T): T {
    if (value === undefined || value === null) {
      return value;
    }

    if (Array.isArray(value)) {
      return [...value] as unknown as T;
    }

    if (typeof value === 'object') {
      return { ...(value as object) } as T;
    }

    return value;
  }

  /**
   * Find entities with applied scopes
   */
  async find(options?: FindManyOptions<Entity>): Promise<Entity[]> {
    const mergedOptions = this.getMergedOptions(options);
    return this.repository.find(mergedOptions);
  }

  /**
   * Find one entity with applied scopes
   */
  async findOne(options: FindOneOptions<Entity>): Promise<Entity | null> {
    const mergedOptions = this.getMergedOptions(options as FindManyOptions<Entity>);
    return this.repository.findOne(mergedOptions as FindOneOptions<Entity>);
  }

  /**
   * Find one entity by ID with applied scopes
   */
  async findOneBy(where: any): Promise<Entity | null> {
    return this.findOne({ where });
  }

  /**
   * Count entities with applied scopes
   */
  async count(options?: FindManyOptions<Entity>): Promise<number> {
    const mergedOptions = this.getMergedOptions(options);
    return this.repository.count(mergedOptions);
  }

  /**
   * Find and count entities with applied scopes
   */
  async findAndCount(options?: FindManyOptions<Entity>): Promise<[Entity[], number]> {
    const mergedOptions = this.getMergedOptions(options);
    return this.repository.findAndCount(mergedOptions);
  }

  private clone(): ScopedRepository<Entity, EntityClass> {
    const cloned = new ScopedRepository<Entity, EntityClass>(this.target, this.dataSource);
    cloned.appliedScopes = [...this.appliedScopes];
    cloned.includeDefaultScope = this.includeDefaultScope;
    return cloned;
  }

  private getEntityConstructor(): Function {
    if (typeof this.target === 'function') {
      return this.target;
    }
    throw new Error('Entity target must be a constructor function');
  }
}
