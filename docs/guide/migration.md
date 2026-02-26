# Migration from Sequelize

Guide for developers familiar with Sequelize scopes.

## Sequelize vs TypeORM Scopes

### Sequelize

```javascript
const User = sequelize.define('User', {
  // fields
}, {
  defaultScope: {
    where: { isActive: true }
  },
  scopes: {
    verified: {
      where: { isVerified: true }
    },
    admin: {
      where: { role: 'admin' }
    }
  }
});

// Usage
User.scope('verified').findAll();
User.scope('verified', 'admin').findAll();
User.unscoped().findAll();
```

### TypeORM Scopes

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
class User { ... }

// Usage
const userRepo = getScopedRepository(User, dataSource);
userRepo.scope('verified').find();
userRepo.scope('verified', 'admin').find();
userRepo.unscoped().find();
```

## Key Differences

### 1. Decorator-Based

TypeORM Scopes uses decorators instead of model options:

```typescript
// Sequelize: model options
const User = sequelize.define('User', { ... }, {
  scopes: { ... }
});

// TypeORM Scopes: decorators
@Scopes<User>({ ... })
@Entity()
class User { ... }
```

### 2. Repository Pattern

TypeORM uses repositories instead of model methods:

```javascript
// Sequelize
User.scope('verified').findAll();

// TypeORM Scopes
const userRepo = getScopedRepository(User, dataSource);
userRepo.scope('verified').find();
```

### 3. Type Safety

TypeORM Scopes offers full TypeScript support:

```typescript
@Scopes<User, {
  verified: any;
  admin: any;
}>({ ... })

// IDE autocomplete and compile-time errors
userRepo.scope('verified'); // ✅
userRepo.scope('verifed'); // ❌ TypeScript error
```

## Migration Examples

### Default Scope

```javascript
// Sequelize
const User = sequelize.define('User', { ... }, {
  defaultScope: {
    where: { isActive: true }
  }
});
```

```typescript
// TypeORM Scopes
@DefaultScope<User>({
  where: { isActive: true }
})
@Entity()
class User { ... }
```

### Named Scopes

```javascript
// Sequelize
scopes: {
  verified: {
    where: { isVerified: true }
  },
  withPosts: {
    include: [{ model: Post }]
  }
}
```

```typescript
// TypeORM Scopes
@Scopes<User>({
  verified: {
    where: { isVerified: true }
  },
  withPosts: {
    relations: { posts: true }
  }
})
```

### Function Scopes

```javascript
// Sequelize
scopes: {
  byRole(role) {
    return {
      where: { role }
    };
  }
}

// Usage
User.scope({ method: ['byRole', 'admin'] }).findAll();
```

```typescript
// TypeORM Scopes
@Scopes<User>({
  byRole: (role: string) => ({
    where: { role }
  })
})

// Usage
userRepo.scope({ method: ['byRole', 'admin'] }).find();
```

### Attributes (Select)

```javascript
// Sequelize
scopes: {
  publicFields: {
    attributes: ['id', 'name', 'avatar']
  }
}
```

```typescript
// TypeORM Scopes
@Scopes<User>({
  publicFields: {
    select: ['id', 'name', 'avatar']
  }
})
```

### Order

```javascript
// Sequelize
scopes: {
  newest: {
    order: [['createdAt', 'DESC']]
  }
}
```

```typescript
// TypeORM Scopes
@Scopes<User>({
  newest: {
    order: { createdAt: 'DESC' }
  }
})
```

### Include (Relations)

```javascript
// Sequelize
scopes: {
  withEverything: {
    include: [
      { model: Post },
      { model: Comment },
      { model: Profile }
    ]
  }
}
```

```typescript
// TypeORM Scopes
@Scopes<User>({
  withEverything: {
    relations: {
      posts: true,
      comments: true,
      profile: true
    }
  }
})
```

## API Comparison

| Operation | Sequelize | TypeORM Scopes |
|-----------|-----------|----------------|
| Define default | `defaultScope: { ... }` | `@DefaultScope<T>({ ... })` |
| Define scopes | `scopes: { ... }` | `@Scopes<T>({ ... })` |
| Apply scope | `Model.scope('name')` | `repo.scope('name')` |
| Multiple scopes | `Model.scope('a', 'b')` | `repo.scope('a', 'b')` |
| Function scope | `scope({ method: ['fn', arg] })` | `scope({ method: ['fn', arg] })` |
| Remove default | `Model.unscoped()` | `repo.unscoped()` |
| Find all | `.findAll()` | `.find()` |
| Find one | `.findOne()` | `.findOne()` |
| Count | `.count()` | `.count()` |

## Common Patterns

### Soft Deletes

```javascript
// Sequelize
defaultScope: {
  where: { deletedAt: null }
}
```

```typescript
// TypeORM Scopes
import { IsNull } from 'typeorm';

@DefaultScope<User>({
  where: { deletedAt: IsNull() }
})
```

### Multi-Tenancy

```javascript
// Sequelize
defaultScope: {
  where: { tenantId: getCurrentTenantId() }
}
```

```typescript
// TypeORM Scopes
@DefaultScope<User>({
  where: { tenantId: getCurrentTenantId() }
})
```

### Search

```javascript
// Sequelize
scopes: {
  search(query) {
    return {
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } }
        ]
      }
    };
  }
}
```

```typescript
// TypeORM Scopes
import { Like } from 'typeorm';

@Scopes<User>({
  search: (query: string) => ({
    where: [
      { name: Like(`%${query}%`) },
      { email: Like(`%${query}%`) }
    ]
  })
})
```

## Benefits Over Sequelize

1. **Type Safety**: Full TypeScript support with autocomplete
2. **Decorator Syntax**: Clean, modern syntax
3. **Better IDE Support**: IntelliSense for scope names
4. **Compile-Time Validation**: Catch errors before runtime
5. **Consistent with TypeORM**: Uses familiar TypeORM patterns

## See Also

- [Getting Started](/guide/getting-started)
- [Named Scopes](/guide/named-scopes)
- [Function Scopes](/guide/function-scopes)
