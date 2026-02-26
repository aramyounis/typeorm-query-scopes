# Function Scopes

Function scopes accept parameters, allowing dynamic query generation.

## What are Function Scopes?

Function scopes are scopes that accept parameters at runtime, enabling dynamic and reusable query patterns.

## Basic Usage

```typescript
@Scopes<User>({
  byRole: (role: string) => ({
    where: { role }
  })
})
@Entity()
export class User {
  @Column()
  role: string;
}
```

Apply with parameters:

```typescript
const admins = await userRepo
  .scope({ method: ['byRole', 'admin'] })
  .find();

const moderators = await userRepo
  .scope({ method: ['byRole', 'moderator'] })
  .find();
```

## Multiple Parameters

```typescript
@Scopes<User>({
  byRoleAndStatus: (role: string, isActive: boolean) => ({
    where: { role, isActive }
  })
})

// Usage
const activeAdmins = await userRepo
  .scope({ method: ['byRoleAndStatus', 'admin', true] })
  .find();
```

## Common Patterns

### Search

```typescript
import { Like } from 'typeorm';

@Scopes<User>({
  search: (query: string) => ({
    where: [
      { name: Like(`%${query}%`) },
      { email: Like(`%${query}%`) }
    ]
  })
})

const results = await userRepo
  .scope({ method: ['search', 'john'] })
  .find();
```

### Date Ranges

```typescript
import { Between } from 'typeorm';

@Scopes<Order>({
  createdBetween: (start: Date, end: Date) => ({
    where: { createdAt: Between(start, end) }
  })
})

const orders = await orderRepo
  .scope({ method: ['createdBetween', startDate, endDate] })
  .find();
```

### Dynamic Relations

```typescript
@Scopes<User>({
  withRelation: (relation: 'posts' | 'comments' | 'profile') => ({
    relations: { [relation]: true }
  })
})

const usersWithPosts = await userRepo
  .scope({ method: ['withRelation', 'posts'] })
  .find();
```

## Combining with Named Scopes

```typescript
const result = await userRepo
  .scope('verified', { method: ['byRole', 'admin'] })
  .find();
```

## See Also

- [Named Scopes](/guide/named-scopes)
- [Scope Merging](/guide/scope-merging)
