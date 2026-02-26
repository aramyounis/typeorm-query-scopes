# NestJS Integration

How to use TypeORM Scopes in a NestJS application.

## Installation

```bash
npm install typeorm-query-scopes typeorm @nestjs/typeorm
```

## Entity Setup

```typescript
// user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Scopes, DefaultScope } from 'typeorm-query-scopes';

@DefaultScope<User>({
  where: { isActive: true }
})
@Scopes<User, {
  verified: any;
  admin: any;
  withPosts: any;
  newest: any;
}>({
  verified: {
    where: { isVerified: true }
  },
  admin: {
    where: { role: 'admin' }
  },
  withPosts: {
    relations: { posts: true }
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

## Service with Scoped Repository

```typescript
// user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { getScopedRepository } from 'typeorm-query-scopes';
import { User } from './user.entity';

@Injectable()
export class UserService {
  private userRepo;

  constructor(
    @InjectDataSource()
    private dataSource: DataSource
  ) {
    this.userRepo = getScopedRepository(User, this.dataSource);
  }

  async findAll() {
    return this.userRepo.find();
  }

  async findVerified() {
    return this.userRepo.scope('verified').find();
  }

  async findAdmins() {
    return this.userRepo.scope('admin', 'verified').find();
  }

  async findWithPosts(limit: number = 10) {
    return this.userRepo
      .scope('withPosts', 'newest')
      .find({ take: limit });
  }

  async findById(id: number) {
    return this.userRepo.findOne({ where: { id } });
  }

  async findAllIncludingInactive() {
    return this.userRepo.unscoped().find();
  }
}
```

## Controller

```typescript
// user.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  @Get('verified')
  async findVerified() {
    return this.userService.findVerified();
  }

  @Get('admins')
  async findAdmins() {
    return this.userService.findAdmins();
  }

  @Get('with-posts')
  async findWithPosts(@Query('limit') limit?: number) {
    return this.userService.findWithPosts(limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.userService.findById(id);
  }
}
```

## Module Setup

```typescript
// user.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
```

## App Module

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'user',
      password: 'password',
      database: 'mydb',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true
    }),
    UserModule
  ]
})
export class AppModule {}
```

## Custom Repository Provider

For more control, create a custom provider:

```typescript
// user.providers.ts
import { DataSource } from 'typeorm';
import { getScopedRepository } from 'typeorm-query-scopes';
import { User } from './user.entity';

export const USER_SCOPED_REPOSITORY = 'USER_SCOPED_REPOSITORY';

export const userScopedRepositoryProvider = {
  provide: USER_SCOPED_REPOSITORY,
  useFactory: (dataSource: DataSource) => {
    return getScopedRepository(User, dataSource);
  },
  inject: [DataSource]
};
```

```typescript
// user.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { USER_SCOPED_REPOSITORY } from './user.providers';
import { ScopedRepository } from 'typeorm-query-scopes';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_SCOPED_REPOSITORY)
    private userRepo: ScopedRepository<User, 'verified' | 'admin' | 'withPosts' | 'newest'>
  ) {}

  async findVerified() {
    // Full type safety with autocomplete
    return this.userRepo.scope('verified').find();
  }
}
```

```typescript
// user.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { userScopedRepositoryProvider } from './user.providers';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService, userScopedRepositoryProvider],
  exports: [UserService]
})
export class UserModule {}
```

## Pagination Example

```typescript
// user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { getScopedRepository } from 'typeorm-query-scopes';
import { User } from './user.entity';

interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}

@Injectable()
export class UserService {
  private userRepo;

  constructor(@InjectDataSource() private dataSource: DataSource) {
    this.userRepo = getScopedRepository(User, this.dataSource);
  }

  async paginate(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginationResult<User>> {
    const skip = (page - 1) * limit;
    
    const [data, total] = await this.userRepo
      .scope('verified')
      .findAndCount({ take: limit, skip });
    
    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }
}
```

```typescript
// user.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    return this.userService.paginate(page, limit);
  }
}
```

## Testing

```typescript
// user.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserService } from './user.service';
import { User } from './user.entity';

describe('UserService', () => {
  let service: UserService;
  let dataSource: DataSource;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getDataSourceToken(),
          useValue: {
            getRepository: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<UserService>(UserService);
    dataSource = module.get<DataSource>(getDataSourceToken());
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add more tests...
});
```

## Best Practices

1. **Inject DataSource**: Always inject the DataSource to create scoped repositories
2. **Type Safety**: Use the second generic parameter for type-safe scope names
3. **Service Layer**: Keep scope logic in services, not controllers
4. **Reusable Scopes**: Define common scopes in entities, specific ones in services
5. **Testing**: Mock the DataSource for unit tests

## Common Patterns

### Multi-Tenancy

```typescript
@DefaultScope<Data>({
  where: { tenantId: () => getCurrentTenantId() }
})
@Entity()
export class Data {
  @Column()
  tenantId: number;
}
```

### Soft Deletes

```typescript
@DefaultScope<Post>({
  where: { deletedAt: IsNull() }
})
@Entity()
export class Post {
  @Column({ nullable: true })
  deletedAt: Date | null;
}
```

### Role-Based Access

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

// In service
async findByRole(role: string) {
  return this.userRepo
    .scope({ method: ['byRole', role] })
    .find();
}
```

## See Also

- [Basic Examples](/examples/basic)
- [Advanced Patterns](/examples/advanced)
- [Real-World Application](/examples/real-world)
- [Getting Started Guide](/guide/getting-started)
