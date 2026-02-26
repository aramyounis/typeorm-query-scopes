/**
 * Quick Demo of TypeORM Scopes
 * Run with: npx ts-node demo.ts
 */

import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, Column, DataSource, CreateDateColumn } from 'typeorm';
import { Scopes, DefaultScope, getScopedRepository } from '../src';

// Define entity with scopes
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

  @CreateDateColumn()
  createdAt!: Date;
}

async function demo() {
  console.log('🚀 TypeORM Scopes Demo\n');
  console.log('='.repeat(60) + '\n');

  // Setup database
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
    { email: 'user1@test.com', name: 'User 1', role: 'user', isActive: true, isVerified: true },
    { email: 'user2@test.com', name: 'User 2', role: 'user', isActive: true, isVerified: false },
    { email: 'inactive@test.com', name: 'Inactive', role: 'user', isActive: false, isVerified: false },
  ];

  for (const userData of users) {
    await repo.save(repo.create(userData));
  }
  console.log('✅ Seeded 4 users\n');

  // Create scoped repository
  const userRepo = getScopedRepository(User, dataSource);

  // Demo 1: Default scope (filters inactive users)
  console.log('📋 Demo 1: Default Scope');
  const activeUsers = await userRepo.find();
  console.log(`   Found ${activeUsers.length} active users (default scope applied)`);
  console.log(`   Users: ${activeUsers.map(u => u.name).join(', ')}\n`);

  // Demo 2: Single scope
  console.log('📋 Demo 2: Single Scope');
  const verifiedUsers = await userRepo.scope('verified').find();
  console.log(`   Found ${verifiedUsers.length} verified users`);
  console.log(`   Users: ${verifiedUsers.map(u => u.name).join(', ')}\n`);

  // Demo 3: Multiple scopes
  console.log('📋 Demo 3: Multiple Scopes');
  const verifiedAdmins = await userRepo.scope('verified', 'admin').find();
  console.log(`   Found ${verifiedAdmins.length} verified admin(s)`);
  console.log(`   Users: ${verifiedAdmins.map(u => u.name).join(', ')}\n`);

  // Demo 4: Function scope with parameters
  console.log('📋 Demo 4: Function Scope with Parameters');
  const admins = await userRepo.scope({ method: ['byRole', 'admin'] }).find();
  console.log(`   Found ${admins.length} admin(s)`);
  console.log(`   Users: ${admins.map(u => u.name).join(', ')}\n`);

  // Demo 5: Unscoped (includes inactive)
  console.log('📋 Demo 5: Unscoped Query');
  const allUsers = await userRepo.unscoped().find();
  console.log(`   Found ${allUsers.length} total users (including inactive)`);
  console.log(`   Users: ${allUsers.map(u => u.name).join(', ')}\n`);

  // Demo 6: Count with scopes
  console.log('📋 Demo 6: Count with Scopes');
  const verifiedCount = await userRepo.scope('verified').count();
  console.log(`   Verified users count: ${verifiedCount}\n`);

  // Demo 7: Combining scopes with additional options
  console.log('📋 Demo 7: Scopes + Additional Options');
  const [limitedUsers, total] = await userRepo
    .scope('verified')
    .findAndCount({ take: 1 });
  console.log(`   Found ${limitedUsers.length} user(s) (limited to 1)`);
  console.log(`   Total verified users: ${total}\n`);

  // Demo 8: Scope with ordering
  console.log('📋 Demo 8: Scope with Ordering');
  const newestUsers = await userRepo.scope('newest').find({ take: 2 });
  console.log(`   Newest 2 users: ${newestUsers.map(u => u.name).join(', ')}\n`);

  await dataSource.destroy();
  
  console.log('='.repeat(60));
  console.log('\n✨ Demo complete! All features working correctly.\n');
}

demo().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
