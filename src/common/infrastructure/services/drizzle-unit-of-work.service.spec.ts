import { drizzle } from 'drizzle-orm/postgres-js';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
const postgres = require('postgres');
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import * as schema from 'src/common/infrastructure/database/schema';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { DrizzleUnitOfWorkService } from './drizzle-unit-of-work.service';
import { User } from 'src/users/domain/entities/user.entity';
import { Group } from 'src/users/domain/entities/groups.entity';
import { eq } from 'drizzle-orm';
import { UserSqlRepository } from 'src/users/infrastructure/repositories/user-sql.repository';
import { GroupSqlRepository } from 'src/users/infrastructure/repositories/group-sql.repository';

describe('DrizzleUnitOfWorkService', () => {
  let container: StartedTestContainer;
  let db: ReturnType<typeof drizzle>;
  let unitOfWork: DrizzleUnitOfWorkService;

  beforeAll(async () => {
    container = await new GenericContainer('postgres:15')
      .withEnvironment({
        POSTGRES_DB: 'test_db',
        POSTGRES_USER: 'test_user',
        POSTGRES_PASSWORD: 'test_password',
      })
      .withExposedPorts(5432)
      .withStartupTimeout(60000)
      .start();

    const connectionString = `postgresql://test_user:test_password@${container.getHost()}:${container.getMappedPort(5432)}/test_db`;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const client = postgres(connectionString);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    db = drizzle(client, { schema }) as ReturnType<typeof drizzle>;

    await migrate(db, { migrationsFolder: './drizzle' });

    // Create a custom UnitOfWorkService that uses our test database
    unitOfWork = new (class extends DrizzleUnitOfWorkService {
      async execute<T>(work: (ctx: any) => Promise<T>): Promise<T> {
        return db.transaction(async (tx) => {
          const ctx = {
            userRepository: new UserSqlRepository(tx),
            groupRepository: new GroupSqlRepository(tx),
          };
          return await work(ctx);
        });
      }
    })();
  }, 60000);

  afterAll(async () => {
    if (container) {
      await container.stop();
    }
  });

  beforeEach(async () => {
    await db.delete(schema.userGroupsTable);
    await db.delete(schema.usersTable);
    await db.delete(schema.groupsTable);
  });

  describe('execute', () => {
    it('should execute work within a transaction successfully', async () => {
      const timestamp = Date.now();
      const user = new User({
        name: 'John Doe',
        email: `john-${timestamp}@example.com`,
      });

      const result = await unitOfWork.execute(async (ctx) => {
        await ctx.userRepository.createUser(user);
        return await ctx.userRepository.findUserById(user.id);
      });

      expect(result).toBeDefined();
      expect(result?.name).toBe('John Doe');
      expect(result?.email).toBe(`john-${timestamp}@example.com`);

      // Verify the user was actually persisted
      const persistedUser = await db
        .select()
        .from(schema.usersTable)
        .where(eq(schema.usersTable.id, user.id));
      expect(persistedUser).toHaveLength(1);
    });

    it('should rollback transaction on error', async () => {
      const timestamp = Date.now();
      const user = new User({
        name: 'John Doe',
        email: `john-rollback-${timestamp}@example.com`,
      });

      await expect(
        unitOfWork.execute(async (ctx) => {
          await ctx.userRepository.createUser(user);
          // This should cause the transaction to rollback
          throw new Error('Simulated error');
        }),
      ).rejects.toThrow('Simulated error');

      // Verify the user was NOT persisted due to rollback
      const persistedUsers = await db.select().from(schema.usersTable);
      expect(persistedUsers).toHaveLength(0);
    });

    it('should handle complex multi-repository operations', async () => {
      const timestamp = Date.now();
      const user = new User({
        name: 'John Doe',
        email: `john-complex-${timestamp}@example.com`,
      });

      const group = new Group({
        name: `Test Group ${timestamp}`,
      });

      const result = await unitOfWork.execute(async (ctx) => {
        await ctx.userRepository.createUser(user);
        await ctx.groupRepository.createGroup(group);
        await ctx.userRepository.addUserToGroup(user.id, group.id);

        const userGroups = await ctx.userRepository.getUserGroups(user.id);
        const groupUsers = await ctx.userRepository.getUsersByGroupId(group.id);

        return {
          userGroups,
          groupUsers,
        };
      });

      expect(result.userGroups).toContain(group.id);
      expect(result.groupUsers).toHaveLength(1);
      expect(result.groupUsers[0].id).toBe(user.id);

      // Verify all data was persisted
      const persistedUsers = await db.select().from(schema.usersTable);
      const persistedGroups = await db.select().from(schema.groupsTable);
      const persistedUserGroups = await db.select().from(schema.userGroupsTable);

      expect(persistedUsers).toHaveLength(1);
      expect(persistedGroups).toHaveLength(1);
      expect(persistedUserGroups).toHaveLength(1);
    });

    it('should rollback complex operations on error', async () => {
      const timestamp = Date.now();
      const user = new User({
        name: 'John Doe',
        email: `john-complex-rollback-${timestamp}@example.com`,
      });

      const group = new Group({
        name: `Test Group Rollback ${timestamp}`,
      });

      await expect(
        unitOfWork.execute(async (ctx) => {
          await ctx.userRepository.createUser(user);
          await ctx.groupRepository.createGroup(group);
          await ctx.userRepository.addUserToGroup(user.id, group.id);

          // This should cause the entire transaction to rollback
          throw new Error('Complex operation failed');
        }),
      ).rejects.toThrow('Complex operation failed');

      // Verify nothing was persisted
      const persistedUsers = await db.select().from(schema.usersTable);
      const persistedGroups = await db.select().from(schema.groupsTable);
      const persistedUserGroups = await db.select().from(schema.userGroupsTable);

      expect(persistedUsers).toHaveLength(0);
      expect(persistedGroups).toHaveLength(0);
      expect(persistedUserGroups).toHaveLength(0);
    });

    it('should provide isolated repository instances within transaction', async () => {
      const timestamp = Date.now();
      const user1 = new User({
        name: 'User 1',
        email: `user1-${timestamp}@example.com`,
      });

      const user2 = new User({
        name: 'User 2',
        email: `user2-${timestamp}@example.com`,
      });

      const result = await unitOfWork.execute(async (ctx) => {
        await ctx.userRepository.createUser(user1);
        await ctx.userRepository.createUser(user2);

        return await ctx.userRepository.listUsers();
      });

      expect(result).toHaveLength(2);
      expect(result.map((u) => u.name)).toContain('User 1');
      expect(result.map((u) => u.name)).toContain('User 2');
    });

    it('should handle repository operations with proper context', async () => {
      const timestamp = Date.now();
      const users = [
        new User({ name: 'User 1', email: `user1-nested-${timestamp}@example.com` }),
        new User({ name: 'User 2', email: `user2-nested-${timestamp}@example.com` }),
        new User({ name: 'User 3', email: `user3-nested-${timestamp}@example.com` }),
      ];

      const group = new Group({ name: `Test Group Nested ${timestamp}` });

      const result = await unitOfWork.execute(async (ctx) => {
        // Create group first
        await ctx.groupRepository.createGroup(group);

        // Create users and add them to group
        for (const user of users) {
          await ctx.userRepository.createUser(user);
          await ctx.userRepository.addUserToGroup(user.id, group.id);
        }

        // Query relationships
        const groupUsers = await ctx.userRepository.getUsersByGroupId(group.id);
        const userGroups = await ctx.userRepository.getUserGroups(users[0].id);

        return {
          totalUsers: groupUsers.length,
          firstUserGroups: userGroups.length,
        };
      });

      expect(result.totalUsers).toBe(3);
      expect(result.firstUserGroups).toBe(1);

      // Verify persistence
      const persistedUsers = await db.select().from(schema.usersTable);
      const persistedGroups = await db.select().from(schema.groupsTable);
      const persistedUserGroups = await db.select().from(schema.userGroupsTable);

      expect(persistedUsers).toHaveLength(3);
      expect(persistedGroups).toHaveLength(1);
      expect(persistedUserGroups).toHaveLength(3);
    });
  });
});