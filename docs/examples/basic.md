# Basic Usage Examples

Simple examples to get you started with TypeORM Scopes.

## Simple Entity with Scopes

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Scopes, DefaultScope, getScopedRepository } from 'typeorm-query-scopes';

@DefaultScope<User>({
  where: { isActive: true }
})
@Scopes<User>({
  verified: {
    where: { isVerified: true }
  },
  admin: {
    where: { role: 'admin' }
  },
  newest: {
    order: { createdAt: 'DESC' }
  }
})
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  name: string;

  @Column()
  role: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column()
  createdAt: Date;
}
```

## Using Scopes

```typescript
import { dataSource } from './data-source';

const userRepo = getScopedRepository(User, dataSource);

// Single scope
const verifiedUsers = await userRepo.scope('verified').find();

// Multiple scopes
const verifiedAdmins = await userRepo.scope('verified', 'admin').find();

// With ordering
const newestUsers = await userRepo.scope('newest').find({ take: 10 });

// Remove default scope
const allUsers = await userRepo.unscoped().find();
```

## Function Scopes

```typescript
@Scopes<User>({
  byRole: (role: string) => ({
    where: { role }
  }),
  
  createdAfter: (date: Date) => ({
    where: { createdAt: MoreThan(date) }
  })
})
@Entity()
export class User { ... }

// Usage
const moderators = await userRepo
  .scope({ method: ['byRole', 'moderator'] })
  .find();

const recentUsers = await userRepo
  .scope({ method: ['createdAfter', lastWeek] })
  .find();
```

## Scopes with Relations

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
@Entity()
export class User { ... }

// Usage
const usersWithPosts = await userRepo.scope('withPosts').find();
```

## Scopes with Select

```typescript
@Scopes<User>({
  publicFields: {
    select: { id: true, name: true, avatar: true }
  },
  
  privateFields: {
    select: { id: true, name: true, email: true, phone: true }
  }
})
@Entity()
export class User { ... }

// Usage - only fetch needed fields
const publicUsers = await userRepo.scope('publicFields').find();
```

## Combining Scopes

```typescript
// Combine multiple scopes
const result = await userRepo
  .scope('verified', 'withPosts', 'newest')
  .find({ take: 20 });

// Scopes merge intelligently
// WHERE: isActive = true AND isVerified = true
// RELATIONS: posts loaded
// ORDER: createdAt DESC
// LIMIT: 20
```

## Pagination

```typescript
async function getUsers(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;
  
  const [users, total] = await userRepo
    .scope('verified')
    .findAndCount({ take: limit, skip });
  
  return {
    data: users,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
}
```

## Count Operations

```typescript
// Count with scopes
const verifiedCount = await userRepo.scope('verified').count();

// Count with additional conditions
const adminCount = await userRepo
  .scope('verified')
  .count({ where: { role: 'admin' } });
```

## Find One

```typescript
// Find one with scopes
const user = await userRepo
  .scope('verified')
  .findOne({ where: { id: 1 } });

// Find one by conditions
const user = await userRepo
  .scope('verified')
  .findOneBy({ email: 'user@example.com' });
```

## Service Pattern

```typescript
export class UserService {
  private userRepo;

  constructor(dataSource: DataSource) {
    this.userRepo = getScopedRepository(User, dataSource);
  }

  async getActiveUsers() {
    return this.userRepo.find();
  }

  async getVerifiedUsers() {
    return this.userRepo.scope('verified').find();
  }

  async getAdmins() {
    return this.userRepo.scope('admin').find();
  }

  async getAllUsers() {
    // Admin function - includes inactive
    return this.userRepo.unscoped().find();
  }
}
```

## Next Steps

- [Advanced Examples](/examples/advanced)
- [Real-World Application](/examples/real-world)
- [NestJS Integration](/examples/nestjs)
