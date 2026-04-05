# Named Scopes

Named scopes are reusable query patterns that you can apply on-demand.

## What are Named Scopes?

Named scopes let you define common query patterns once and reuse them throughout your application. Unlike default scopes, they're only applied when explicitly requested.

## Basic Usage

```typescript
import { Entity, Column } from 'typeorm';
import { Scopes } from 'typeorm-query-scopes';

@Scopes<User>({
  verified: {
    where: { isVerified: true }
  },
  admin: {
    where: { role: 'admin' }
  }
})
@Entity()
export class User {
  @Column()
  isVerified: boolean;
  
  @Column()
  role: string;
}
```

Apply scopes when needed:

```typescript
// Single scope
const verifiedUsers = await userRepo.scope('verified').find();

// Multiple scopes
const verifiedAdmins = await userRepo.scope('verified', 'admin').find();
```

## Scope Options

Each scope can include any TypeORM find options:

### Where Conditions

```typescript
@Scopes<User>({
  active: {
    where: { isActive: true }
  },
  verified: {
    where: { isVerified: true }
  },
  admin: {
    where: { role: 'admin' }
  }
})
```

### Select Fields

```typescript
@Scopes<User>({
  publicFields: {
    select: ['id', 'name', 'avatar']
  },
  privateFields: {
    select: ['id', 'name', 'email', 'phone']
  }
})
```

### Relations

```typescript
@Scopes<User>({
  withPosts: {
    relations: { posts: true }
  },
  withComments: {
    relations: { comments: true }
  },
  withEverything: {
    relations: {
      posts: true,
      comments: true,
      profile: true
    }
  }
})
```

### Relation Scope Lists

Use `relationScopes` when you want a parent scope to apply scopes defined on related entities.

```typescript
@Scopes<User>({
  withScopedRole: {
    relations: { role: true },
    relationScopes: {
      role: ['activeOnly', 'adminOnly']
    }
  }
})
```

You can also call function scopes in the list:

```typescript
@Scopes<User>({
  withTenantRole: {
    relations: { role: true },
    relationScopes: {
      role: ['activeOnly', { method: ['byTenant', 10] }]
    }
  }
})
```

### Ordering

```typescript
@Scopes<User>({
  newest: {
    order: { createdAt: 'DESC' }
  },
  oldest: {
    order: { createdAt: 'ASC' }
  },
  alphabetical: {
    order: { name: 'ASC' }
  }
})
```

### Pagination

```typescript
@Scopes<User>({
  firstTen: {
    take: 10,
    skip: 0
  },
  paginated: {
    take: 20
  }
})
```

### Combined Options

```typescript
@Scopes<User>({
  featuredUsers: {
    where: { isFeatured: true },
    select: ['id', 'name', 'avatar', 'bio'],
    relations: { posts: true },
    order: { followerCount: 'DESC' },
    take: 10
  }
})
```

## Applying Scopes

### Single Scope

```typescript
const verified = await userRepo.scope('verified').find();
```

### Multiple Scopes

```typescript
// Scopes are merged together
const result = await userRepo
  .scope('verified', 'admin', 'withPosts')
  .find();
```

### With Additional Options

```typescript
// Scope + custom options
const result = await userRepo
  .scope('verified')
  .find({
    where: { country: 'US' },
    take: 10
  });
```

### Chaining

```typescript
// Chain multiple operations
const result = await userRepo
  .scope('verified')
  .scope('withPosts')
  .find({ take: 5 });
```

## Common Patterns

### Status Filters

```typescript
@Scopes<Order>({
  pending: {
    where: { status: 'pending' }
  },
  completed: {
    where: { status: 'completed' }
  },
  cancelled: {
    where: { status: 'cancelled' }
  }
})
```

### Date Ranges

```typescript
import { MoreThan, LessThan } from 'typeorm';

@Scopes<Post>({
  recent: {
    where: { 
      createdAt: MoreThan(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    }
  },
  thisMonth: {
    where: {
      createdAt: MoreThan(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
    }
  }
})
```

### Visibility Levels

```typescript
@Scopes<Post>({
  public: {
    where: { visibility: 'public' }
  },
  private: {
    where: { visibility: 'private' }
  },
  published: {
    where: { 
      isPublished: true,
      publishedAt: LessThanOrEqual(new Date())
    }
  }
})
```

### Performance Optimization

```typescript
@Scopes<User>({
  // Minimal data for lists
  listView: {
    select: ['id', 'name', 'avatar']
  },
  
  // Full data for detail view
  detailView: {
    select: ['id', 'name', 'email', 'bio', 'avatar'],
    relations: { posts: true, followers: true }
  }
})
```

### Search Patterns

```typescript
import { Like } from 'typeorm';

@Scopes<User>({
  searchable: {
    select: ['id', 'name', 'email', 'username']
  }
})

// Use with custom where
const results = await userRepo
  .scope('searchable')
  .find({
    where: [
      { name: Like(`%${query}%`) },
      { email: Like(`%${query}%`) }
    ]
  });
```

## Scope Naming

### Good Names

```typescript
@Scopes<User>({
  // Clear and descriptive
  verified: { ... },
  active: { ... },
  withPosts: { ... },
  newest: { ... },
  
  // Action-oriented
  forDisplay: { ... },
  forExport: { ... },
  
  // Context-specific
  publicProfile: { ... },
  adminView: { ... }
})
```

### Avoid

```typescript
@Scopes<User>({
  // Too vague
  scope1: { ... },
  temp: { ... },
  
  // Too long
  verifiedUsersWithPostsAndCommentsOrderedByCreationDate: { ... }
})
```

## Organizing Scopes

### By Feature

```typescript
@Scopes<User>({
  // Authentication
  verified: { ... },
  unverified: { ... },
  
  // Roles
  admin: { ... },
  moderator: { ... },
  user: { ... },
  
  // Relations
  withPosts: { ... },
  withComments: { ... },
  
  // Sorting
  newest: { ... },
  oldest: { ... }
})
```

### By Use Case

```typescript
@Scopes<Product>({
  // Customer-facing
  available: {
    where: { 
      isActive: true,
      stock: MoreThan(0)
    }
  },
  
  // Admin
  outOfStock: {
    where: { stock: 0 }
  },
  
  // Reports
  topSelling: {
    order: { salesCount: 'DESC' },
    take: 10
  }
})
```

## Best Practices

### 1. Keep Scopes Focused

```typescript
// Good - single responsibility
@Scopes<User>({
  verified: { where: { isVerified: true } },
  withPosts: { relations: { posts: true } }
})

// Avoid - doing too much
@Scopes<User>({
  everything: {
    where: { isVerified: true, isActive: true },
    relations: { posts: true, comments: true },
    order: { createdAt: 'DESC' }
  }
})
```

### 2. Compose Scopes

```typescript
// Define small scopes
@Scopes<User>({
  verified: { where: { isVerified: true } },
  active: { where: { isActive: true } },
  withPosts: { relations: { posts: true } }
})

// Combine as needed
const users = await userRepo
  .scope('verified', 'active', 'withPosts')
  .find();
```

### 3. Document Complex Scopes

```typescript
@Scopes<Order>({
  /**
   * Returns orders that are:
   * - Not cancelled or refunded
   * - Created in the last 30 days
   * - Includes customer and items
   */
  recentActive: {
    where: {
      status: Not(In(['cancelled', 'refunded'])),
      createdAt: MoreThan(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    },
    relations: { customer: true, items: true }
  }
})
```

### 4. Use Type-Safe Names

```typescript
@Scopes<User, {
  verified: any;
  admin: any;
  withPosts: any;
}>({
  verified: { where: { isVerified: true } },
  admin: { where: { role: 'admin' } },
  withPosts: { relations: { posts: true } }
})

// TypeScript will error on typos
userRepo.scope('verifed'); // Error: 'verifed' doesn't exist
```

## See Also

- [Function Scopes](/guide/function-scopes)
- [Scope Merging](/guide/scope-merging)
- [Type-Safe Scopes](/guide/type-safe-scopes)
- [Best Practices](/guide/best-practices)
