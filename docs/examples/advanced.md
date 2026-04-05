# Advanced Examples

Complex patterns and advanced usage of TypeORM Scopes.

## Complex Scope Merging

```typescript
@Scopes<Post>({
  published: {
    where: { status: 'published', publishedAt: LessThan(new Date()) }
  },
  
  popular: {
    where: { views: MoreThan(1000) },
    order: { views: 'DESC' }
  },
  
  withAuthor: {
    relations: { author: true }
  },
  
  withComments: {
    relations: { comments: { user: true } }
  }
})
@Entity()
export class Post { ... }

// All scopes merge intelligently
const posts = await postRepo
  .scope('published', 'popular', 'withAuthor', 'withComments')
  .find({ take: 10 });

// Results in:
// WHERE status = 'published' 
//   AND publishedAt < NOW() 
//   AND views > 1000
// ORDER BY views DESC
// RELATIONS: author, comments.user
// LIMIT 10
```

## Dynamic Search Scopes

```typescript
@Scopes<Product>({
  search: (query: string) => ({
    where: [
      { name: Like(`%${query}%`) },
      { description: Like(`%${query}%`) },
      { sku: Like(`%${query}%`) }
    ]
  }),
  
  inPriceRange: (min: number, max: number) => ({
    where: {
      price: Between(min, max)
    }
  }),
  
  byCategory: (categories: string[]) => ({
    where: { category: In(categories) }
  })
})
@Entity()
export class Product { ... }

// Usage
const results = await productRepo
  .scope(
    { method: ['search', 'laptop'] },
    { method: ['inPriceRange', 500, 2000] },
    { method: ['byCategory', ['electronics', 'computers']] }
  )
  .find();
```

## Soft Deletes Pattern

```typescript
@DefaultScope<Document>({
  where: { deletedAt: IsNull() }
})
@Scopes<Document>({
  withTrashed: {},  // Empty scope to include deleted
  
  onlyTrashed: {
    where: { deletedAt: Not(IsNull()) }
  }
})
@Entity()
export class Document {
  @Column({ nullable: true })
  deletedAt: Date | null;
}

// Normal queries exclude deleted
const docs = await docRepo.find();

// Include deleted
const allDocs = await docRepo.unscoped().scope('withTrashed').find();

// Only deleted
const trashedDocs = await docRepo.unscoped().scope('onlyTrashed').find();
```

## Multi-Tenancy Pattern

```typescript
// Global tenant context
let currentTenantId: number;

export function setCurrentTenant(tenantId: number) {
  currentTenantId = tenantId;
}

@Scopes<Data>({
  forTenant: (tenantId?: number) => ({
    where: { tenantId: tenantId || currentTenantId }
  })
})
@Entity()
export class Data {
  @Column()
  tenantId: number;
}

// Automatic tenant isolation
setCurrentTenant(123);
const data = await dataRepo
  .scope({ method: ['forTenant'] })
  .find();

// Override for specific tenant
const otherData = await dataRepo
  .scope({ method: ['forTenant', 456] })
  .find();
```

## Access Control Pattern

```typescript
@Scopes<Document>({
  accessible: (userId: number) => ({
    where: [
      { ownerId: userId },
      { sharedWith: { id: userId } },
      { isPublic: true }
    ]
  }),
  
  editable: (userId: number) => ({
    where: [
      { ownerId: userId },
      { editors: { id: userId } }
    ]
  })
})
@Entity()
export class Document { ... }

// User can only see accessible documents
const docs = await docRepo
  .scope({ method: ['accessible', currentUser.id] })
  .find();

// User can only edit their documents
const editableDocs = await docRepo
  .scope({ method: ['editable', currentUser.id] })
  .find();
```

## Nested Relations

```typescript
@Scopes<Post>({
  withFullDetails: {
    relations: {
      author: {
        profile: true
      },
      comments: {
        user: {
          profile: true
        }
      },
      tags: true
    }
  }
})
@Entity()
export class Post { ... }

// Load deeply nested relations
const posts = await postRepo.scope('withFullDetails').find();
```

## Relation Scopes

```typescript
@DefaultScope<Role>({
  where: { isActive: true }
})
@Scopes<Role>({
  adminOnly: {
    where: { name: 'admin' }
  },
  byTenant: (tenantId: number) => ({
    where: { tenantId }
  })
})
@Entity()
export class Role { ... }

@Scopes<User>({
  withScopedRole: {
    relations: { role: true },
    relationScopes: {
      role: ['adminOnly', { method: ['byTenant', 12] }]
    }
  }
})
@Entity()
export class User { ... }

// Loads users where related role matches Role scopes
const users = await userRepo.scope('withScopedRole').find();
```

This pattern is useful when you want reusable filtering logic on related entities without duplicating relation where clauses in parent scopes.

## Conditional Scopes

```typescript
class PostService {
  async getPosts(options: {
    includeUnpublished?: boolean;
    userId?: number;
    withComments?: boolean;
  }) {
    let query = this.postRepo;

    // Apply scopes conditionally
    if (!options.includeUnpublished) {
      query = query.scope('published');
    }

    if (options.userId) {
      query = query.scope({ method: ['byAuthor', options.userId] });
    }

    if (options.withComments) {
      query = query.scope('withComments');
    }

    return query.find();
  }
}
```

## Scope Composition

```typescript
@Scopes<User>({
  // Base scopes
  active: { where: { isActive: true } },
  verified: { where: { isVerified: true } },
  
  // Composed scopes
  activeAndVerified: {
    where: { 
      isActive: true,
      isVerified: true
    }
  },
  
  // Or use multiple scopes
  // repo.scope('active', 'verified')
})
```

## Time-Based Scopes

```typescript
@Scopes<Event>({
  upcoming: {
    where: { startDate: MoreThan(new Date()) },
    order: { startDate: 'ASC' }
  },
  
  past: {
    where: { endDate: LessThan(new Date()) },
    order: { endDate: 'DESC' }
  },
  
  happening: {
    where: {
      startDate: LessThanOrEqual(new Date()),
      endDate: MoreThanOrEqual(new Date())
    }
  },
  
  inDateRange: (start: Date, end: Date) => ({
    where: {
      startDate: MoreThanOrEqual(start),
      endDate: LessThanOrEqual(end)
    }
  })
})
@Entity()
export class Event { ... }
```

## Aggregation with Scopes

```typescript
async function getStatistics() {
  const [total, active, verified, admins] = await Promise.all([
    userRepo.unscoped().count(),
    userRepo.count(),
    userRepo.scope('verified').count(),
    userRepo.scope('admin').count()
  ]);

  return { total, active, verified, admins };
}
```

## Caching with Scopes

```typescript
@Scopes<Product>({
  featured: {
    where: { isFeatured: true },
    cache: 60000  // Cache for 1 minute
  }
})
@Entity()
export class Product { ... }

// Results cached
const featured = await productRepo.scope('featured').find();
```

## Scope Inheritance Pattern

```typescript
// Base entity with common scopes
abstract class BaseEntity {
  @Column()
  isActive: boolean;

  @Column()
  createdAt: Date;
}

// Child entities inherit and add scopes
@DefaultScope<User>({ where: { isActive: true } })
@Scopes<User>({
  newest: { order: { createdAt: 'DESC' } }
})
@Entity()
export class User extends BaseEntity { ... }
```

## Testing with Scopes

```typescript
describe('User scopes', () => {
  it('verified scope filters correctly', async () => {
    const users = await userRepo.scope('verified').find();
    expect(users.every(u => u.isVerified)).toBe(true);
  });

  it('multiple scopes combine with AND', async () => {
    const users = await userRepo.scope('verified', 'admin').find();
    expect(users.every(u => u.isVerified && u.role === 'admin')).toBe(true);
  });

  it('unscoped returns all records', async () => {
    const all = await userRepo.unscoped().find();
    const active = await userRepo.find();
    expect(all.length).toBeGreaterThan(active.length);
  });
});
```

## Next Steps

- [Real-World Application](/examples/real-world)
- [NestJS Integration](/examples/nestjs)
- [Best Practices Guide](/guide/best-practices)
