# TypeORM Query Scopes

[![npm version](https://img.shields.io/npm/v/typeorm-query-scopes.svg)](https://www.npmjs.com/package/typeorm-query-scopes)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![TypeORM](https://img.shields.io/badge/TypeORM-0.3+-orange.svg)](https://typeorm.io/)
[![Documentation](https://img.shields.io/badge/docs-online-blue.svg)](https://aramyounis.github.io/typeorm-query-scopes/)


Reusable query patterns for TypeORM entities. Define query filters using decorators and apply them easily to your queries.

📚 **[View Full Documentation](https://aramyounis.github.io/typeorm-query-scopes/)**

## Features

- 🎯 **Reusable Queries** - Define once, use everywhere
- 🔒 **Type Safe** - Full TypeScript support with autocomplete
- 🎨 **Clean Code** - Decorator-based, declarative syntax
- ⚡ **Zero Overhead** - No performance penalty
- 🔄 **Composable** - Combine multiple scopes intelligently
- 📦 **Easy Integration** - Works seamlessly with existing TypeORM code
- ✨ **Type-Safe Scope Names** - IDE autocomplete and compile-time validation

## 📖 Documentation

**[📚 Read the Full Documentation →](https://aramyounis.github.io/typeorm-query-scopes/)**

- [Getting Started](https://aramyounis.github.io/typeorm-query-scopes/guide/getting-started)
- [API Reference](https://aramyounis.github.io/typeorm-query-scopes/api/decorators)
- [Examples](https://aramyounis.github.io/typeorm-query-scopes/examples/basic)
- [NestJS Integration](https://aramyounis.github.io/typeorm-query-scopes/examples/nestjs)

## Installation

```bash
npm install typeorm-query-scopes
# or
yarn add typeorm-query-scopes
# or
pnpm add typeorm-query-scopes
```

Make sure you have TypeORM installed as a peer dependency:

```bash
npm install typeorm reflect-metadata
```

Enable decorators in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Features

- 🎯 **Decorator-based scope definitions** - Define scopes directly on your entities
- 🔄 **Default scopes** - Automatically applied to all queries
- 🔗 **Scope merging** - Combine multiple scopes intelligently
- 📦 **Function scopes** - Dynamic scopes with parameters
- 🎨 **TypeScript support** - Full type safety
- ⚡ **Easy to use** - Clean decorator-based API


### 1. Define Scopes on Your Entity

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Scopes, DefaultScope } from 'typeorm-query-scopes';

@DefaultScope<User>({
  where: { isActive: true }
})
@Scopes<User>({
  // Simple scope with where condition
  verified: {
    where: { isVerified: true }
  },
  
  // Scope with relations
  withPosts: {
    relations: { posts: true }
  },
  
  // Scope with ordering
  newest: {
    order: { createdAt: 'DESC' }
  },
  
  // Function scope with parameters
  byRole: (role: string) => ({
    where: { role }
  }),
  
  // Complex scope
  premium: {
    where: { 
      subscriptionType: 'premium',
      subscriptionExpiry: MoreThan(new Date())
    },
    relations: { subscription: true }
  }
})
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

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

> 💡 **Type-Safe Scopes**: By adding the second generic parameter with scope names, you get IDE autocomplete and compile-time validation when calling `.scope("scopeName")`!

### 2. Use Scopes in Your Queries

```typescript
import { getScopedRepository } from 'typeorm-query-scopes';
import { dataSource } from './data-source';
import { User } from './entities/User';

// Create a scoped repository
const userRepo = getScopedRepository(User, dataSource);

// Apply single scope
const verifiedUsers = await userRepo.scope('verified').find();

// Apply multiple scopes
const verifiedWithPosts = await userRepo
  .scope('verified', 'withPosts')
  .find();

// Apply function scope with parameters
const admins = await userRepo
  .scope({ method: ['byRole', 'admin'] })
  .find();

// Combine scopes and additional options
const recentAdmins = await userRepo
  .scope('newest', { method: ['byRole', 'admin'] })
  .find({ take: 10 });

// Remove default scope
const allUsers = await userRepo.unscoped().find();

// Apply default scope explicitly with other scopes
const activeVerified = await userRepo
  .scope('defaultScope', 'verified')
  .find();
```

## API Reference

### Type-Safe Scope Names

For better IDE support and compile-time safety, you can define scope names as types:

```typescript
@Scopes<User, {
  active: any;
  verified: any;
  byRole: any;
}>({
  active: { where: { isActive: true } },
  verified: { where: { isVerified: true } },
  byRole: (role: string) => ({ where: { role } })
})
@Entity()
class User { ... }

// Now TypeScript knows the available scope names!
const repo = getScopedRepository(User, dataSource);

// ✅ TypeScript autocompletes: 'active' | 'verified' | 'byRole'
repo.scope('active')  // IDE shows autocomplete!

// ❌ TypeScript error: 'invalid' is not a valid scope name
repo.scope('invalid')  // Compile error!
```

**Benefits:**
- IDE autocomplete for scope names
- Compile-time error checking
- Better refactoring support
- Self-documenting code

### Decorators

#### `@Scopes<Entity>(scopes)`

Define named scopes on an entity.

```typescript
@Scopes<User>({
  scopeName: { where: { field: value } },
  dynamicScope: (param) => ({ where: { field: param } })
})
```

#### `@DefaultScope<Entity>(scope)`

Define a default scope that's automatically applied to all queries.

```typescript
@DefaultScope<User>({
  where: { isActive: true }
})
```

### ScopedRepository Methods

#### `scope(...scopeNames)`

Apply one or more scopes to the repository.

```typescript
// Single scope
repo.scope('active')

// Multiple scopes
repo.scope('active', 'verified')

// Function scope with parameters
repo.scope({ method: ['byRole', 'admin'] })

// Include default scope explicitly
repo.scope('defaultScope', 'verified')
```

#### `unscoped()`

Remove all scopes including the default scope.

```typescript
repo.unscoped().find()
```

#### `find(options?)`

Find entities with applied scopes.

```typescript
await repo.scope('active').find({ take: 10 })
```

#### `findOne(options)`

Find one entity with applied scopes.

```typescript
await repo.scope('active').findOne({ where: { id: 1 } })
```

#### `findOneBy(where)`

Find one entity by conditions with applied scopes.

```typescript
await repo.scope('active').findOneBy({ email: 'user@example.com' })
```

#### `count(options?)`

Count entities with applied scopes.

```typescript
await repo.scope('active').count()
```

#### `findAndCount(options?)`

Find and count entities with applied scopes.

```typescript
const [users, total] = await repo.scope('active').findAndCount({ take: 10 })
```

## Scope Options

Scopes support the following TypeORM find options:

- `where` - Filter conditions (merged with AND logic)
- `relations` - Relations to load
- `order` - Sorting options
- `select` - Fields to select
- `skip` - Number of records to skip
- `take` - Number of records to take
- `cache` - Query caching options

## Scope Merging

When multiple scopes are applied, they are merged intelligently:

- **where**: Merged using AND logic
- **relations**: Combined (all relations loaded)
- **order**: Later scopes override earlier ones
- **select**: Combined (union of all fields)
- **skip/take/cache**: Last scope wins

```typescript
@Scopes<User>({
  scope1: {
    where: { isActive: true },
    order: { createdAt: 'DESC' },
    take: 10
  },
  scope2: {
    where: { isVerified: true },
    take: 20
  }
})

// Applying both scopes results in:
// where: { isActive: true, isVerified: true }
// order: { createdAt: 'DESC' }
// take: 20 (scope2 overrides scope1)
```

## Advanced Examples

### Scope with Complex Conditions

```typescript
import { MoreThan, LessThan, In } from 'typeorm';

@Scopes<Product>({
  inStock: {
    where: { quantity: MoreThan(0) }
  },
  
  inPriceRange: (min: number, max: number) => ({
    where: {
      price: MoreThan(min),
      price: LessThan(max)
    }
  }),
  
  byCategories: (categories: string[]) => ({
    where: { category: In(categories) }
  })
})
```

### Scope with Nested Relations

```typescript
@Scopes<Post>({
  withAuthorAndComments: {
    relations: {
      author: true,
      comments: {
        user: true
      }
    }
  },
  
  published: {
    where: { 
      status: 'published',
      publishedAt: LessThan(new Date())
    }
  }
})
```

### Reusable Scope Repository

```typescript
// Create a service with scoped repository
export class UserService {
  private userRepo: ScopedRepository<User>;

  constructor(private dataSource: DataSource) {
    this.userRepo = getScopedRepository(User, dataSource);
  }

  async getActiveUsers() {
    return this.userRepo.scope('active').find();
  }

  async getAdmins() {
    return this.userRepo
      .scope({ method: ['byRole', 'admin'] })
      .find();
  }

  async getAllUsersIncludingInactive() {
    return this.userRepo.unscoped().find();
  }
}
```

## Documentation

- [Type-Safe Scopes Guide](./TYPE_SAFE_SCOPES.md) - Complete guide to type-safe scope names
- [Basic Usage Example](./examples/basic-usage.ts) - Simple examples to get started
- [Advanced Usage Example](./examples/advanced-usage.ts) - Complex scope patterns
- [Type-Safe Scopes Example](./examples/type-safe-scopes.ts) - Type-safe scope demonstration
- [Real-world Example](./examples/real-world-example.ts) - Complete blog application example
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute to the project
- [Changelog](./CHANGELOG.md) - Version history and changes

## Roadmap

Future enhancements being considered:

- [ ] Support for `update()` and `delete()` operations with scopes
- [ ] Scope inheritance for entity inheritance
- [ ] Query builder integration
- [ ] Performance optimizations
- [ ] Additional scope merging strategies
- [ ] Scope validation and debugging tools

## FAQ

### Q: Can I use this with NestJS?

Yes! TypeORM Scopes works perfectly with NestJS. Just inject the DataSource and create scoped repositories:

```typescript
@Injectable()
export class UserService {
  private userRepo: ScopedRepository<User>;

  constructor(private dataSource: DataSource) {
    this.userRepo = getScopedRepository(User, dataSource);
  }

  async getActiveUsers() {
    return this.userRepo.scope('active').find();
  }
}
```

### Q: Does this work with MongoDB?

Yes, TypeORM Scopes works with any database supported by TypeORM, including MongoDB.

### Q: Can I combine scopes with QueryBuilder?

Currently, scopes work with the repository pattern. QueryBuilder integration is planned for a future release.

### Q: How does performance compare to regular TypeORM queries?

Scopes add minimal overhead - they simply merge options before executing the query. The actual database query performance is identical to regular TypeORM queries.

## License

MIT - see [LICENSE](./LICENSE) file for details

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Support

- 📖 [Documentation](./README.md)
- 🐛 [Issue Tracker](https://github.com/aramyounis/typeorm-query-scopes/issues)
- 💬 [Discussions](https://github.com/aramyounis/typeorm-query-scopes/discussions)



