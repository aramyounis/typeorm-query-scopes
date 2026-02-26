# Getting Started

Get up and running with TypeORM Scopes in 5 minutes.

## Installation

Install the package using your preferred package manager:

::: code-group

```bash [npm]
npm install typeorm-query-scopes
```

```bash [yarn]
yarn add typeorm-query-scopes
```

```bash [pnpm]
pnpm add typeorm-query-scopes
```

:::

## Prerequisites

- TypeORM 0.3.0 or higher
- TypeScript 5.0 or higher
- Node.js 16.0 or higher

## TypeScript Configuration

Make sure your `tsconfig.json` has these settings:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strict": true
  }
}
```

## Basic Setup

### 1. Define Scopes on Your Entity

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Scopes, DefaultScope } from 'typeorm-query-scopes';

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
}
```

### 2. Use Scoped Repository

```typescript
import { getScopedRepository } from 'typeorm-query-scopes';
import { dataSource } from './data-source';
import { User } from './entities/User';

// Create a scoped repository
const userRepo = getScopedRepository(User, dataSource);

// Use scopes
const verifiedUsers = await userRepo.scope('verified').find();
const admins = await userRepo.scope('admin').find();
const verifiedAdmins = await userRepo.scope('verified', 'admin').find();

// Remove default scope
const allUsers = await userRepo.unscoped().find();
```

## Next Steps

- Learn about [Default Scopes](/guide/default-scopes)
- Explore [Named Scopes](/guide/named-scopes)
- Try [Function Scopes](/guide/function-scopes)
- Understand [Scope Merging](/guide/scope-merging)
- Enable [Type-Safe Scopes](/guide/type-safe-scopes)

## Need Help?

- Check the [API Reference](/api/decorators)
- Browse [Examples](/examples/basic)
- Open an issue on [GitHub](https://github.com/aramyounis/typeorm-query-scopes/issues)
