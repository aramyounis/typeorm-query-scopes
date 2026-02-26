export { Scopes, DefaultScope } from './decorators';
export { ScopedRepository } from './scoped-repository';
export { ScopeMetadataStorage } from './metadata';
export { ScopeMerger } from './scope-merger';
export type { ScopeOptions, ScopeFunction, ScopeDefinition, ScopeMetadata, ScopeName, ExtractScopeNames } from './types';

// Helper function to create a scoped repository
import { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import { ScopedRepository } from './scoped-repository';

/**
 * Create a scoped repository for an entity
 * @example
 * const userRepo = getScopedRepository(User, dataSource);
 * const activeUsers = await userRepo.scope('active').find();
 */
export function getScopedRepository<Entity extends ObjectLiteral, EntityClass extends new (...args: any[]) => Entity = any>(
  entity: EntityClass,
  dataSource: DataSource
): ScopedRepository<Entity, EntityClass> {
  return new ScopedRepository<Entity, EntityClass>(entity, dataSource);
}
