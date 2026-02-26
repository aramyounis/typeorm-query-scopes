# What is TypeORM Query Scopes?

TypeORM Query Scopes is a package that allows you to define reusable query patterns using decorators.

## The Problem

When working with TypeORM, you often find yourself repeating the same query patterns:

- Same where conditions across multiple files
- Repeated select field lists
- Common relation loading patterns
- Consistent ordering logic

This leads to:
- Code duplication
- Maintenance nightmares
- Inconsistent query logic
- Verbose, hard-to-read code

## The Solution

TypeORM Scopes lets you define query patterns once and reuse them everywhere:

- **Define once** - Use decorators to define scopes on your entities
- **Use everywhere** - Apply scopes with a simple, chainable API
- **Compose freely** - Combine multiple scopes intelligently
- **Stay type-safe** - Full TypeScript support with IDE autocomplete

## Key Concepts

### Scopes

A scope is a reusable query pattern that can include:
- **where** - Filter conditions
- **select** - Field selection
- **relations** - Relation loading
- **order** - Sorting logic
- **skip/take** - Pagination

### Default Scopes

Automatically applied to all queries. Perfect for:
- Soft deletes
- Multi-tenancy
- Active/inactive filtering

### Named Scopes

Explicitly applied when needed. Great for:
- Role-based filtering
- Status filtering
- Common query patterns

### Function Scopes

Dynamic scopes that accept parameters:
- Search by field
- Date range filtering
- Custom logic

## Benefits

### For Developers

- **Less Code** - Reduce query code by up to 60%
- **Better Readability** - Clean, declarative syntax
- **Faster Development** - Reuse instead of rewrite
- **Type Safety** - Catch errors at compile-time

### For Teams

- **Consistency** - Centralized query logic
- **Maintainability** - Change once, apply everywhere
- **Onboarding** - New developers understand queries faster
- **Quality** - Tested, reusable patterns

### For Projects

- **Scalability** - Easy to add new query patterns
- **Flexibility** - Works alongside existing code
- **Performance** - Zero runtime overhead
- **Reliability** - Comprehensive test coverage


If you've used Sequelize, TypeORM Scopes will feel familiar:

| Feature | Sequelize | TypeORM Scopes |
|---------|-----------|----------------|
| Default scope | ✅ | ✅ |
| Named scopes | ✅ | ✅ |
| Function scopes | ✅ | ✅ |
| Scope merging | ✅ | ✅ |
| Type safety | ❌ | ✅ |
| Decorator-based | ❌ | ✅ |

## When to Use

TypeORM Scopes is perfect for:

- ✅ Projects with repeated query patterns
- ✅ Applications with complex filtering logic
- ✅ Multi-tenant applications
- ✅ APIs with consistent response formats
- ✅ Teams wanting better code organization

## When Not to Use

Consider alternatives if:

- ❌ You have very simple queries
- ❌ Each query is completely unique
- ❌ You prefer query builders over repositories
- ❌ You're not using TypeORM 0.3+

## Next Steps

Ready to get started?

- [Installation & Setup](/guide/getting-started)
- [Learn Why Scopes Matter](/guide/why-scopes)
- [Explore Examples](/examples/basic)
