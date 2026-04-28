# Default Scopes

Default scopes are automatically applied to all queries on an entity.

## What are Default Scopes?

A default scope is a set of query conditions that are automatically applied to every query unless explicitly removed. This is useful for:

- Soft deletes (filtering out deleted records)
- Multi-tenancy (filtering by tenant)
- Active/published records (filtering by status)
- Security (filtering by permissions)

## Basic Usage

```typescript
import { Entity, Column } from 'typeorm';
import { DefaultScope } from 'typeorm-query-scopes';

@DefaultScope<User>({
  where: { isActive: true }
})
@Entity()
export class User {
  @Column()
  isActive: boolean;
}
```

Now all queries automatically filter for active users:

```typescript
// Automatically includes: WHERE isActive = true
const users = await userRepo.find();
const user = await userRepo.findOne({ where: { id: 1 } });
const count = await userRepo.count();
```

## Common Use Cases

### Soft Deletes

```typescript
import { IsNull } from 'typeorm';

@DefaultScope<Post>({
  where: { deletedAt: IsNull() }
})
@Entity()
export class Post {
  @Column({ nullable: true })
  deletedAt: Date | null;
}
```

### Multi-Tenancy

```typescript
@DefaultScope<Data>({
  where: { tenantId: getCurrentTenantId() }
})
@Entity()
export class Data {
  @Column()
  tenantId: number;
}
```

### Published Content

```typescript
@DefaultScope<Article>({
  where: { 
    isPublished: true,
    publishedAt: LessThanOrEqual(new Date())
  }
})
@Entity()
export class Article {
  @Column()
  isPublished: boolean;
  
  @Column()
  publishedAt: Date;
}
```

### Active Records

```typescript
@DefaultScope<Product>({
  where: { 
    isActive: true,
    isDeleted: false
  }
})
@Entity()
export class Product {
  @Column()
  isActive: boolean;
  
  @Column()
  isDeleted: boolean;
}
```

## Removing Default Scope

Use `unscoped()` to remove the default scope:

```typescript
// Without default scope
const allUsers = await userRepo.unscoped().find();

// Get deleted records
const deletedPosts = await postRepo
  .unscoped()
  .find({ where: { deletedAt: Not(IsNull()) } });

// Admin view - see everything
const allProducts = await productRepo.unscoped().find();
```

## Combining with Named Scopes

Default scopes work alongside named scopes:

```typescript
@DefaultScope<User>({
  where: { isActive: true }
})
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
  isActive: boolean;
  
  @Column()
  isVerified: boolean;
  
  @Column()
  role: string;
}
```

Usage:

```typescript
// Both scopes applied: isActive = true AND isVerified = true
const verifiedUsers = await userRepo.scope('verified').find();

// All three: isActive = true AND isVerified = true AND role = 'admin'
const verifiedAdmins = await userRepo.scope('verified', 'admin').find();

// Only named scope: isVerified = true (no isActive filter)
const allVerified = await userRepo.unscoped().scope('verified').find();
```

## Complex Default Scopes

### Multiple Conditions

```typescript
@DefaultScope<Order>({
  where: {
    status: Not(In(['cancelled', 'refunded'])),
    isDeleted: false
  },
  order: { createdAt: 'DESC' }
})
@Entity()
export class Order {
  @Column()
  status: string;
  
  @Column()
  isDeleted: boolean;
  
  @Column()
  createdAt: Date;
}
```

### With Relations

```typescript
@DefaultScope<User>({
  where: { isActive: true },
  relations: { profile: true }
})
@Entity()
export class User {
  @Column()
  isActive: boolean;
  
  @OneToOne(() => Profile)
  profile: Profile;
}
```

### With Select

```typescript
@DefaultScope<User>({
  where: { isActive: true },
  select: { id: true, email: true, name: true } // Only fetch these fields by default
})
@Entity()
export class User {
  @Column()
  id: number;
  
  @Column()
  email: string;
  
  @Column()
  name: string;
  
  @Column()
  password: string; // Not fetched by default
}
```

## Best Practices

### 1. Keep It Simple

Default scopes should be simple and predictable:

```typescript
// Good - simple and clear
@DefaultScope<User>({
  where: { isActive: true }
})

// Avoid - too complex
@DefaultScope<User>({
  where: { /* complex nested conditions */ },
  relations: { /* many relations */ },
  order: { /* multiple sorts */ }
})
```

### 2. Document the Behavior

```typescript
/**
 * User entity
 * 
 * Default scope: Only returns active users (isActive = true)
 * Use .unscoped() to include inactive users
 */
@DefaultScope<User>({
  where: { isActive: true }
})
@Entity()
export class User { ... }
```

### 3. Provide Unscoped Methods

```typescript
export class UserService {
  async getActiveUsers() {
    return this.userRepo.find(); // Uses default scope
  }

  async getAllUsers() {
    return this.userRepo.unscoped().find(); // Admin function
  }
}
```

### 4. Be Careful with Updates

Default scopes don't affect updates:

```typescript
// This will update ALL users, not just active ones
await userRepo.update({ role: 'user' }, { role: 'member' });

// Use find + save for scoped updates
const users = await userRepo.find(); // Only active users
for (const user of users) {
  user.role = 'member';
  await userRepo.save(user);
}
```

## Limitations

1. **Static Only**: Default scopes must be static objects, not functions
2. **No Parameters**: Cannot accept runtime parameters
3. **Update/Delete**: Don't affect bulk update/delete operations
4. **Performance**: Always applied, even when not needed

## When Not to Use

Avoid default scopes when:

- The filter is needed only sometimes
- You need different defaults in different contexts
- The condition requires runtime parameters
- It makes debugging harder

Use named scopes instead:

```typescript
@Scopes<User>({
  active: { where: { isActive: true } },
  inactive: { where: { isActive: false } }
})
@Entity()
export class User { ... }

// Explicit and clear
const activeUsers = await userRepo.scope('active').find();
const inactiveUsers = await userRepo.scope('inactive').find();
```

## See Also

- [Named Scopes](/guide/named-scopes)
- [Scope Merging](/guide/scope-merging)
- [Best Practices](/guide/best-practices)
