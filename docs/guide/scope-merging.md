# Scope Merging

How multiple scopes are combined when applied together.

## Merging Rules

When multiple scopes are applied, they're merged using these rules:

### WHERE Conditions

Combined with AND logic:

```typescript
@Scopes<User>({
  verified: { where: { isVerified: true } },
  active: { where: { isActive: true } }
})

// Results in: WHERE isVerified = true AND isActive = true
await userRepo.scope('verified', 'active').find();
```

### SELECT Fields

SELECT trees are deep-merged by field path:

```typescript
@Scopes<User>({
  basic: { select: { id: true, name: true } },
  detailed: { select: { email: true, phone: true } }
})

// Uses id, name, email, and phone
await userRepo.scope('basic', 'detailed').find();
```

### RELATIONS

Merged together:

```typescript
@Scopes<User>({
  withPosts: { relations: { posts: true } },
  withComments: { relations: { comments: true } }
})

// Loads both posts and comments
await userRepo.scope('withPosts', 'withComments').find();
```

### RELATION SCOPES

Merged by relation path and concatenated as lists:

```typescript
@Scopes<User>({
  roleActive: {
    relationScopes: {
      role: ['activeOnly']
    }
  },
  roleAdmin: {
    relationScopes: {
      role: ['adminOnly']
    }
  }
})

// Applies both scopes to the same relation path: role
await userRepo.scope('roleActive', 'roleAdmin').find();
```

### ORDER

Later scopes override earlier ones:

```typescript
@Scopes<User>({
  byName: { order: { name: 'ASC' } },
  byDate: { order: { createdAt: 'DESC' } }
})

// Only uses byDate ordering
await userRepo.scope('byName', 'byDate').find();
```

## Default Scope Merging

Default scopes are always applied first:

```typescript
@DefaultScope<User>({
  where: { isActive: true }
})
@Scopes<User>({
  verified: { where: { isVerified: true } }
})

// WHERE isActive = true AND isVerified = true
await userRepo.scope('verified').find();
```

## Best Practices

1. Design scopes to be composable
2. Avoid conflicting select/order in commonly combined scopes
3. Use specific scope names to indicate merging behavior
4. Test scope combinations

## See Also

- [Named Scopes](/guide/named-scopes)
- [Default Scopes](/guide/default-scopes)
