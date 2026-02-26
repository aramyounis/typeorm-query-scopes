import { Repository, FindManyOptions, FindOneOptions, ObjectLiteral, EntityTarget, DataSource } from 'typeorm';
import { ScopeMetadataStorage } from './metadata';
import { ScopeMerger } from './scope-merger';
import { ScopeOptions, ScopeDefinition } from './types';

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

    return ScopeMerger.merge(...scopesToApply) as FindManyOptions<Entity>;
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
