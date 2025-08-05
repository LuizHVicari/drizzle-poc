import { drizzle } from 'drizzle-orm/postgres-js';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
const postgres = require('postgres');
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import * as schema from 'src/common/infrastructure/database/schema';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { UserSqlRepository } from './user-sql.repository';
import { User } from 'src/users/domain/entities/user.entity';
import { Group } from 'src/users/domain/entities/groups.entity';
import { GroupSqlRepository } from './group-sql.repository';

describe('UserSqlRepository', () => {
  let container: StartedTestContainer;
  let db: ReturnType<typeof drizzle>;
  let userRepository: UserSqlRepository;
  let groupRepository: GroupSqlRepository;

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

    userRepository = new UserSqlRepository(db);
    groupRepository = new GroupSqlRepository(db);
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

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
      });

      await userRepository.createUser(user);

      const foundUser = await userRepository.findUserById(user.id);
      expect(foundUser).toBeDefined();
      expect(foundUser?.name).toBe('John Doe');
      expect(foundUser?.email).toBe('john@example.com');
    });
  });

  describe('listUsers', () => {
    it('should return empty array when no users exist', async () => {
      const users = await userRepository.listUsers();
      expect(users).toEqual([]);
    });

    it('should return all users', async () => {
      const user1 = new User({ name: 'John', email: 'john@example.com' });
      const user2 = new User({ name: 'Jane', email: 'jane@example.com' });

      await userRepository.createUser(user1);
      await userRepository.createUser(user2);

      const users = await userRepository.listUsers();
      expect(users).toHaveLength(2);
      expect(users.map((u) => u.name)).toContain('John');
      expect(users.map((u) => u.name)).toContain('Jane');
    });
  });

  describe('findUserById', () => {
    it('should return null when user does not exist', async () => {
      const user = await userRepository.findUserById(
        '00000000-0000-0000-0000-000000000000',
      );
      expect(user).toBeNull();
    });

    it('should return user when exists', async () => {
      const user = new User({ name: 'John', email: 'john@example.com' });
      await userRepository.createUser(user);

      const foundUser = await userRepository.findUserById(user.id);
      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(user.id);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const user = new User({ name: 'John', email: 'john@example.com' });
      await userRepository.createUser(user);

      const updatedUser = new User({
        id: user.id,
        name: 'John Updated',
        email: 'john.updated@example.com',
      });

      await userRepository.updateUser(updatedUser);

      const foundUser = await userRepository.findUserById(user.id);
      expect(foundUser?.name).toBe('John Updated');
      expect(foundUser?.email).toBe('john.updated@example.com');
    });
  });

  describe('deleteUserById', () => {
    it('should delete user successfully', async () => {
      const user = new User({ name: 'John', email: 'john@example.com' });
      await userRepository.createUser(user);

      await userRepository.deleteUserById(user.id);

      const foundUser = await userRepository.findUserById(user.id);
      expect(foundUser).toBeNull();
    });
  });

  describe('many-to-many operations', () => {
    let user: User;
    let group: Group;

    beforeEach(async () => {
      user = new User({ name: 'John', email: 'john@example.com' });
      group = new Group({ name: 'Test Group' });

      await userRepository.createUser(user);
      await groupRepository.createGroup(group);
    });

    describe('addUserToGroup', () => {
      it('should add user to group successfully', async () => {
        await userRepository.addUserToGroup(user.id, group.id);

        const userGroups = await userRepository.getUserGroups(user.id);
        expect(userGroups).toContain(group.id);
      });
    });

    describe('removeUserFromGroup', () => {
      it('should remove user from group successfully', async () => {
        await userRepository.addUserToGroup(user.id, group.id);
        await userRepository.removeUserFromGroup(user.id, group.id);

        const userGroups = await userRepository.getUserGroups(user.id);
        expect(userGroups).not.toContain(group.id);
      });
    });

    describe('getUsersByGroupId', () => {
      it('should return users in a group', async () => {
        const user2 = new User({ name: 'Jane', email: 'jane@example.com' });
        await userRepository.createUser(user2);

        await userRepository.addUserToGroup(user.id, group.id);
        await userRepository.addUserToGroup(user2.id, group.id);

        const groupUsers = await userRepository.getUsersByGroupId(group.id);
        expect(groupUsers).toHaveLength(2);
        expect(groupUsers.map((u) => u.id)).toContain(user.id);
        expect(groupUsers.map((u) => u.id)).toContain(user2.id);
      });

      it('should return empty array when no users in group', async () => {
        const groupUsers = await userRepository.getUsersByGroupId(group.id);
        expect(groupUsers).toEqual([]);
      });
    });

    describe('getUserGroups', () => {
      it('should return groups for a user', async () => {
        const group2 = new Group({ name: 'Another Group' });
        await groupRepository.createGroup(group2);

        await userRepository.addUserToGroup(user.id, group.id);
        await userRepository.addUserToGroup(user.id, group2.id);

        const userGroups = await userRepository.getUserGroups(user.id);
        expect(userGroups).toHaveLength(2);
        expect(userGroups).toContain(group.id);
        expect(userGroups).toContain(group2.id);
      });

      it('should return empty array when user has no groups', async () => {
        const userGroups = await userRepository.getUserGroups(user.id);
        expect(userGroups).toEqual([]);
      });
    });
  });
});
