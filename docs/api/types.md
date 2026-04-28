# Type Definitions

TypeScript type definitions used in TypeORM Scopes.

## ScopeOptions

Options that can be included in a scope definition.

```typescript
type ScopeOptions<T> = {
  where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
  relations?: FindOptionsRelations<T>;
  relationScopes?: RelationScopes;
  order?: FindOptionsOrder<T>;
  skip?: number;
  take?: number;
  select?: FindOptionsSelect<T>;
  cache?: boolean | number;
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `where` | `FindOptionsWhere<T>` | Filter conditions |
| `relations` | `FindOptionsRelations<T>` | Relations to load |
| `relationScopes` | `RelationScopes` | Apply scopes to related entities |
| `order` | `FindOptionsOrder<T>` | Sorting options |
| `skip` | `number` | Records to skip (pagination) |
| `take` | `number` | Records to take (limit) |
| `select` | `FindOptionsSelect<T>` | Type-safe field selection tree |
| `cache` | `boolean \| number` | Query caching |

### Example

```typescript
const scopeOptions: ScopeOptions<User> = {
  where: { isActive: true },
  select: {
    id: true,
    email: true,
    name: true
  },
  relations: { posts: true },
  relationScopes: { 'posts.author': ['active'] },
  order: { createdAt: 'DESC' },
  take: 10
};
```

---

## ScopeFunction

A function that returns scope options, allowing dynamic scopes with parameters.

```typescript
type ScopeFunction<T> = (...args: any[]) => ScopeOptions<T>
```

### Example

```typescript
const byRole: ScopeFunction<User> = (role: string) => ({
  where: { role }
});

const createdBetween: ScopeFunction<User> = (start: Date, end: Date) => ({
  where: {
    createdAt: Between(start, end)
  }
});
```

---

## ScopeCall

Represents a scope call by name or function invocation.

```typescript
type ScopeCall = string | { method: [string, ...any[]] }
```

### Examples

```typescript
const staticCall: ScopeCall = 'active';

const functionCall: ScopeCall = {
  method: ['byTenant', 42]
};
```

---

## RelationScopes

Map relation paths to one or more scope calls.

```typescript
type RelationScopes = Record<string, ScopeCall | ScopeCall[]>
```

### Examples

```typescript
const relationScopes: RelationScopes = {
  role: ['adminOnly'],
  'profile.company': ['verified', { method: ['byRegion', 'eu'] }]
};
```

### Notes

- Keys are relation paths from the root entity.
- Values are scope calls that exist on the related entity.
- Related entity default scope is also applied.

---

## ScopeDefinition

Union type representing either static scope options or a scope function.

```typescript
type ScopeDefinition<T> = ScopeOptions<T> | ScopeFunction<T>
```

### Example

```typescript
const scopes: Record<string, ScopeDefinition<User>> = {
  // Static scope
  verified: {
    where: { isVerified: true }
  },
  
  // Function scope
  byRole: (role: string) => ({
    where: { role }
  })
};
```

---

## ScopeMetadata

Internal metadata structure storing scope definitions for an entity.

```typescript
interface ScopeMetadata<T = any> {
  defaultScope?: ScopeOptions<T>;
  scopes: Map<string, ScopeDefinition<T>>;
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `defaultScope` | `ScopeOptions<T>` | Default scope (optional) |
| `scopes` | `Map<string, ScopeDefinition<T>>` | Named scopes |

### Note

This is an internal type used by the metadata storage system. You typically don't need to use this directly.

---

## ScopeName

Type helper for extracting scope names from an entity class.

```typescript
type ScopeName<T> = T extends { __scopeNames?: infer S } ? S : string
```

### Usage

Used internally for type-safe scope names:

```typescript
@Scopes<User, {
  verified: any;
  admin: any;
}>({ ... })
class User {
  // TypeScript adds: __scopeNames?: 'verified' | 'admin'
}

// ScopeName<typeof User> = 'verified' | 'admin'
```

---

## ExtractScopeNames

Type helper for extracting scope names from scope definitions.

```typescript
type ExtractScopeNames<T> = T extends Record<infer K, any> ? K : never
```

### Example

```typescript
type MyScopes = {
  verified: any;
  admin: any;
  active: any;
};

type Names = ExtractScopeNames<MyScopes>;
// Names = 'verified' | 'admin' | 'active'
```

---

## Type-Safe Scope Names

When using the second generic parameter in `@Scopes`, TypeScript can validate scope names:

```typescript
@Scopes<User, {
  verified: any;
  admin: any;
  byRole: any;
}>({
  verified: { where: { isVerified: true } },
  admin: { where: { role: 'admin' } },
  byRole: (role: string) => ({ where: { role } })
})
@Entity()
class User { ... }

const repo = getScopedRepository(User, dataSource);

// ✅ Valid - TypeScript knows these scope names
repo.scope('verified')
repo.scope('admin')
repo.scope({ method: ['byRole', 'moderator'] })

// ❌ TypeScript error - invalid scope name
repo.scope('invalid')
```

---

## TypeORM Types

TypeORM Scopes uses TypeORM's type definitions:

### FindOptionsWhere

```typescript
import { FindOptionsWhere } from 'typeorm';

const where: FindOptionsWhere<User> = {
  isActive: true,
  role: 'admin'
};
```

### FindOptionsRelations

```typescript
import { FindOptionsRelations } from 'typeorm';

const relations: FindOptionsRelations<User> = {
  posts: true,
  comments: {
    user: true
  }
};
```

### FindOptionsOrder

```typescript
import { FindOptionsOrder } from 'typeorm';

const order: FindOptionsOrder<User> = {
  createdAt: 'DESC',
  name: 'ASC'
};
```

### FindManyOptions

```typescript
import { FindManyOptions } from 'typeorm';

const options: FindManyOptions<User> = {
  where: { isActive: true },
  relations: { posts: true },
  order: { createdAt: 'DESC' },
  take: 10,
  skip: 0
};
```

---

## Generic Type Parameters

### Entity Type Parameter

Most types accept a generic `T` representing the entity:

```typescript
// T = User
ScopeOptions<User>
ScopeFunction<User>
ScopeDefinition<User>
```

### Scope Names Type Parameter

The `@Scopes` decorator accepts an optional second parameter for scope names:

```typescript
@Scopes<
  User,                    // Entity type
  {                        // Scope names type
    verified: any;
    admin: any;
  }
>({ ... })
```

---

## Utility Types

### Partial Scope Options

Create partial scope options:

```typescript
const partialScope: Partial<ScopeOptions<User>> = {
  where: { isActive: true }
  // Other properties optional
};
```

### Required Scope Options

Require all scope options:

```typescript
const fullScope: Required<ScopeOptions<User>> = {
  where: { isActive: true },
  relations: {},
  order: {},
  skip: 0,
  take: 10,
  select: { id: true },
  cache: false
};
```

---

## Type Guards

### Check if Scope is Function

```typescript
function isScopeFunction<T>(
  scope: ScopeDefinition<T>
): scope is ScopeFunction<T> {
  return typeof scope === 'function';
}

// Usage
if (isScopeFunction(scopeDef)) {
  const options = scopeDef('admin');
} else {
  const options = scopeDef;
}
```

---

## See Also

- [Decorators API](/api/decorators)
- [ScopedRepository API](/api/scoped-repository)
- [Type-Safe Scopes Guide](/guide/type-safe-scopes)
- [TypeORM Documentation](https://typeorm.io/)
