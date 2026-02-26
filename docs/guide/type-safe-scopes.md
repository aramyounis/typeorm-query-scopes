# Type-Safe Scopes

Get IDE autocomplete and compile-time validation for scope names.

## Basic Type Safety

Add a second generic parameter to `@Scopes`:

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
@Entity()
export class User { ... }
```

## Type-Safe Repository

```typescript
import { getScopedRepository, ScopedRepository } from 'typeorm-query-scopes';

const userRepo: ScopedRepository<User, 'verified' | 'admin' | 'withPosts'> = 
  getScopedRepository(User, dataSource);

// ✅ Valid - TypeScript knows these scopes exist
userRepo.scope('verified').find();
userRepo.scope('admin', 'withPosts').find();

// ❌ Error - TypeScript catches typos
userRepo.scope('verifed').find();
userRepo.scope('unknown').find();
```

## IDE Autocomplete

With type-safe scopes, your IDE will:
- Suggest available scope names
- Show errors for invalid names
- Provide inline documentation

## Extracting Scope Names

Use a type helper:

```typescript
type UserScopes = {
  verified: any;
  admin: any;
  withPosts: any;
  newest: any;
};

@Scopes<User, UserScopes>({ ... })
@Entity()
export class User { ... }

// Reuse the type
const userRepo: ScopedRepository<User, keyof UserScopes> = 
  getScopedRepository(User, dataSource);
```

## In Services

```typescript
export class UserService {
  private userRepo: ScopedRepository<User, 'verified' | 'admin' | 'withPosts'>;

  constructor(dataSource: DataSource) {
    this.userRepo = getScopedRepository(User, dataSource);
  }

  async getVerifiedUsers() {
    // Full type safety and autocomplete
    return this.userRepo.scope('verified').find();
  }
}
```

## Benefits

1. **Catch Errors Early**: Typos caught at compile-time
2. **Better DX**: IDE autocomplete for scope names
3. **Refactoring**: Rename scopes safely
4. **Documentation**: Types serve as inline docs

## Backward Compatible

The second generic parameter is optional - existing code works without changes:

```typescript
// Still works without type parameter
@Scopes<User>({
  verified: { where: { isVerified: true } }
})
```

## See Also

- [Getting Started](/guide/getting-started)
- [Named Scopes](/guide/named-scopes)
- [Best Practices](/guide/best-practices)
