import { drizzle } from 'drizzle-orm/postgres-js';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
const postgres = require('postgres');
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import * as schema from 'src/common/infrastructure/database/schema';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { GroupSqlRepository } from './group-sql.repository';
import { UserSqlRepository } from './user-sql.repository';
import { Group } from 'src/users/domain/entities/groups.entity';
import { User } from 'src/users/domain/entities/user.entity';

describe('GroupSqlRepository', () => {
  let container: StartedTestContainer;
  let db: ReturnType<typeof drizzle>;
  let groupRepository: GroupSqlRepository;
  let userRepository: UserSqlRepository;

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

    groupRepository = new GroupSqlRepository(db);
    userRepository = new UserSqlRepository(db);
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

  describe('createGroup', () => {
    it('should create a group successfully', async () => {
      const group = new Group({
        name: 'Test Group',
      });

      await groupRepository.createGroup(group);

      const foundGroup = await groupRepository.findGroupById(group.id);
      expect(foundGroup).toBeDefined();
      expect(foundGroup?.name).toBe('Test Group');
    });
  });

  describe('listGroups', () => {
    it('should return empty array when no groups exist', async () => {
      const groups = await groupRepository.listGroups();
      expect(groups).toEqual([]);
    });

    it('should return all groups', async () => {
      const group1 = new Group({ name: 'Group 1' });
      const group2 = new Group({ name: 'Group 2' });

      await groupRepository.createGroup(group1);
      await groupRepository.createGroup(group2);

      const groups = await groupRepository.listGroups();
      expect(groups).toHaveLength(2);
      expect(groups.map((g) => g.name)).toContain('Group 1');
      expect(groups.map((g) => g.name)).toContain('Group 2');
    });
  });

  describe('findGroupById', () => {
    it('should return null when group does not exist', async () => {
      const group = await groupRepository.findGroupById(
        '00000000-0000-0000-0000-000000000000',
      );
      expect(group).toBeNull();
    });

    it('should return group when exists', async () => {
      const group = new Group({ name: 'Test Group' });
      await groupRepository.createGroup(group);

      const foundGroup = await groupRepository.findGroupById(group.id);
      expect(foundGroup).toBeDefined();
      expect(foundGroup?.id).toBe(group.id);
    });
  });

  describe('updateGroup', () => {
    it('should update group successfully', async () => {
      const group = new Group({ name: 'Original Name' });
      await groupRepository.createGroup(group);

      const updatedGroup = new Group({
        id: group.id,
        name: 'Updated Name',
      });

      await groupRepository.updateGroup(updatedGroup);

      const foundGroup = await groupRepository.findGroupById(group.id);
      expect(foundGroup?.name).toBe('Updated Name');
    });
  });

  describe('deleteGroupById', () => {
    it('should delete group successfully', async () => {
      const group = new Group({ name: 'Test Group' });
      await groupRepository.createGroup(group);

      await groupRepository.deleteGroupById(group.id);

      const foundGroup = await groupRepository.findGroupById(group.id);
      expect(foundGroup).toBeNull();
    });

    it('should cascade delete user-group relationships', async () => {
      const group = new Group({ name: 'Test Group' });
      const user = new User({ name: 'John', email: 'john@example.com' });

      await groupRepository.createGroup(group);
      await userRepository.createUser(user);
      await userRepository.addUserToGroup(user.id, group.id);

      await groupRepository.deleteGroupById(group.id);

      const userGroups = await userRepository.getUserGroups(user.id);
      expect(userGroups).toEqual([]);
    });
  });

  describe('getGroupsByUserId', () => {
    it('should return groups for a user', async () => {
      const user = new User({ name: 'John', email: 'john@example.com' });
      const group1 = new Group({ name: 'Group 1' });
      const group2 = new Group({ name: 'Group 2' });

      await userRepository.createUser(user);
      await groupRepository.createGroup(group1);
      await groupRepository.createGroup(group2);

      await userRepository.addUserToGroup(user.id, group1.id);
      await userRepository.addUserToGroup(user.id, group2.id);

      const userGroups = await groupRepository.getGroupsByUserId(user.id);
      expect(userGroups).toHaveLength(2);
      expect(userGroups.map((g) => g.id)).toContain(group1.id);
      expect(userGroups.map((g) => g.id)).toContain(group2.id);
    });

    it('should return empty array when user has no groups', async () => {
      const user = new User({ name: 'John', email: 'john@example.com' });
      await userRepository.createUser(user);

      const userGroups = await groupRepository.getGroupsByUserId(user.id);
      expect(userGroups).toEqual([]);
    });

    it('should not return groups from other users', async () => {
      const user1 = new User({ name: 'John', email: 'john@example.com' });
      const user2 = new User({ name: 'Jane', email: 'jane@example.com' });
      const group = new Group({ name: 'Test Group' });

      await userRepository.createUser(user1);
      await userRepository.createUser(user2);
      await groupRepository.createGroup(group);

      await userRepository.addUserToGroup(user2.id, group.id);

      const user1Groups = await groupRepository.getGroupsByUserId(user1.id);
      expect(user1Groups).toEqual([]);
    });
  });

  describe('constraint violations', () => {
    it('should handle unique constraint on group name', async () => {
      const group1 = new Group({ name: 'Duplicate Name' });
      const group2 = new Group({ name: 'Duplicate Name' });

      await groupRepository.createGroup(group1);

      await expect(groupRepository.createGroup(group2)).rejects.toThrow();
    });
  });
});
