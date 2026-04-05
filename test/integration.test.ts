/**
 * Integration Test for TypeORM Scopes
 * Run with: npx ts-node test/integration.test.ts
 */

import 'reflect-metadata';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DataSource,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  MoreThan,
  LessThan,
  In
} from 'typeorm';
import { Scopes, DefaultScope, getScopedRepository } from '../src';

// ============================================================================
// TEST ENTITIES
// ============================================================================

@DefaultScope<User>({
  where: { isActive: true }
})
@Scopes<User>({
  verified: {
    where: { isVerified: true }
  },
  
  admin: {
    where: { role: 'admin' }
  },
  
  withPosts: {
    relations: { posts: true }
  },
  
  byRole: (role: string) => ({
    where: { role }
  }),
  
  newest: {
    order: { createdAt: 'DESC' }
  }
})
@Entity()
class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  email!: string;

  @Column()
  name!: string;

  @Column()
  role!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isVerified!: boolean;

  @OneToMany(() => Post, post => post.author)
  posts!: Post[];

  @CreateDateColumn()
  createdAt!: Date;
}

@DefaultScope<Post>({
  where: { status: 'published' }
})
@Scopes<Post>({
  draft: {
    where: { status: 'draft' }
  },
  
  withAuthor: {
    relations: { author: true }
  },
  
  popular: {
    where: { views: MoreThan(100) },
    order: { views: 'DESC' }
  },
  
  byStatus: (status: string) => ({
    where: { status }
  })
})
@Entity()
class Post {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column()
  status!: string;

  @Column({ default: 0 })
  views!: number;

  @ManyToOne(() => User, user => user.posts)
  author!: User;

  @CreateDateColumn()
  createdAt!: Date;
}

@DefaultScope<RoleEntity>({
  where: { isActive: true }
})
@Scopes<RoleEntity>({
  adminOnly: {
    where: { name: 'admin' }
  },
  inTenant: (tenantId: number) => ({
    where: { tenantId }
  })
})
@Entity()
class RoleEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  tenantId!: number;

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(() => Member, member => member.role)
  members!: Member[];
}

@Scopes<Member>({
  withScopedRole: {
    relations: { role: true },
    relationScopes: {
      role: ['adminOnly', { method: ['inTenant', 1] }]
    }
  }
})
@Entity()
class Member {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @ManyToOne(() => RoleEntity, role => role.members)
  role!: RoleEntity;
}

// ============================================================================
// TEST SUITE
// ============================================================================

class IntegrationTest {
  private dataSource!: DataSource;
  private userRepo: any;
  private postRepo: any;
  private memberRepo: any;
  private testsPassed = 0;
  private testsFailed = 0;

  async setup() {
    console.log('🔧 Setting up test database...\n');
    
    this.dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [User, Post, RoleEntity, Member],
      synchronize: true,
      logging: false
    });

    await this.dataSource.initialize();
    
    this.userRepo = getScopedRepository(User, this.dataSource);
    this.postRepo = getScopedRepository(Post, this.dataSource);
    this.memberRepo = getScopedRepository(Member, this.dataSource);

    await this.seedData();
    console.log('✅ Database setup complete\n');
  }

  async seedData() {
    const userRepository = this.dataSource.getRepository(User);
    const postRepository = this.dataSource.getRepository(Post);
    const roleRepository = this.dataSource.getRepository(RoleEntity);
    const memberRepository = this.dataSource.getRepository(Member);

    // Create users
    const users = [
      { email: 'admin@test.com', name: 'Admin User', role: 'admin', isActive: true, isVerified: true, createdAt: new Date('2024-01-01') },
      { email: 'user1@test.com', name: 'User One', role: 'user', isActive: true, isVerified: true, createdAt: new Date('2024-01-02') },
      { email: 'user2@test.com', name: 'User Two', role: 'user', isActive: true, isVerified: false, createdAt: new Date('2024-01-03') },
      { email: 'inactive@test.com', name: 'Inactive User', role: 'user', isActive: false, isVerified: false, createdAt: new Date('2024-01-04') },
    ];

    const savedUsers = [];
    for (const userData of users) {
      const user = userRepository.create(userData);
      savedUsers.push(await userRepository.save(user));
    }

    // Create posts
    const posts = [
      { title: 'Published Post 1', status: 'published', views: 150, author: savedUsers[0], createdAt: new Date('2024-01-05') },
      { title: 'Published Post 2', status: 'published', views: 50, author: savedUsers[1], createdAt: new Date('2024-01-06') },
      { title: 'Draft Post', status: 'draft', views: 0, author: savedUsers[0], createdAt: new Date('2024-01-07') },
      { title: 'Popular Post', status: 'published', views: 500, author: savedUsers[1], createdAt: new Date('2024-01-08') },
    ];

    for (const postData of posts) {
      const post = postRepository.create(postData);
      await postRepository.save(post);
    }

    const roles = await roleRepository.save([
      roleRepository.create({ name: 'admin', isActive: true, tenantId: 1 }),
      roleRepository.create({ name: 'user', isActive: true, tenantId: 1 }),
      roleRepository.create({ name: 'admin', isActive: false, tenantId: 1 }),
      roleRepository.create({ name: 'admin', isActive: true, tenantId: 2 }),
    ]);

    await memberRepository.save([
      memberRepository.create({ name: 'Active Admin Member', role: roles[0] }),
      memberRepository.create({ name: 'User Member', role: roles[1] }),
      memberRepository.create({ name: 'Inactive Admin Member', role: roles[2] }),
      memberRepository.create({ name: 'Other Tenant Admin Member', role: roles[3] }),
    ]);
  }

  async teardown() {
    await this.dataSource.destroy();
  }

  // Test helper
  test(name: string, fn: () => Promise<void>) {
    return async () => {
      try {
        await fn();
        console.log(`✅ ${name}`);
        this.testsPassed++;
      } catch (error) {
        console.log(`❌ ${name}`);
        console.error(`   Error: ${(error as Error).message}`);
        this.testsFailed++;
      }
    };
  }

  assert(condition: boolean, message: string) {
    if (!condition) {
      throw new Error(message);
    }
  }

  // ============================================================================
  // TESTS
  // ============================================================================

  async testDefaultScope() {
    const users = await this.userRepo.find();
    this.assert(users.length === 3, `Expected 3 active users, got ${users.length}`);
    this.assert(users.every((u: User) => u.isActive), 'All users should be active');
  }

  async testUnscoped() {
    const users = await this.userRepo.unscoped().find();
    this.assert(users.length === 4, `Expected 4 total users, got ${users.length}`);
  }

  async testSingleScope() {
    const verifiedUsers = await this.userRepo.scope('verified').find();
    this.assert(verifiedUsers.length === 2, `Expected 2 verified users, got ${verifiedUsers.length}`);
    this.assert(verifiedUsers.every((u: User) => u.isVerified), 'All should be verified');
  }

  async testMultipleScopes() {
    const verifiedAdmins = await this.userRepo.scope('verified', 'admin').find();
    this.assert(verifiedAdmins.length === 1, `Expected 1 verified admin, got ${verifiedAdmins.length}`);
    this.assert(verifiedAdmins[0].role === 'admin', 'Should be admin');
    this.assert(verifiedAdmins[0].isVerified, 'Should be verified');
  }

  async testFunctionScope() {
    const admins = await this.userRepo.scope({ method: ['byRole', 'admin'] }).find();
    this.assert(admins.length === 1, `Expected 1 admin, got ${admins.length}`);
    this.assert(admins[0].role === 'admin', 'Should be admin role');
  }

  async testScopeWithRelations() {
    const usersWithPosts = await this.userRepo.scope('withPosts').find();
    this.assert(usersWithPosts.length === 3, `Expected 3 users, got ${usersWithPosts.length}`);
    this.assert(usersWithPosts[0].posts !== undefined, 'Posts should be loaded');
  }

  async testScopeWithOrdering() {
    const users = await this.userRepo.scope('newest').find();
    this.assert(users.length === 3, `Expected 3 users, got ${users.length}`);
    // Check if sorted by createdAt DESC
    for (let i = 0; i < users.length - 1; i++) {
      this.assert(
        users[i].createdAt >= users[i + 1].createdAt,
        'Should be sorted by createdAt DESC'
      );
    }
  }

  async testCount() {
    const count = await this.userRepo.scope('verified').count();
    this.assert(count === 2, `Expected count 2, got ${count}`);
  }

  async testFindAndCount() {
    const [users, total] = await this.userRepo.scope('verified').findAndCount({ take: 1 });
    this.assert(users.length === 1, `Expected 1 user, got ${users.length}`);
    this.assert(total === 2, `Expected total 2, got ${total}`);
  }

  async testFindOneBy() {
    const user = await this.userRepo.scope('admin').findOneBy({ email: 'admin@test.com' });
    this.assert(user !== null, 'Should find admin user');
    this.assert(user.role === 'admin', 'Should be admin');
  }

  async testPostDefaultScope() {
    const posts = await this.postRepo.find();
    this.assert(posts.length === 3, `Expected 3 published posts, got ${posts.length}`);
    this.assert(posts.every((p: Post) => p.status === 'published'), 'All should be published');
  }

  async testPostUnscoped() {
    const posts = await this.postRepo.unscoped().find();
    this.assert(posts.length === 4, `Expected 4 total posts, got ${posts.length}`);
  }

  async testPostDraftScope() {
    const drafts = await this.postRepo.unscoped().scope('draft').find();
    this.assert(drafts.length === 1, `Expected 1 draft, got ${drafts.length}`);
    this.assert(drafts[0].status === 'draft', 'Should be draft');
  }

  async testPostPopularScope() {
    const popular = await this.postRepo.scope('popular').find();
    this.assert(popular.length === 2, `Expected 2 popular posts, got ${popular.length}`);
    this.assert(popular.every((p: Post) => p.views > 100), 'All should have views > 100');
    // Check ordering
    this.assert(popular[0].views >= popular[1].views, 'Should be ordered by views DESC');
  }

  async testPostWithAuthor() {
    const posts = await this.postRepo.scope('withAuthor').find();
    this.assert(posts.length === 3, `Expected 3 posts, got ${posts.length}`);
    this.assert(posts[0].author !== undefined, 'Author should be loaded');
  }

  async testCombinedScopes() {
    const posts = await this.postRepo.scope('popular', 'withAuthor').find();
    this.assert(posts.length === 2, `Expected 2 posts, got ${posts.length}`);
    this.assert(posts.every((p: Post) => p.views > 100), 'Should be popular');
    this.assert(posts[0].author !== undefined, 'Author should be loaded');
  }

  async testScopeWithAdditionalOptions() {
    const users = await this.userRepo.scope('verified').find({ take: 1 });
    this.assert(users.length === 1, `Expected 1 user, got ${users.length}`);
    this.assert(users[0].isVerified, 'Should be verified');
  }

  async testScopeMerging() {
    const users = await this.userRepo
      .scope('verified', { method: ['byRole', 'admin'] })
      .find();
    this.assert(users.length === 1, `Expected 1 user, got ${users.length}`);
    this.assert(users[0].isVerified && users[0].role === 'admin', 'Should merge conditions');
  }

  async testRelationScopes() {
    const members = await this.memberRepo.scope('withScopedRole').find();
    this.assert(members.length === 1, `Expected 1 member with scoped role list, got ${members.length}`);
    this.assert(members[0].role !== undefined, 'Role should be loaded');
    this.assert(members[0].role.name === 'admin', 'Role should match adminOnly scope');
    this.assert(members[0].role.isActive, 'Role default scope should be applied');
    this.assert(members[0].role.tenantId === 1, 'Role function scope from relation scope list should be applied');
  }

  // ============================================================================
  // RUN ALL TESTS
  // ============================================================================

  async runAll() {
    console.log(' TypeORM Scopes Integration Tests\n');
    console.log('=' .repeat(60) + '\n');

    await this.setup();

    console.log(' Running User Tests...\n');
    await this.test('Default scope filters inactive users', () => this.testDefaultScope())();
    await this.test('Unscoped returns all users', () => this.testUnscoped())();
    await this.test('Single scope filters correctly', () => this.testSingleScope())();
    await this.test('Multiple scopes combine correctly', () => this.testMultipleScopes())();
    await this.test('Function scope with parameters', () => this.testFunctionScope())();
    await this.test('Scope with relations loads relations', () => this.testScopeWithRelations())();
    await this.test('Scope with ordering sorts correctly', () => this.testScopeWithOrdering())();
    await this.test('Count with scopes', () => this.testCount())();
    await this.test('FindAndCount with scopes', () => this.testFindAndCount())();
    await this.test('FindOneBy with scopes', () => this.testFindOneBy())();

    console.log('\n Running Post Tests...\n');
    await this.test('Post default scope filters unpublished', () => this.testPostDefaultScope())();
    await this.test('Post unscoped returns all', () => this.testPostUnscoped())();
    await this.test('Post draft scope', () => this.testPostDraftScope())();
    await this.test('Post popular scope with ordering', () => this.testPostPopularScope())();
    await this.test('Post with author relation', () => this.testPostWithAuthor())();
    await this.test('Combined scopes on posts', () => this.testCombinedScopes())();

    console.log('\n Running Advanced Tests...\n');
    await this.test('Scope with additional options', () => this.testScopeWithAdditionalOptions())();
    await this.test('Scope merging', () => this.testScopeMerging())();
    await this.test('Relation scopes apply related entity scopes', () => this.testRelationScopes())();

    await this.teardown();

    console.log('\n' + '='.repeat(60));
    console.log(`\n Test Results:`);
    console.log(`   ✅ Passed: ${this.testsPassed}`);
    console.log(`   ❌ Failed: ${this.testsFailed}`);
    console.log(`    Total: ${this.testsPassed + this.testsFailed}`);
    
    if (this.testsFailed === 0) {
      console.log('\n🎉 All tests passed!\n');
      process.exit(0);
    } else {
      console.log('\n💥 Some tests failed!\n');
      process.exit(1);
    }
  }
}

// Run tests
const test = new IntegrationTest();
test.runAll().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
