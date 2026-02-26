---
layout: home

hero:
  name: TypeORM Query Scopes
  text: Reusable Query Patterns for TypeORM
  tagline: Define query patterns once, use everywhere. Clean, type-safe, and composable.
  image:
    src: /logo.svg
    alt: TypeORM Query Scopes
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/aramyounis/typeorm-query-scopes
    - theme: alt
      text: API Reference
      link: /api/decorators

features:
  - icon:
      src: /icons/reusable.svg
    title: Reusable Query Patterns
    details: Define where, select, relations, order, and pagination once. Apply anywhere with a simple API.
  
  - icon:
      src: /icons/type-safe.svg
    title: Type-Safe
    details: Full TypeScript support with IDE autocomplete for scope names. Catch typos at compile-time.
  
  - icon:
      src: /icons/clean.svg
    title: Clean & Declarative
    details: Decorator-based syntax keeps your entities clean and your queries readable.
  
  - icon:
      src: /icons/performance.svg
    title: Zero Overhead
    details: Scopes are resolved at query time with no performance penalty. Just clean code.
  
  - icon:
      src: /icons/composable.svg
    title: Composable
    details: Combine multiple scopes intelligently. Smart merging handles where, select, relations, and more.
  
  - icon:
      src: /icons/migration.svg
    title: Easy Integration
    details: Works seamlessly with existing TypeORM code. No breaking changes to your current setup.
---

## Quick Example

```typescript
import { Scopes, DefaultScope, getScopedRepository } from 'typeorm-query-scopes';

@DefaultScope<User>({ where: { isActive: true } })
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
class User {
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

// Usage
const userRepo = getScopedRepository(User, dataSource);

// Simple scope
const verified = await userRepo.scope('verified').find();

// Multiple scopes
const verifiedAdmins = await userRepo.scope('verified', 'admin').find();

// With relations
const usersWithPosts = await userRepo.scope('withPosts').find();

// Remove default scope
const allUsers = await userRepo.unscoped().find();
```

## Installation

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

## Why TypeORM Scopes?

<div class="tip custom-block">
  <p class="custom-block-title">DRY Principle</p>
  <p>Stop repeating the same query patterns. Define once, use everywhere.</p>
</div>

<div class="tip custom-block">
  <p class="custom-block-title">Better Maintenance</p>
  <p>Change query logic in one place instead of hunting through dozens of files.</p>
</div>

<div class="tip custom-block">
  <p class="custom-block-title">Type Safety</p>
  <p>Get IDE autocomplete and compile-time validation for scope names.</p>
</div>

## What's Next?

<div class="info custom-block">
  <p class="custom-block-title">Beta Release</p>
  <p>This is version 1.0.0. The API is stable but may change based on community feedback. Please report any issues on GitHub!</p>
</div>

- [Getting Started Guide](/guide/getting-started)
- [Core Concepts](/guide/default-scopes)
- [Type-Safe Scopes](/guide/type-safe-scopes)
- [API Reference](/api/decorators)
- [Examples](/examples/basic)
