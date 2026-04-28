# Why Scopes?

Understanding the value of scopes and when to use them.

## The DRY Principle

**Don't Repeat Yourself** is a fundamental principle in software development. Scopes help you apply this principle to your database queries.

### Without Scopes

```typescript
// In UserController.ts
const users = await userRepo.find({
  where: { isActive: true, isVerified: true },
  select: { id: true, email: true, name: true },
  relations: { posts: true }
});

// In AdminController.ts
const users = await userRepo.find({
  where: { isActive: true, isVerified: true },
  select: { id: true, email: true, name: true },
  relations: { posts: true }
});

// In UserService.ts
const users = await userRepo.find({
  where: { isActive: true, isVerified: true },
  select: { id: true, email: true, name: true },
  relations: { posts: true }
});
```

### With Scopes

```typescript
// Define once
@Scopes<User>({
  verified: {
    where: { isActive: true, isVerified: true },
    select: { id: true, email: true, name: true },
    relations: { posts: true }
  }
})

// Use everywhere
const users = await userRepo.scope('verified').find();
```

## Real-World Benefits

### 1. Maintenance

**Scenario:** You need to add a new field to the "verified users" query.

**Without Scopes:**
- Find all occurrences (grep, search)
- Update each one individually
- Risk missing some
- Test everything

**With Scopes:**
- Update one scope definition
- All queries automatically updated
- Single point of testing

### 2. Consistency

**Problem:** Different developers write similar queries differently.

**Without Scopes:**
```typescript
// Developer A
{ where: { isActive: true, isVerified: true } }

// Developer B
{ where: { isVerified: true, isActive: true } }

// Developer C
{ where: { isActive: 1, isVerified: 1 } }
```

**With Scopes:**
```typescript
// Everyone uses the same scope
userRepo.scope('verified')
```

### 3. Readability

**Without Scopes:**
```typescript
const result = await userRepo.find({
  where: {
    isActive: true,
    isVerified: true,
    role: In(['admin', 'moderator']),
    createdAt: MoreThan(lastWeek)
  },
  select: { id: true, email: true, name: true, role: true },
  relations: { posts: true, comments: true },
  order: { createdAt: 'DESC' },
  take: 10
});
```

**With Scopes:**
```typescript
const result = await userRepo
  .scope('verified', 'staff', 'recent', 'withActivity')
  .find({ take: 10 });
```

## Common Use Cases

### Soft Deletes

```typescript
@DefaultScope<Post>({
  where: { deletedAt: IsNull() }
})
```

Every query automatically excludes deleted records. Use `unscoped()` when you need them.

### Multi-Tenancy

```typescript
@Scopes<Data>({
  forTenant: (tenantId: number) => ({
    where: { tenantId }
  })
})
```

Ensure data isolation across tenants.

### API Responses

```typescript
@Scopes<User>({
  publicFields: {
    select: { id: true, name: true, avatar: true }
  },
  privateFields: {
    select: { id: true, name: true, email: true, phone: true, address: true }
  }
})
```

Consistent field selection for different contexts.

### Access Control

```typescript
@Scopes<Document>({
  accessible: (userId: number) => ({
    where: [
      { ownerId: userId },
      { sharedWith: { id: userId } }
    ]
  })
})
```

Enforce access control at the query level.

## Performance Considerations

### No Runtime Overhead

Scopes are resolved at query time, not at runtime:

```typescript
// This
userRepo.scope('verified').find()

// Becomes this at query time
userRepo.find({ where: { isVerified: true } })
```

No additional database queries, no performance penalty.

### Query Optimization

Scopes can actually improve performance:

```typescript
@Scopes<User>({
  minimal: {
    select: { id: true, name: true }  // Only fetch needed fields
  }
})
```

Fetch only what you need, reducing data transfer.

## Team Benefits

### Onboarding

New developers can understand queries faster:

```typescript
// What does this query do?
userRepo.scope('verified', 'active', 'withPosts')

// Clear intent, easy to understand
```

### Code Reviews

Easier to review:

```typescript
// Before: Review 20 lines of query options
// After: Review scope name, check scope definition once
```

### Testing

Test scopes once, use everywhere:

```typescript
describe('User scopes', () => {
  it('verified scope filters correctly', async () => {
    const users = await userRepo.scope('verified').find();
    expect(users.every(u => u.isVerified)).toBe(true);
  });
});
```

## When NOT to Use Scopes

Scopes aren't always the answer:

### One-Off Queries

If a query is truly unique and won't be reused, don't create a scope:

```typescript
// Don't create a scope for this
const user = await userRepo.findOne({
  where: { email: 'specific@email.com', tempToken: 'abc123' }
});
```

### Very Simple Queries

For trivial queries, scopes might be overkill:

```typescript
// Maybe too simple for a scope
const user = await userRepo.findOne({ where: { id: 1 } });
```

### Dynamic Complex Logic

If the logic is too dynamic or complex, consider other patterns:

```typescript
// This might be better as a custom repository method
const results = await customComplexQuery(params);
```

## Best Practices

1. **Name Clearly** - Use descriptive scope names
2. **Keep Focused** - Each scope should do one thing well
3. **Document** - Add comments for complex scopes
4. **Test** - Write tests for your scopes
5. **Review** - Regularly review and refactor scopes

## Next Steps

- Learn about [Default Scopes](/guide/default-scopes)
- Explore [Named Scopes](/guide/named-scopes)
- Try [Function Scopes](/guide/function-scopes)
- See [Real-World Examples](/examples/real-world)
