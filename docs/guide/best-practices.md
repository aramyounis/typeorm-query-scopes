# Best Practices

Guidelines for using TypeORM Scopes effectively.

## Scope Design

### Keep Scopes Focused

Each scope should do one thing well:

```typescript
// ✅ Good - focused scopes
@Scopes<User>({
  verified: { where: { isVerified: true } },
  active: { where: { isActive: true } },
  withPosts: { relations: { posts: true } }
})

// ❌ Avoid - doing too much
@Scopes<User>({
  everything: {
    where: { isVerified: true, isActive: true },
    relations: { posts: true, comments: true },
    order: { createdAt: 'DESC' }
  }
})
```

### Compose Scopes

Build complex queries by combining simple scopes:

```typescript
// Define simple building blocks
@Scopes<User>({
  verified: { where: { isVerified: true } },
  active: { where: { isActive: true } },
  withPosts: { relations: { posts: true } },
  newest: { order: { createdAt: 'DESC' } }
})

// Combine as needed
const users = await userRepo
  .scope('verified', 'active', 'withPosts', 'newest')
  .find({ take: 10 });
```

### Use Descriptive Names

```typescript
// ✅ Clear and descriptive
@Scopes<User>({
  verified: { ... },
  withPosts: { ... },
  newest: { ... }
})

// ❌ Vague or cryptic
@Scopes<User>({
  scope1: { ... },
  temp: { ... },
  x: { ... }
})
```

## Default Scopes

### Use Sparingly

Only use default scopes for truly universal filters:

```typescript
// ✅ Good use cases
@DefaultScope<User>({ where: { isActive: true } })
@DefaultScope<Post>({ where: { deletedAt: IsNull() } })

// ❌ Questionable - might not always want this
@DefaultScope<User>({ 
  relations: { posts: true },
  order: { createdAt: 'DESC' }
})
```

### Document Default Scopes

```typescript
/**
 * User entity
 * 
 * Default scope: Only returns active users (isActive = true)
 * Use .unscoped() to include inactive users
 */
@DefaultScope<User>({ where: { isActive: true } })
@Entity()
export class User { ... }
```

### Provide Unscoped Methods

```typescript
export class UserService {
  async getUsers() {
    return this.userRepo.find(); // Active users only
  }

  async getAllUsers() {
    return this.userRepo.unscoped().find(); // All users
  }
}
```

## Type Safety

### Always Use Type Parameters

```typescript
// ✅ Type-safe
@Scopes<User, {
  verified: any;
  admin: any;
}>({
  verified: { where: { isVerified: true } },
  admin: { where: { role: 'admin' } }
})

// ❌ No type safety
@Scopes({
  verified: { where: { isVerified: true } }
})
```

### Type Repository Variables

```typescript
// ✅ Typed repository
const userRepo: ScopedRepository<User, 'verified' | 'admin'> = 
  getScopedRepository(User, dataSource);

// ❌ Untyped
const userRepo = getScopedRepository(User, dataSource);
```

## Performance

### Select Only Needed Fields

```typescript
@Scopes<User>({
  listView: {
    select: { id: true, name: true, avatar: true } // Minimal for lists
  },
  detailView: {
    select: { id: true, name: true, email: true, bio: true, avatar: true } // Full for details
  }
})
```

### Load Relations Intentionally

```typescript
// ✅ Explicit relation loading
@Scopes<User>({
  basic: { }, // No relations
  withPosts: { relations: { posts: true } }
})

// Use basic by default, withPosts when needed
const users = await userRepo.find(); // Fast
const usersWithPosts = await userRepo.scope('withPosts').find(); // Slower
```

### Use Pagination

```typescript
@Scopes<User>({
  paginated: {
    take: 20
  }
})

async function getUsers(page: number) {
  return userRepo
    .scope('paginated')
    .find({ skip: (page - 1) * 20 });
}
```

## Organization

### Group Related Scopes

```typescript
@Scopes<User>({
  // Status filters
  active: { where: { isActive: true } },
  inactive: { where: { isActive: false } },
  verified: { where: { isVerified: true } },
  
  // Role filters
  admin: { where: { role: 'admin' } },
  moderator: { where: { role: 'moderator' } },
  
  // Relations
  withPosts: { relations: { posts: true } },
  withComments: { relations: { comments: true } },
  
  // Sorting
  newest: { order: { createdAt: 'DESC' } },
  oldest: { order: { createdAt: 'ASC' } }
})
```

### Extract Complex Scopes

For very complex entities, consider splitting scopes:

```typescript
// user-scopes.ts
export const userStatusScopes = {
  active: { where: { isActive: true } },
  verified: { where: { isVerified: true } }
};

export const userRelationScopes = {
  withPosts: { relations: { posts: true } },
  withComments: { relations: { comments: true } }
};

// user.entity.ts
@Scopes<User>({
  ...userStatusScopes,
  ...userRelationScopes
})
@Entity()
export class User { ... }
```

## Testing

### Test Scope Behavior

```typescript
describe('User scopes', () => {
  it('should filter verified users', async () => {
    const users = await userRepo.scope('verified').find();
    expect(users.every(u => u.isVerified)).toBe(true);
  });

  it('should combine scopes', async () => {
    const users = await userRepo.scope('verified', 'admin').find();
    expect(users.every(u => u.isVerified && u.role === 'admin')).toBe(true);
  });
});
```

### Test Scope Merging

```typescript
it('should merge where conditions', async () => {
  const users = await userRepo
    .scope('verified', 'active')
    .find();
  
  expect(users.every(u => u.isVerified && u.isActive)).toBe(true);
});
```

## Common Pitfalls

### Don't Overuse Default Scopes

```typescript
// ❌ Too restrictive
@DefaultScope<User>({
  where: { role: 'user' } // What about admins?
})

// ✅ Use named scopes instead
@Scopes<User>({
  users: { where: { role: 'user' } },
  admins: { where: { role: 'admin' } }
})
```

### Remember Scope Merging Rules

```typescript
// SELECT trees are deep-merged by field path
@Scopes<User>({
  basic: { select: { id: true, name: true } },
  detailed: { select: { email: true } }
})

// Gets id, name, and email
await userRepo.scope('basic', 'detailed').find();
```

### Be Careful with Updates

```typescript
// ❌ Scopes don't affect bulk operations
await userRepo.update({ role: 'user' }, { role: 'member' });

// ✅ Use find + save for scoped updates
const users = await userRepo.scope('verified').find();
for (const user of users) {
  user.role = 'member';
  await userRepo.save(user);
}
```

## Migration from Raw Queries

### Before

```typescript
// Repeated query logic
const verifiedUsers = await userRepo.find({
  where: { isVerified: true, isActive: true },
  relations: { posts: true },
  order: { createdAt: 'DESC' }
});

const verifiedAdmins = await userRepo.find({
  where: { isVerified: true, isActive: true, role: 'admin' },
  relations: { posts: true },
  order: { createdAt: 'DESC' }
});
```

### After

```typescript
// Define once
@DefaultScope<User>({
  where: { isActive: true }
})
@Scopes<User>({
  verified: { where: { isVerified: true } },
  admin: { where: { role: 'admin' } },
  withPosts: { relations: { posts: true } },
  newest: { order: { createdAt: 'DESC' } }
})

// Reuse everywhere
const verifiedUsers = await userRepo
  .scope('verified', 'withPosts', 'newest')
  .find();

const verifiedAdmins = await userRepo
  .scope('verified', 'admin', 'withPosts', 'newest')
  .find();
```

## See Also

- [Getting Started](/guide/getting-started)
- [Named Scopes](/guide/named-scopes)
- [Type-Safe Scopes](/guide/type-safe-scopes)
