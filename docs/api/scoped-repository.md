# ScopedRepository

API reference for the ScopedRepository class.

## Overview

`ScopedRepository` is a wrapper around TypeORM's `Repository` that adds scope functionality. It provides methods to apply scopes and execute queries.

## Creating a Scoped Repository

### getScopedRepository

Create a scoped repository for an entity.

```typescript
function getScopedRepository<Entity, EntityClass>(
  entity: EntityClass,
  dataSource: DataSource
): ScopedRepository<Entity, EntityClass>
```

#### Parameters

- `entity` - Entity class
- `dataSource` - TypeORM DataSource instance

#### Returns

`ScopedRepository` instance

#### Example

```typescript
import { getScopedRepository } from 'typeorm-query-scopes';
import { dataSource } from './data-source';
import { User } from './entities/User';

const userRepo = getScopedRepository(User, dataSource);
```

---

## Methods

### scope()

Apply one or more scopes to the repository.

```typescript
scope(...scopeNames: (string | { method: [string, ...any[]] } | null)[]): ScopedRepository
```

#### Parameters

- `scopeNames` - Scope names or function scope calls
  - `string` - Named scope
  - `{ method: [name, ...args] }` - Function scope with parameters
  - `null` or `'defaultScope'` - Explicitly include default scope

#### Returns

New `ScopedRepository` instance with scopes applied (chainable)

#### Examples

**Single Scope**
```typescript
const users = await userRepo.scope('verified').find();
```

**Multiple Scopes**
```typescript
const users = await userRepo.scope('verified', 'admin').find();
```

**Function Scope**
```typescript
const users = await userRepo
  .scope({ method: ['byRole', 'moderator'] })
  .find();
```

**Multiple Parameters**
```typescript
const users = await userRepo
  .scope({ method: ['createdBetween', startDate, endDate] })
  .find();
```

**Explicit Default Scope**
```typescript
const users = await userRepo
  .scope('defaultScope', 'verified')
  .find();
```

#### Notes

- Returns a new instance (immutable)
- Scopes are applied in order
- Can be chained multiple times

---

### unscoped()

Remove all scopes including the default scope.

```typescript
unscoped(): ScopedRepository
```

#### Returns

New `ScopedRepository` instance with no scopes

#### Example

```typescript
// Get all users, including inactive
const allUsers = await userRepo.unscoped().find();
```

#### Use Cases

- Admin views that need to see all records
- Maintenance operations
- Data exports
- Debugging

---

### find()

Find entities with applied scopes.

```typescript
find(options?: FindManyOptions<Entity>): Promise<Entity[]>
```

#### Parameters

- `options` - TypeORM find options (optional)

#### Returns

Promise resolving to array of entities

#### Examples

**Basic**
```typescript
const users = await userRepo.scope('verified').find();
```

**With Additional Options**
```typescript
const users = await userRepo.scope('verified').find({
  take: 10,
  skip: 0,
  order: { createdAt: 'DESC' }
});
```

**With Relation Scopes**
```typescript
const users = await userRepo.scope('withRoleScopes').find({
  relationScopes: {
    role: ['active']
  }
});
```

**Multiple Scopes**
```typescript
const users = await userRepo
  .scope('verified', 'withPosts')
  .find({ take: 20 });
```

---

### findOne()

Find a single entity with applied scopes.

```typescript
findOne(options: FindOneOptions<Entity>): Promise<Entity | null>
```

#### Parameters

- `options` - TypeORM find one options

#### Returns

Promise resolving to entity or null

#### Example

```typescript
const user = await userRepo.scope('verified').findOne({
  where: { id: 1 }
});
```

---

### findOneBy()

Find a single entity by conditions with applied scopes.

```typescript
findOneBy(where: FindOptionsWhere<Entity>): Promise<Entity | null>
```

#### Parameters

- `where` - Where conditions

#### Returns

Promise resolving to entity or null

#### Example

```typescript
const user = await userRepo.scope('verified').findOneBy({
  email: 'user@example.com'
});
```

---

### count()

Count entities with applied scopes.

```typescript
count(options?: FindManyOptions<Entity>): Promise<number>
```

#### Parameters

- `options` - TypeORM find options (optional)

#### Returns

Promise resolving to count

#### Examples

**Basic**
```typescript
const count = await userRepo.scope('verified').count();
```

**With Conditions**
```typescript
const count = await userRepo.scope('verified').count({
  where: { role: 'admin' }
});
```

---

### findAndCount()

Find entities and count total with applied scopes.

```typescript
findAndCount(options?: FindManyOptions<Entity>): Promise<[Entity[], number]>
```

#### Parameters

- `options` - TypeORM find options (optional)

#### Returns

Promise resolving to tuple of [entities, total count]

#### Example

```typescript
const [users, total] = await userRepo
  .scope('verified')
  .findAndCount({ take: 10, skip: 0 });

console.log(`Found ${users.length} users out of ${total} total`);
```

#### Use Cases

- Pagination
- Displaying "X of Y results"
- Infinite scroll
- Table views with total count

---

## Scope Merging

When multiple scopes are applied, they are merged intelligently:

### WHERE Conditions

Merged using AND logic:

```typescript
@Scopes<User>({
  verified: { where: { isVerified: true } },
  active: { where: { isActive: true } }
})

// Results in: WHERE isVerified = true AND isActive = true
await userRepo.scope('verified', 'active').find();
```

### SELECT Fields

Combined (union):

```typescript
@Scopes<User>({
  basicFields: { select: ['id', 'name'] },
  emailField: { select: ['email'] }
})

// Results in: SELECT id, name, email
await userRepo.scope('basicFields', 'emailField').find();
```

### Relations

Combined (union):

```typescript
@Scopes<User>({
  withPosts: { relations: { posts: true } },
  withComments: { relations: { comments: true } }
})

// Results in: loads both posts and comments
await userRepo.scope('withPosts', 'withComments').find();
```

### Order

Later scopes override earlier ones:

```typescript
@Scopes<User>({
  byName: { order: { name: 'ASC' } },
  byDate: { order: { createdAt: 'DESC' } }
})

// Results in: ORDER BY createdAt DESC (byDate wins)
await userRepo.scope('byName', 'byDate').find();
```

### Skip/Take/Cache

Last scope wins:

```typescript
@Scopes<User>({
  first10: { take: 10 },
  first20: { take: 20 }
})

// Results in: LIMIT 20 (first20 wins)
await userRepo.scope('first10', 'first20').find();
```

---

## Chaining

All methods return new instances, allowing chaining:

```typescript
const repo = getScopedRepository(User, dataSource);

const users = await repo
  .scope('verified')
  .scope('active')
  .scope({ method: ['byRole', 'admin'] })
  .find({ take: 10 });
```

Equivalent to:

```typescript
const users = await repo
  .scope('verified', 'active', { method: ['byRole', 'admin'] })
  .find({ take: 10 });
```

---

## Type Safety

With type-safe scopes, TypeScript validates scope names:

```typescript
@Scopes<User, {
  verified: any;
  admin: any;
}>({ ... })

const repo = getScopedRepository(User, dataSource);

// ✅ TypeScript knows these are valid
repo.scope('verified')
repo.scope('admin')

// ❌ TypeScript error
repo.scope('invalid')
```

---

## Best Practices

### 1. Reuse Repository Instances

```typescript
class UserService {
  private userRepo = getScopedRepository(User, dataSource);
  
  async getVerified() {
    return this.userRepo.scope('verified').find();
  }
}
```

### 2. Combine with Additional Options

```typescript
// Scopes for common patterns, options for specifics
const users = await userRepo
  .scope('verified', 'withPosts')
  .find({
    where: { country: 'US' },
    take: 10
  });
```

### 3. Use Unscoped Carefully

```typescript
// Document why unscoped is needed
async getAllUsersForExport() {
  // Need all users including inactive for export
  return this.userRepo.unscoped().find();
}
```

---

## See Also

- [Decorators API](/api/decorators)
- [Type Definitions](/api/types)
- [Scope Merging Guide](/guide/scope-merging)
- [Examples](/examples/basic)
