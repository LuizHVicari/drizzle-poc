import { Test, TestingModule } from '@nestjs/testing';
import { GroupsController } from './groups.controller';
import { UserAggregateService } from 'src/users/domain/services/user-aggregate.service';
import { GroupQueryService } from 'src/users/domain/services/group-query.service';
import { Group } from 'src/users/domain/entities/groups.entity';
import { User } from 'src/users/domain/entities/user.entity';

describe('GroupsController', () => {
  let controller: GroupsController;
  let mockUserAggregateService: jest.Mocked<UserAggregateService>;
  let mockGroupQueryService: jest.Mocked<GroupQueryService>;

  beforeEach(async () => {
    mockUserAggregateService = {
      createGroup: jest.fn(),
      updateGroup: jest.fn(),
      deleteGroup: jest.fn(),
      createGroupWithUsers: jest.fn(),
      getGroupWithUsers: jest.fn(),
      deleteGroupWithUsers: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      createUserWithGroup: jest.fn(),
      addUsersToGroup: jest.fn(),
    } as any;

    mockGroupQueryService = {
      findGroupById: jest.fn(),
      listGroups: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [
        {
          provide: UserAggregateService,
          useValue: mockUserAggregateService,
        },
        {
          provide: GroupQueryService,
          useValue: mockGroupQueryService,
        },
      ],
    }).compile();

    controller = module.get<GroupsController>(GroupsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createGroup', () => {
    it('should create a group successfully', async () => {
      const createGroupDto = {
        name: 'Test Group',
      };

      const mockGroup = new Group({
        id: 'group-id',
        name: 'Test Group',
      });

      mockUserAggregateService.createGroup.mockResolvedValue(mockGroup);

      const result = await controller.createGroup(createGroupDto);

      expect(mockUserAggregateService.createGroup).toHaveBeenCalledWith({
        name: 'Test Group',
      });
      expect(mockUserAggregateService.createGroup).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockGroup);
      expect(result).toBeInstanceOf(Group);
    });

    it('should handle service errors', async () => {
      const createGroupDto = {
        name: 'Duplicate Group',
      };

      const error = new Error('Group name already exists');
      mockUserAggregateService.createGroup.mockRejectedValue(error);

      await expect(controller.createGroup(createGroupDto)).rejects.toThrow(
        'Group name already exists',
      );

      expect(mockUserAggregateService.createGroup).toHaveBeenCalledWith({
        name: 'Duplicate Group',
      });
    });

    it('should pass DTO properties correctly', async () => {
      const createGroupDto = {
        name: 'Development Team',
      };

      const mockGroup = new Group({
        id: 'dev-team-id',
        name: 'Development Team',
      });

      mockUserAggregateService.createGroup.mockResolvedValue(mockGroup);

      await controller.createGroup(createGroupDto);

      expect(mockUserAggregateService.createGroup).toHaveBeenCalledWith({
        name: 'Development Team',
      });
    });
  });

  describe('listGroups', () => {
    it('should return array of groups', async () => {
      const mockGroups = [
        new Group({ id: '1', name: 'Group 1' }),
        new Group({ id: '2', name: 'Group 2' }),
      ];

      mockGroupQueryService.listGroups.mockResolvedValue(mockGroups);

      const result = await controller.listGroups();

      expect(mockGroupQueryService.listGroups).toHaveBeenCalledTimes(1);
      expect(mockGroupQueryService.listGroups).toHaveBeenCalledWith();
      expect(result).toEqual(mockGroups);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no groups exist', async () => {
      mockGroupQueryService.listGroups.mockResolvedValue([]);

      const result = await controller.listGroups();

      expect(mockGroupQueryService.listGroups).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle service errors', async () => {
      const error = new Error('Database connection failed');
      mockGroupQueryService.listGroups.mockRejectedValue(error);

      await expect(controller.listGroups()).rejects.toThrow(
        'Database connection failed',
      );

      expect(mockGroupQueryService.listGroups).toHaveBeenCalledTimes(1);
    });
  });

  describe('findGroup', () => {
    it('should return group when found', async () => {
      const groupId = 'existing-group-id';
      const mockGroup = new Group({
        id: groupId,
        name: 'Test Group',
      });

      mockGroupQueryService.findGroupById.mockResolvedValue(mockGroup);

      const result = await controller.findGroup(groupId);

      expect(mockGroupQueryService.findGroupById).toHaveBeenCalledWith(groupId);
      expect(mockGroupQueryService.findGroupById).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockGroup);
    });

    it('should return null when group not found', async () => {
      const groupId = 'non-existent-group';

      mockGroupQueryService.findGroupById.mockResolvedValue(null);

      const result = await controller.findGroup(groupId);

      expect(mockGroupQueryService.findGroupById).toHaveBeenCalledWith(groupId);
      expect(result).toBeNull();
    });

    it('should handle service errors', async () => {
      const groupId = 'error-group-id';
      const error = new Error('Database error');

      mockGroupQueryService.findGroupById.mockRejectedValue(error);

      await expect(controller.findGroup(groupId)).rejects.toThrow(
        'Database error',
      );

      expect(mockGroupQueryService.findGroupById).toHaveBeenCalledWith(groupId);
    });
  });

  describe('updateGroup', () => {
    it('should update group successfully', async () => {
      const groupId = 'group-to-update';
      const updateGroupDto = {
        name: 'Updated Group Name',
      };

      const mockUpdatedGroup = new Group({
        id: groupId,
        name: 'Updated Group Name',
      });

      mockUserAggregateService.updateGroup.mockResolvedValue(mockUpdatedGroup);

      const result = await controller.updateGroup(groupId, updateGroupDto);

      expect(mockUserAggregateService.updateGroup).toHaveBeenCalledWith(
        groupId,
        {
          name: 'Updated Group Name',
        },
      );
      expect(mockUserAggregateService.updateGroup).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUpdatedGroup);
    });

    it('should handle undefined name in DTO', async () => {
      const groupId = 'group-to-update';
      const updateGroupDto = {}; // No name provided

      const mockGroup = new Group({
        id: groupId,
        name: 'Original Name',
      });

      mockUserAggregateService.updateGroup.mockResolvedValue(mockGroup);

      const result = await controller.updateGroup(groupId, updateGroupDto);

      expect(mockUserAggregateService.updateGroup).toHaveBeenCalledWith(
        groupId,
        {
          name: undefined,
        },
      );
      expect(result).toEqual(mockGroup);
    });

    it('should handle service errors', async () => {
      const groupId = 'non-existent-group';
      const updateGroupDto = { name: 'New Name' };
      const error = new Error('Group not found');

      mockUserAggregateService.updateGroup.mockRejectedValue(error);

      await expect(
        controller.updateGroup(groupId, updateGroupDto),
      ).rejects.toThrow('Group not found');

      expect(mockUserAggregateService.updateGroup).toHaveBeenCalledWith(
        groupId,
        {
          name: 'New Name',
        },
      );
    });
  });

  describe('deleteGroup', () => {
    it('should delete group successfully', async () => {
      const groupId = 'group-to-delete';

      mockUserAggregateService.deleteGroup.mockResolvedValue(undefined);

      const result = await controller.deleteGroup(groupId);

      expect(mockUserAggregateService.deleteGroup).toHaveBeenCalledWith(
        groupId,
      );
      expect(mockUserAggregateService.deleteGroup).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });

    it('should handle service errors', async () => {
      const groupId = 'non-existent-group';
      const error = new Error('Group not found');

      mockUserAggregateService.deleteGroup.mockRejectedValue(error);

      await expect(controller.deleteGroup(groupId)).rejects.toThrow(
        'Group not found',
      );

      expect(mockUserAggregateService.deleteGroup).toHaveBeenCalledWith(
        groupId,
      );
    });
  });

  describe('createGroupWithUsers', () => {
    it('should create group with users successfully', async () => {
      const createGroupWithUsersDto = {
        group: {
          name: 'Development Team',
        },
        users: [
          { name: 'Developer 1', email: 'dev1@example.com' },
          { name: 'Developer 2', email: 'dev2@example.com' },
        ],
      };

      const mockGroup = new Group({
        id: 'dev-team-id',
        name: 'Development Team',
      });

      const mockUsers = [
        new User({ id: '1', name: 'Developer 1', email: 'dev1@example.com' }),
        new User({ id: '2', name: 'Developer 2', email: 'dev2@example.com' }),
      ];

      const mockResult = { group: mockGroup, users: mockUsers };
      mockUserAggregateService.createGroupWithUsers.mockResolvedValue(
        mockResult,
      );

      const result = await controller.createGroupWithUsers(
        createGroupWithUsersDto,
      );

      expect(
        mockUserAggregateService.createGroupWithUsers,
      ).toHaveBeenCalledWith(createGroupWithUsersDto);
      expect(
        mockUserAggregateService.createGroupWithUsers,
      ).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
      expect(result.group).toBeInstanceOf(Group);
      expect(result.users).toHaveLength(2);
      expect(result.users[0]).toBeInstanceOf(User);
    });

    it('should create group with empty users array', async () => {
      const createGroupWithUsersDto = {
        group: {
          name: 'Empty Group',
        },
        users: [],
      };

      const mockGroup = new Group({
        id: 'empty-group-id',
        name: 'Empty Group',
      });

      const mockResult = { group: mockGroup, users: [] };
      mockUserAggregateService.createGroupWithUsers.mockResolvedValue(
        mockResult,
      );

      const result = await controller.createGroupWithUsers(
        createGroupWithUsersDto,
      );

      expect(
        mockUserAggregateService.createGroupWithUsers,
      ).toHaveBeenCalledWith(createGroupWithUsersDto);
      expect(result.group).toEqual(mockGroup);
      expect(result.users).toHaveLength(0);
    });

    it('should handle service errors', async () => {
      const createGroupWithUsersDto = {
        group: {
          name: 'Invalid Group',
        },
        users: [{ name: 'User 1', email: 'invalid-email' }],
      };

      const error = new Error('Invalid email format');
      mockUserAggregateService.createGroupWithUsers.mockRejectedValue(error);

      await expect(
        controller.createGroupWithUsers(createGroupWithUsersDto),
      ).rejects.toThrow('Invalid email format');

      expect(
        mockUserAggregateService.createGroupWithUsers,
      ).toHaveBeenCalledWith(createGroupWithUsersDto);
    });
  });

  describe('getGroupWithUsers', () => {
    it('should return group with its users', async () => {
      const groupId = 'test-group-id';
      const mockGroup = new Group({
        id: groupId,
        name: 'Test Group',
      });

      const mockUsers = [
        new User({ id: '1', name: 'User 1', email: 'user1@example.com' }),
        new User({ id: '2', name: 'User 2', email: 'user2@example.com' }),
      ];

      const mockResult = { group: mockGroup, users: mockUsers };
      mockUserAggregateService.getGroupWithUsers.mockResolvedValue(mockResult);

      const result = await controller.getGroupWithUsers(groupId);

      expect(mockUserAggregateService.getGroupWithUsers).toHaveBeenCalledWith(
        groupId,
      );
      expect(mockUserAggregateService.getGroupWithUsers).toHaveBeenCalledTimes(
        1,
      );
      expect(result).toEqual(mockResult);
      expect(result.group).toEqual(mockGroup);
      expect(result.users).toEqual(mockUsers);
    });

    it('should return group with empty users array', async () => {
      const groupId = 'empty-group-id';
      const mockGroup = new Group({
        id: groupId,
        name: 'Empty Group',
      });

      const mockResult = { group: mockGroup, users: [] };
      mockUserAggregateService.getGroupWithUsers.mockResolvedValue(mockResult);

      const result = await controller.getGroupWithUsers(groupId);

      expect(mockUserAggregateService.getGroupWithUsers).toHaveBeenCalledWith(
        groupId,
      );
      expect(result.group).toEqual(mockGroup);
      expect(result.users).toHaveLength(0);
    });

    it('should handle service errors', async () => {
      const groupId = 'non-existent-group';
      const error = new Error('Group not found');

      mockUserAggregateService.getGroupWithUsers.mockRejectedValue(error);

      await expect(controller.getGroupWithUsers(groupId)).rejects.toThrow(
        'Group not found',
      );

      expect(mockUserAggregateService.getGroupWithUsers).toHaveBeenCalledWith(
        groupId,
      );
    });
  });

  describe('deleteGroupWithUsers', () => {
    it('should delete group with users successfully', async () => {
      const groupId = 'group-to-delete';

      mockUserAggregateService.deleteGroupWithUsers.mockResolvedValue(
        undefined,
      );

      const result = await controller.deleteGroupWithUsers(groupId);

      expect(
        mockUserAggregateService.deleteGroupWithUsers,
      ).toHaveBeenCalledWith(groupId);
      expect(
        mockUserAggregateService.deleteGroupWithUsers,
      ).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });

    it('should handle service errors', async () => {
      const groupId = 'non-existent-group';
      const error = new Error('Group not found');

      mockUserAggregateService.deleteGroupWithUsers.mockRejectedValue(error);

      await expect(controller.deleteGroupWithUsers(groupId)).rejects.toThrow(
        'Group not found',
      );

      expect(
        mockUserAggregateService.deleteGroupWithUsers,
      ).toHaveBeenCalledWith(groupId);
    });
  });

  describe('integration behavior', () => {
    it('should delegate read operations to query service', async () => {
      const groupId = 'test-group-id';
      const mockGroup = new Group({
        id: groupId,
        name: 'Test Group',
      });

      mockGroupQueryService.findGroupById.mockResolvedValue(mockGroup);
      mockGroupQueryService.listGroups.mockResolvedValue([mockGroup]);

      await controller.findGroup(groupId);
      await controller.listGroups();

      expect(mockGroupQueryService.findGroupById).toHaveBeenCalledWith(groupId);
      expect(mockGroupQueryService.listGroups).toHaveBeenCalled();

      // Verify aggregate service was not called for simple read operations
      expect(mockUserAggregateService.createGroup).not.toHaveBeenCalled();
      expect(mockUserAggregateService.updateGroup).not.toHaveBeenCalled();
      expect(mockUserAggregateService.deleteGroup).not.toHaveBeenCalled();
    });

    it('should delegate write operations to aggregate service', async () => {
      const groupId = 'test-group-id';
      const mockGroup = new Group({
        id: groupId,
        name: 'Test Group',
      });

      mockUserAggregateService.createGroup.mockResolvedValue(mockGroup);
      mockUserAggregateService.updateGroup.mockResolvedValue(mockGroup);
      mockUserAggregateService.deleteGroup.mockResolvedValue(undefined);

      await controller.createGroup({ name: 'Test' });
      await controller.updateGroup(groupId, { name: 'Updated' });
      await controller.deleteGroup(groupId);

      expect(mockUserAggregateService.createGroup).toHaveBeenCalled();
      expect(mockUserAggregateService.updateGroup).toHaveBeenCalled();
      expect(mockUserAggregateService.deleteGroup).toHaveBeenCalled();

      // Verify query service was not called for write operations
      expect(mockGroupQueryService.findGroupById).not.toHaveBeenCalled();
      expect(mockGroupQueryService.listGroups).not.toHaveBeenCalled();
    });

    it('should use aggregate service for complex operations', async () => {
      const groupId = 'test-group-id';
      const mockGroup = new Group({ id: groupId, name: 'Test Group' });
      const mockUsers = [
        new User({ id: '1', name: 'User 1', email: 'user1@example.com' }),
      ];

      mockUserAggregateService.createGroupWithUsers.mockResolvedValue({
        group: mockGroup,
        users: mockUsers,
      });
      mockUserAggregateService.getGroupWithUsers.mockResolvedValue({
        group: mockGroup,
        users: mockUsers,
      });
      mockUserAggregateService.deleteGroupWithUsers.mockResolvedValue(
        undefined,
      );

      await controller.createGroupWithUsers({
        group: { name: 'Test' },
        users: [],
      });
      await controller.getGroupWithUsers(groupId);
      await controller.deleteGroupWithUsers(groupId);

      expect(
        mockUserAggregateService.createGroupWithUsers,
      ).toHaveBeenCalled();
      expect(mockUserAggregateService.getGroupWithUsers).toHaveBeenCalled();
      expect(
        mockUserAggregateService.deleteGroupWithUsers,
      ).toHaveBeenCalled();

      // Complex operations should not use query service
      expect(mockGroupQueryService.findGroupById).not.toHaveBeenCalled();
      expect(mockGroupQueryService.listGroups).not.toHaveBeenCalled();
    });
  });

  describe('DTO handling', () => {
    it('should correctly handle complex nested DTOs', async () => {
      const complexDto = {
        group: { name: 'Complex Group' },
        users: [
          { name: 'User A', email: 'a@example.com' },
          { name: 'User B', email: 'b@example.com' },
          { name: 'User C', email: 'c@example.com' },
        ],
      };

      const mockResult = {
        group: new Group({ id: 'complex-id', name: 'Complex Group' }),
        users: [
          new User({ id: '1', name: 'User A', email: 'a@example.com' }),
          new User({ id: '2', name: 'User B', email: 'b@example.com' }),
          new User({ id: '3', name: 'User C', email: 'c@example.com' }),
        ],
      };

      mockUserAggregateService.createGroupWithUsers.mockResolvedValue(
        mockResult,
      );

      await controller.createGroupWithUsers(complexDto);

      expect(
        mockUserAggregateService.createGroupWithUsers,
      ).toHaveBeenCalledWith({
        group: { name: 'Complex Group' },
        users: [
          { name: 'User A', email: 'a@example.com' },
          { name: 'User B', email: 'b@example.com' },
          { name: 'User C', email: 'c@example.com' },
        ],
      });
    });
  });
});