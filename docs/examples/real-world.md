# Real-World Application

Complete example of a blog application using TypeORM Scopes.

## Entities

### User Entity

```typescript
@DefaultScope<User>({
  where: { isActive: true, deletedAt: IsNull() }
})
@Scopes<User>({
  verified: { where: { isVerified: true } },
  authors: { where: { role: In(['author', 'admin']) } },
  admins: { where: { role: 'admin' } },
  withPosts: { relations: { posts: true } },
  withProfile: { relations: { profile: true } },
  newest: { order: { createdAt: 'DESC' } },
  byRole: (role: string) => ({ where: { role } })
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

  @Column({ nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => Post, post => post.author)
  posts: Post[];

  @ManyToOne(() => Profile)
  profile: Profile;

  @CreateDateColumn()
  createdAt: Date;
}
```

### Post Entity

```typescript
@DefaultScope<Post>({
  where: { status: 'published', deletedAt: IsNull() }
})
@Scopes<Post>({
  draft: { where: { status: 'draft' } },
  scheduled: { where: { status: 'scheduled' } },
  withAuthor: { relations: { author: true } },
  withComments: { relations: { comments: true } },
  popular: { where: { views: MoreThan(1000) }, order: { views: 'DESC' } },
  newest: { order: { createdAt: 'DESC' } },
  byAuthor: (authorId: number) => ({ where: { author: { id: authorId } } }),
  byTag: (tag: string) => ({ relations: { tags: true }, where: { tags: { name: tag } } })
})
@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column()
  status: string;

  @Column({ default: 0 })
  views: number;

  @Column({ nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => User, user => user.posts)
  author: User;

  @OneToMany(() => Comment, comment => comment.post)
  comments: Comment[];

  @ManyToMany(() => Tag)
  @JoinTable()
  tags: Tag[];

  @CreateDateColumn()
  createdAt: Date;
}
```

## Services

### User Service

```typescript
export class UserService {
  private userRepo;

  constructor(dataSource: DataSource) {
    this.userRepo = getScopedRepository(User, dataSource);
  }

  async getActiveUsers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    return this.userRepo.findAndCount({ take: limit, skip });
  }

  async getVerifiedAuthors() {
    return this.userRepo.scope('verified', 'authors', 'withPosts').find();
  }

  async getUsersByRole(role: string) {
    return this.userRepo.scope({ method: ['byRole', role] }).find();
  }

  async getAllUsersForAdmin() {
    return this.userRepo.unscoped().find();
  }
}
```

### Post Service

```typescript
export class PostService {
  private postRepo;

  constructor(dataSource: DataSource) {
    this.postRepo = getScopedRepository(Post, dataSource);
  }

  async getPublishedPosts(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    return this.postRepo
      .scope('withAuthor', 'newest')
      .findAndCount({ take: limit, skip });
  }

  async getPopularPosts(limit: number = 10) {
    return this.postRepo
      .scope('popular', 'withAuthor')
      .find({ take: limit });
  }

  async getPostsByAuthor(authorId: number) {
    return this.postRepo
      .scope({ method: ['byAuthor', authorId] }, 'newest')
      .find();
  }

  async getDraftPosts() {
    return this.postRepo
      .unscoped()
      .scope('draft', 'withAuthor')
      .find();
  }

  async getStatistics() {
    const [total, published, draft] = await Promise.all([
      this.postRepo.unscoped().count(),
      this.postRepo.count(),
      this.postRepo.unscoped().scope('draft').count()
    ]);

    return { total, published, draft };
  }
}
```

## Controllers

### User Controller

```typescript
export class UserController {
  constructor(private userService: UserService) {}

  async getUsers(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [users, total] = await this.userService.getActiveUsers(page, limit);

    res.json({
      data: users,
      meta: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  }

  async getAuthors(req: Request, res: Response) {
    const authors = await this.userService.getVerifiedAuthors();
    res.json({ data: authors });
  }
}
```

### Post Controller

```typescript
export class PostController {
  constructor(private postService: PostService) {}

  async getPosts(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const [posts, total] = await this.postService.getPublishedPosts(page);

    res.json({
      data: posts,
      meta: { total, page, pages: Math.ceil(total / 10) }
    });
  }

  async getPopular(req: Request, res: Response) {
    const posts = await this.postService.getPopularPosts();
    res.json({ data: posts });
  }

  async getAuthorPosts(req: Request, res: Response) {
    const authorId = parseInt(req.params.authorId);
    const posts = await this.postService.getPostsByAuthor(authorId);
    res.json({ data: posts });
  }
}
```

## Benefits in This Application

1. **Consistency** - All "published posts" queries use the same scope
2. **Maintainability** - Change query logic in one place
3. **Readability** - `scope('published', 'withAuthor')` is self-documenting
4. **Flexibility** - Easy to add new scopes as needed
5. **Testing** - Test scopes independently

## Next Steps

- [NestJS Integration](/examples/nestjs)
- [Best Practices](/guide/best-practices)
