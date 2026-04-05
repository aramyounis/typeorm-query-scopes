# Decorators

API reference for TypeORM Scopes decorators.

## @Scopes

Define named scopes on an entity.

### Signature

```typescript
function Scopes<T, S extends Record<string, ScopeDefinition<T>>>(
  scopes: S
): ClassDecorator
```

### Parameters

- `scopes` - Object containing scope definitions
  - Key: Scope name (string)
  - Value: Scope definition (object or function)

### Type Parameters

- `T` - Entity type
- `S` - Scope definitions type (optional, for type-safe scope names)

### Returns

Class decorator function

### Example

```typescript
@Scopes<User>({
  // Simple scope
  verified: {
    where: { isVerified: true }
  },
  
  // Scope with multiple options
  active: {
    where: { isActive: true },
    select: ['id', 'email', 'name'],
    order: { createdAt: 'DESC' }
  },
  
  // Function scope
  byRole: (role: string) => ({
    where: { role }
  }),
  
  // Scope with relations
  withPosts: {
    relations: { posts: true }
  },

  // Scope with relation scopes
  withScopedRole: {
    relations: { role: true },
    relationScopes: {
      role: ['adminOnly']
    }
  }
})
@Entity()
class User { ... }
```

### Type-Safe Scopes

For IDE autocomplete and compile-time validation:

```typescript
@Scopes<User, {
  verified: any;
  active: any;
  byRole: any;
  withPosts: any;
}>({
  verified: { where: { isVerified: true } },
  active: { where: { isActive: true } },
  byRole: (role: string) => ({ where: { role } }),
  withPosts: { relations: { posts: true } }
})
@Entity()
class User { ... }
```

### Scope Options

Each scope can include:

| Option | Type | Description |
|--------|------|-------------|
| `where` | `FindOptionsWhere<T>` | Filter conditions |
| `select` | `(keyof T)[]` | Fields to select |
| `relations` | `FindOptionsRelations<T>` | Relations to load |
| `relationScopes` | `RelationScopes` | Apply scopes to related entities by path |
| `order` | `FindOptionsOrder<T>` | Sorting options |
| `skip` | `number` | Number of records to skip |
| `take` | `number` | Number of records to take |
| `cache` | `boolean \| number` | Query caching |

### Relation Scopes

`relationScopes` lets you reference scopes defined on related entities:

```typescript
@Scopes<Role>({
  active: { where: { isActive: true } },
  byTenant: (tenantId: number) => ({ where: { tenantId } })
})
@Entity()
class Role { ... }

@Scopes<User>({
  withRoleScopes: {
    relations: { role: true },
    relationScopes: {
      role: ['active', { method: ['byTenant', 10] }]
    }
  }
})
@Entity()
class User { ... }
```

### Function Scopes

Function scopes accept parameters:

```typescript
@Scopes<User>({
  // Single parameter
  byRole: (role: string) => ({
    where: { role }
  }),
  
  // Multiple parameters
  byRoleAndStatus: (role: string, status: string) => ({
    where: { role, status }
  }),
  
  // Complex logic
  search: (query: string) => ({
    where: [
      { name: Like(`%${query}%`) },
      { email: Like(`%${query}%`) }
    ]
  })
})
```

### Notes

- Scopes are stored in metadata and retrieved at runtime
- Multiple `@Scopes` decorators can be used (they merge)
- Scope names must be unique per entity
- Function scopes are called each time they're applied

---

## @DefaultScope

Define a default scope that's automatically applied to all queries.

### Signature

```typescript
function DefaultScope<T>(scope: ScopeOptions<T>): ClassDecorator
```

### Parameters

- `scope` - Scope options to apply by default

### Type Parameters

- `T` - Entity type

### Returns

Class decorator function

### Example

```typescript
@DefaultScope<User>({
  where: { isActive: true }
})
@Entity()
class User { ... }

// All queries automatically include isActive: true
const users = await userRepo.find(); // Only active users

// Remove default scope when needed
const allUsers = await userRepo.unscoped().find();
```

### Common Use Cases

#### Soft Deletes

```typescript
@DefaultScope<Post>({
  where: { deletedAt: IsNull() }
})
@Entity()
class Post {
  @Column({ nullable: true })
  deletedAt: Date | null;
}
```

#### Multi-Tenancy

```typescript
@DefaultScope<Data>({
  where: { tenantId: getCurrentTenantId() }
})
@Entity()
class Data {
  @Column()
  tenantId: number;
}
```

#### Active Records

```typescript
@DefaultScope<Product>({
  where: { 
    isActive: true,
    isPublished: true
  }
})
@Entity()
class Product { ... }
```

### Combining with Named Scopes

```typescript
@DefaultScope<User>({
  where: { isActive: true }
})
@Scopes<User>({
  verified: {
    where: { isVerified: true }
  }
})
@Entity()
class User { ... }

// Both scopes applied
const users = await userRepo.scope('verified').find();
// WHERE isActive = true AND isVerified = true
```

### Removing Default Scope

```typescript
// Remove default scope
const allUsers = await userRepo.unscoped().find();

// Apply default scope explicitly with other scopes
const users = await userRepo.scope('defaultScope', 'verified').find();
```

### Notes

- Only one default scope per entity
- Applied automatically to all queries
- Can be removed with `unscoped()`
- Merged with other scopes using AND logic
- Cannot be a function (must be a static object)

---

## Decorator Order

Decorators can be applied in any order:

```typescript
// Option 1
@DefaultScope<User>({ ... })
@Scopes<User>({ ... })
@Entity()
class User { ... }

// Option 2
@Entity()
@Scopes<User>({ ... })
@DefaultScope<User>({ ... })
class User { ... }

// Option 3
@Scopes<User>({ ... })
@Entity()
@DefaultScope<User>({ ... })
class User { ... }
```

All produce the same result.

## See Also

- [ScopedRepository API](/api/scoped-repository)
- [Type Definitions](/api/types)
- [Getting Started Guide](/guide/getting-started)
- [Type-Safe Scopes Guide](/guide/type-safe-scopes)
