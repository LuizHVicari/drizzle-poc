import { UserAggregateService } from './user-aggregate.service';
import { UnitOfWorkService } from 'src/common/domain/services/unit-of-work.service';
import { RepositoryContext } from 'src/common/domain/services/repository-context.service';
import { UserRepository } from '../repositories/user.repository';
import { GroupRepository } from '../repositories/group.repository';
import { User } from '../entities/user.entity';
import { Group } from '../entities/groups.entity';

jest.mock('uuid', () => ({
  v7: jest.fn(() => 'mocked-uuid-v7'),
}));

describe('UserAggregateService', () => {
  let service: UserAggregateService;
  let mockUnitOfWork: jest.Mocked<UnitOfWorkService>;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockGroupRepository: jest.Mocked<GroupRepository>;
  let mockContext: RepositoryContext;

  beforeEach(() => {
    mockUserRepository = {
      createUser: jest.fn(),
      listUsers: jest.fn(),
      findUserById: jest.fn(),
      updateUser: jest.fn(),
      deleteUserById: jest.fn(),
      addUserToGroup: jest.fn(),
      removeUserFromGroup: jest.fn(),
      getUsersByGroupId: jest.fn(),
      getUserGroups: jest.fn(),
    } as any;

    mockGroupRepository = {
      createGroup: jest.fn(),
      listGroups: jest.fn(),
      findGroupById: jest.fn(),
      updateGroup: jest.fn(),
      deleteGroupById: jest.fn(),
      getGroupsByUserId: jest.fn(),
    } as any;

    mockContext = {
      userRepository: mockUserRepository,
      groupRepository: mockGroupRepository,
    };

    mockUnitOfWork = {
      execute: jest.fn().mockImplementation(async (work) => {
        return await work(mockContext);
      }),
    } as any;

    service = new UserAggregateService(mockUnitOfWork);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserWithGroup', () => {
    it('should create a user and add to existing group', async () => {
      const groupId = 'existing-group-id';
      const mockGroup = new Group({ id: groupId, name: 'Test Group' });
      const userData = {
        user: { name: 'John Doe', email: 'john@example.com' },
        groupId,
      };

      mockGroupRepository.findGroupById.mockResolvedValue(mockGroup);

      const result = await service.createUserWithGroup(userData);

      expect(mockUnitOfWork.execute).toHaveBeenCalledTimes(1);
      expect(mockGroupRepository.findGroupById).toHaveBeenCalledWith(groupId);
      expect(mockUserRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          id: 'mocked-uuid-v7',
        }),
      );
      expect(mockUserRepository.addUserToGroup).toHaveBeenCalledWith(
        'mocked-uuid-v7',
        groupId,
      );
      expect(result).toBeInstanceOf(User);
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
    });

    it('should throw error when group does not exist', async () => {
      const groupId = 'non-existent-group';
      const userData = {
        user: { name: 'John Doe', email: 'john@example.com' },
        groupId,
      };

      mockGroupRepository.findGroupById.mockResolvedValue(null);

      await expect(service.createUserWithGroup(userData)).rejects.toThrow(
        `Group with id ${groupId} not found`,
      );

      expect(mockGroupRepository.findGroupById).toHaveBeenCalledWith(groupId);
      expect(mockUserRepository.createUser).not.toHaveBeenCalled();
      expect(mockUserRepository.addUserToGroup).not.toHaveBeenCalled();
    });
  });

  describe('createGroupWithUsers', () => {
    it('should create a group with multiple users', async () => {
      const data = {
        group: { name: 'Test Group' },
        users: [
          { name: 'User 1', email: 'user1@example.com' },
          { name: 'User 2', email: 'user2@example.com' },
        ],
      };

      // Mock UUID to return different values for different calls
      const uuidMock = require('uuid').v7 as jest.Mock;
      uuidMock
        .mockReturnValueOnce('group-uuid')
        .mockReturnValueOnce('user1-uuid')
        .mockReturnValueOnce('user2-uuid');

      const result = await service.createGroupWithUsers(data);

      expect(mockUnitOfWork.execute).toHaveBeenCalledTimes(1);
      expect(mockGroupRepository.createGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Group',
          id: 'group-uuid',
        }),
      );
      expect(mockUserRepository.createUser).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.addUserToGroup).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.addUserToGroup).toHaveBeenNthCalledWith(
        1,
        'user1-uuid',
        'group-uuid',
      );
      expect(mockUserRepository.addUserToGroup).toHaveBeenNthCalledWith(
        2,
        'user2-uuid',
        'group-uuid',
      );

      expect(result.group).toBeInstanceOf(Group);
      expect(result.users).toHaveLength(2);
      expect(result.users[0]).toBeInstanceOf(User);
      expect(result.users[1]).toBeInstanceOf(User);
    });

    it('should create a group with no users', async () => {
      const data = {
        group: { name: 'Empty Group' },
        users: [],
      };

      const result = await service.createGroupWithUsers(data);

      expect(mockGroupRepository.createGroup).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.createUser).not.toHaveBeenCalled();
      expect(mockUserRepository.addUserToGroup).not.toHaveBeenCalled();
      expect(result.group.name).toBe('Empty Group');
      expect(result.users).toHaveLength(0);
    });
  });

  describe('addUsersToGroup', () => {
    it('should add multiple users to existing group', async () => {
      const groupId = 'existing-group-id';
      const mockGroup = new Group({ id: groupId, name: 'Test Group' });
      const data = {
        groupId,
        users: [
          { name: 'User 1', email: 'user1@example.com' },
          { name: 'User 2', email: 'user2@example.com' },
        ],
      };

      mockGroupRepository.findGroupById.mockResolvedValue(mockGroup);

      const uuidMock = require('uuid').v7 as jest.Mock;
      uuidMock
        .mockReturnValueOnce('user1-uuid')
        .mockReturnValueOnce('user2-uuid');

      const result = await service.addUsersToGroup(data);

      expect(mockGroupRepository.findGroupById).toHaveBeenCalledWith(groupId);
      expect(mockUserRepository.createUser).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.addUserToGroup).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(User);
      expect(result[1]).toBeInstanceOf(User);
    });

    it('should throw error when group does not exist', async () => {
      const groupId = 'non-existent-group';
      const data = {
        groupId,
        users: [{ name: 'User 1', email: 'user1@example.com' }],
      };

      mockGroupRepository.findGroupById.mockResolvedValue(null);

      await expect(service.addUsersToGroup(data)).rejects.toThrow(
        `Group with id ${groupId} not found`,
      );

      expect(mockUserRepository.createUser).not.toHaveBeenCalled();
    });
  });

  describe('deleteGroupWithUsers', () => {
    it('should delete group and all users', async () => {
      const groupId = 'group-to-delete';
      const mockGroup = new Group({ id: groupId, name: 'Test Group' });
      const mockUsers = [
        new User({ id: 'user1', name: 'User 1', email: 'user1@example.com' }),
        new User({ id: 'user2', name: 'User 2', email: 'user2@example.com' }),
      ];

      mockGroupRepository.findGroupById.mockResolvedValue(mockGroup);
      mockUserRepository.listUsers.mockResolvedValue(mockUsers);

      await service.deleteGroupWithUsers(groupId);

      expect(mockGroupRepository.findGroupById).toHaveBeenCalledWith(groupId);
      expect(mockUserRepository.listUsers).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.deleteUserById).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.deleteUserById).toHaveBeenNthCalledWith(
        1,
        'user1',
      );
      expect(mockUserRepository.deleteUserById).toHaveBeenNthCalledWith(
        2,
        'user2',
      );
      expect(mockGroupRepository.deleteGroupById).toHaveBeenCalledWith(groupId);
    });

    it('should throw error when group does not exist', async () => {
      const groupId = 'non-existent-group';

      mockGroupRepository.findGroupById.mockResolvedValue(null);

      await expect(service.deleteGroupWithUsers(groupId)).rejects.toThrow(
        `Group with id ${groupId} not found`,
      );

      expect(mockUserRepository.listUsers).not.toHaveBeenCalled();
      expect(mockGroupRepository.deleteGroupById).not.toHaveBeenCalled();
    });
  });

  describe('getGroupWithUsers', () => {
    it('should return group with its users', async () => {
      const groupId = 'test-group-id';
      const mockGroup = new Group({ id: groupId, name: 'Test Group' });
      const mockUsers = [
        new User({ id: 'user1', name: 'User 1', email: 'user1@example.com' }),
        new User({ id: 'user2', name: 'User 2', email: 'user2@example.com' }),
      ];

      mockGroupRepository.findGroupById.mockResolvedValue(mockGroup);
      mockUserRepository.getUsersByGroupId.mockResolvedValue(mockUsers);

      const result = await service.getGroupWithUsers(groupId);

      expect(mockGroupRepository.findGroupById).toHaveBeenCalledWith(groupId);
      expect(mockUserRepository.getUsersByGroupId).toHaveBeenCalledWith(
        groupId,
      );
      expect(result.group).toEqual(mockGroup);
      expect(result.users).toEqual(mockUsers);
    });

    it('should throw error when group does not exist', async () => {
      const groupId = 'non-existent-group';

      mockGroupRepository.findGroupById.mockResolvedValue(null);

      await expect(service.getGroupWithUsers(groupId)).rejects.toThrow(
        `Group with id ${groupId} not found`,
      );

      expect(mockUserRepository.getUsersByGroupId).not.toHaveBeenCalled();
    });
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      const userData = { name: 'John Doe', email: 'john@example.com' };

      const result = await service.createUser(userData);

      expect(mockUserRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          id: 'mocked-uuid-v7',
        }),
      );
      expect(result).toBeInstanceOf(User);
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
    });
  });

  describe('updateUser', () => {
    it('should update existing user', async () => {
      const userId = 'existing-user-id';
      const mockUser = new User({
        id: userId,
        name: 'Old Name',
        email: 'old@example.com',
      });
      const updateData = { name: 'New Name', email: 'new@example.com' };

      mockUserRepository.findUserById.mockResolvedValue(mockUser);

      const result = await service.updateUser(userId, updateData);

      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: userId,
          name: 'New Name',
          email: 'new@example.com',
        }),
      );
      expect(result.name).toBe('New Name');
      expect(result.email).toBe('new@example.com');
    });

    it('should update user with partial data', async () => {
      const userId = 'existing-user-id';
      const mockUser = new User({
        id: userId,
        name: 'Old Name',
        email: 'old@example.com',
      });
      const updateData = { name: 'New Name' };

      mockUserRepository.findUserById.mockResolvedValue(mockUser);

      const result = await service.updateUser(userId, updateData);

      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: userId,
          name: 'New Name',
          email: 'old@example.com', // Should keep old email
        }),
      );
      expect(result.name).toBe('New Name');
      expect(result.email).toBe('old@example.com');
    });

    it('should throw error when user does not exist', async () => {
      const userId = 'non-existent-user';
      const updateData = { name: 'New Name' };

      mockUserRepository.findUserById.mockResolvedValue(null);

      await expect(service.updateUser(userId, updateData)).rejects.toThrow(
        `User with id ${userId} not found`,
      );

      expect(mockUserRepository.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should delete existing user', async () => {
      const userId = 'existing-user-id';
      const mockUser = new User({
        id: userId,
        name: 'User to Delete',
        email: 'delete@example.com',
      });

      mockUserRepository.findUserById.mockResolvedValue(mockUser);

      await service.deleteUser(userId);

      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.deleteUserById).toHaveBeenCalledWith(userId);
    });

    it('should throw error when user does not exist', async () => {
      const userId = 'non-existent-user';

      mockUserRepository.findUserById.mockResolvedValue(null);

      await expect(service.deleteUser(userId)).rejects.toThrow(
        `User with id ${userId} not found`,
      );

      expect(mockUserRepository.deleteUserById).not.toHaveBeenCalled();
    });
  });

  describe('createGroup', () => {
    it('should create a group', async () => {
      const groupData = { name: 'Test Group' };

      const result = await service.createGroup(groupData);

      expect(mockGroupRepository.createGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Group',
          id: 'mocked-uuid-v7',
        }),
      );
      expect(result).toBeInstanceOf(Group);
      expect(result.name).toBe('Test Group');
    });
  });

  describe('updateGroup', () => {
    it('should update existing group', async () => {
      const groupId = 'existing-group-id';
      const mockGroup = new Group({ id: groupId, name: 'Old Name' });
      const updateData = { name: 'New Name' };

      mockGroupRepository.findGroupById.mockResolvedValue(mockGroup);

      const result = await service.updateGroup(groupId, updateData);

      expect(mockGroupRepository.findGroupById).toHaveBeenCalledWith(groupId);
      expect(mockGroupRepository.updateGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          id: groupId,
          name: 'New Name',
        }),
      );
      expect(result.name).toBe('New Name');
    });

    it('should keep original name when no name provided', async () => {
      const groupId = 'existing-group-id';
      const mockGroup = new Group({ id: groupId, name: 'Original Name' });
      const updateData = {};

      mockGroupRepository.findGroupById.mockResolvedValue(mockGroup);

      const result = await service.updateGroup(groupId, updateData);

      expect(mockGroupRepository.updateGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          id: groupId,
          name: 'Original Name',
        }),
      );
      expect(result.name).toBe('Original Name');
    });

    it('should throw error when group does not exist', async () => {
      const groupId = 'non-existent-group';
      const updateData = { name: 'New Name' };

      mockGroupRepository.findGroupById.mockResolvedValue(null);

      await expect(service.updateGroup(groupId, updateData)).rejects.toThrow(
        `Group with id ${groupId} not found`,
      );

      expect(mockGroupRepository.updateGroup).not.toHaveBeenCalled();
    });
  });

  describe('deleteGroup', () => {
    it('should delete existing group', async () => {
      const groupId = 'existing-group-id';
      const mockGroup = new Group({ id: groupId, name: 'Group to Delete' });

      mockGroupRepository.findGroupById.mockResolvedValue(mockGroup);

      await service.deleteGroup(groupId);

      expect(mockGroupRepository.findGroupById).toHaveBeenCalledWith(groupId);
      expect(mockGroupRepository.deleteGroupById).toHaveBeenCalledWith(groupId);
    });

    it('should throw error when group does not exist', async () => {
      const groupId = 'non-existent-group';

      mockGroupRepository.findGroupById.mockResolvedValue(null);

      await expect(service.deleteGroup(groupId)).rejects.toThrow(
        `Group with id ${groupId} not found`,
      );

      expect(mockGroupRepository.deleteGroupById).not.toHaveBeenCalled();
    });
  });
});