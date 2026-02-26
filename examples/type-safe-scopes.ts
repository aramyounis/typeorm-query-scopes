/**
 * Type-Safe Scopes Example
 * 
 * This example demonstrates how to use type-safe scope names
 * for better IDE autocomplete and compile-time safety
 */

import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, Column, DataSource, CreateDateColumn } from 'typeorm';
import { Scopes, DefaultScope, getScopedRepository } from '../src';

// Define entity with type-safe scopes
// TypeScript will infer the scope names from the object keys
@DefaultScope<User>({
  where: { isActive: true }
})
@Scopes<User, {
  verified: { where: { isVerified: true } };
  admin: { where: { role: 'admin' } };
  moderator: { where: { role: 'moderator' } };
  withPosts: { relations: { posts: true } };
  byRole: (role: string) => { where: { role: string } };
  newest: { order: { createdAt: 'DESC' } };
}>({
  // TypeScript will check these keys match the type above
  verified: {
    where: { isVerified: true }
  },
  
  admin: {
    where: { role: 'admin' }
  },
  
  moderator: {
    where: { role: 'moderator' }
  },
  
  withPosts: {
    relations: { posts: true } as any
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

  posts?: any[];

  @CreateDateColumn()
  createdAt!: Date;
}

async function demo() {
  console.log('🔒 Type-Safe Scopes Demo\n');
  console.log('='.repeat(60) + '\n');

  const dataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities: [User],
    synchronize: true,
    logging: false
  });

  await dataSource.initialize();
  console.log('✅ Database initialized\n');

  // Seed data
  const repo = dataSource.getRepository(User);
  const users = [
    { email: 'admin@test.com', name: 'Admin', role: 'admin', isActive: true, isVerified: true },
    { email: 'mod@test.com', name: 'Moderator', role: 'moderator', isActive: true, isVerified: true },
    { email: 'user@test.com', name: 'User', role: 'user', isActive: true, isVerified: false },
  ];

  for (const userData of users) {
    await repo.save(repo.create(userData));
  }
  console.log('✅ Seeded users\n');

  // Create type-safe scoped repository
  const userRepo = getScopedRepository(User, dataSource);

  console.log('📋 Type-Safe Scope Examples:\n');

  // ✅ VALID: These scope names exist and will autocomplete in your IDE
  console.log('1. Using "verified" scope (type-safe):');
  const verified = await userRepo.scope('verified').find();
  console.log(`   Found ${verified.length} verified users\n`);

  console.log('2. Using "admin" scope (type-safe):');
  const admins = await userRepo.scope('admin').find();
  console.log(`   Found ${admins.length} admin(s)\n`);

  console.log('3. Multiple scopes (type-safe):');
  const verifiedAdmins = await userRepo.scope('verified', 'admin').find();
  console.log(`   Found ${verifiedAdmins.length} verified admin(s)\n`);

  console.log('4. Function scope with parameters (type-safe):');
  const moderators = await userRepo.scope({ method: ['byRole', 'moderator'] }).find();
  console.log(`   Found ${moderators.length} moderator(s)\n`);

  // ❌ INVALID: This will show a TypeScript error if you uncomment it
  // const invalid = await userRepo.scope('nonExistentScope').find();
  // TypeScript error: Argument of type '"nonExistentScope"' is not assignable to parameter

  console.log('='.repeat(60));
  console.log('\n✨ Type-safe scopes provide:');
  console.log('   • IDE autocomplete for scope names');
  console.log('   • Compile-time error checking');
  console.log('   • Better refactoring support');
  console.log('   • Reduced runtime errors');
  console.log('\n💡 How it works:');
  console.log('   The second generic parameter in @Scopes<User, {...}>');
  console.log('   defines the available scope names as a type.');
  console.log('   TypeScript will autocomplete and validate these names');
  console.log('   when you call .scope("scopeName")');
  console.log('\n📝 Try it in your IDE:');
  console.log('   Type: userRepo.scope("');
  console.log('   Your IDE will show: verified, admin, moderator, etc.');
  console.log('   Type a wrong name and get a compile error!\n');

  await dataSource.destroy();
}

demo().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
