import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UserAggregateService } from 'src/users/domain/services/user-aggregate.service';
import { UserQueryService } from 'src/users/domain/services/user-query.service';
import { User } from 'src/users/domain/entities/user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let mockUserAggregateService: jest.Mocked<UserAggregateService>;
  let mockUserQueryService: jest.Mocked<UserQueryService>;

  beforeEach(async () => {
    mockUserAggregateService = {
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      createUserWithGroup: jest.fn(),
      addUsersToGroup: jest.fn(),
      createGroupWithUsers: jest.fn(),
      deleteGroupWithUsers: jest.fn(),
      getGroupWithUsers: jest.fn(),
      createGroup: jest.fn(),
      updateGroup: jest.fn(),
      deleteGroup: jest.fn(),
    } as any;

    mockUserQueryService = {
      findUserById: jest.fn(),
      listUsers: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UserAggregateService,
          useValue: mockUserAggregateService,
        },
        {
          provide: UserQueryService,
          useValue: mockUserQueryService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const createUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const mockUser = new User({
        id: 'user-id',
        name: 'John Doe',
        email: 'john@example.com',
      });

      mockUserAggregateService.createUser.mockResolvedValue(mockUser);

      const result = await controller.createUser(createUserDto);

      expect(mockUserAggregateService.createUser).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
      });
      expect(mockUserAggregateService.createUser).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
      expect(result).toBeInstanceOf(User);
    });

    it('should handle service errors', async () => {
      const createUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const error = new Error('Email already exists');
      mockUserAggregateService.createUser.mockRejectedValue(error);

      await expect(controller.createUser(createUserDto)).rejects.toThrow(
        'Email already exists',
      );

      expect(mockUserAggregateService.createUser).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('should pass DTO properties correctly', async () => {
      const createUserDto = {
        name: 'Alice Smith',
        email: 'alice@company.com',
      };

      const mockUser = new User({
        id: 'alice-id',
        name: 'Alice Smith',
        email: 'alice@company.com',
      });

      mockUserAggregateService.createUser.mockResolvedValue(mockUser);

      await controller.createUser(createUserDto);

      expect(mockUserAggregateService.createUser).toHaveBeenCalledWith({
        name: 'Alice Smith',
        email: 'alice@company.com',
      });
    });
  });

  describe('listUsers', () => {
    it('should return array of users', async () => {
      const mockUsers = [
        new User({ id: '1', name: 'User 1', email: 'user1@example.com' }),
        new User({ id: '2', name: 'User 2', email: 'user2@example.com' }),
      ];

      mockUserQueryService.listUsers.mockResolvedValue(mockUsers);

      const result = await controller.listUsers();

      expect(mockUserQueryService.listUsers).toHaveBeenCalledTimes(1);
      expect(mockUserQueryService.listUsers).toHaveBeenCalledWith();
      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no users exist', async () => {
      mockUserQueryService.listUsers.mockResolvedValue([]);

      const result = await controller.listUsers();

      expect(mockUserQueryService.listUsers).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle service errors', async () => {
      const error = new Error('Database connection failed');
      mockUserQueryService.listUsers.mockRejectedValue(error);

      await expect(controller.listUsers()).rejects.toThrow(
        'Database connection failed',
      );

      expect(mockUserQueryService.listUsers).toHaveBeenCalledTimes(1);
    });
  });

  describe('findUser', () => {
    it('should return user when found', async () => {
      const userId = 'existing-user-id';
      const mockUser = new User({
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
      });

      mockUserQueryService.findUserById.mockResolvedValue(mockUser);

      const result = await controller.findUser(userId);

      expect(mockUserQueryService.findUserById).toHaveBeenCalledWith(userId);
      expect(mockUserQueryService.findUserById).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const userId = 'non-existent-user';

      mockUserQueryService.findUserById.mockResolvedValue(null);

      const result = await controller.findUser(userId);

      expect(mockUserQueryService.findUserById).toHaveBeenCalledWith(userId);
      expect(result).toBeNull();
    });

    it('should handle service errors', async () => {
      const userId = 'error-user-id';
      const error = new Error('Database error');

      mockUserQueryService.findUserById.mockRejectedValue(error);

      await expect(controller.findUser(userId)).rejects.toThrow(
        'Database error',
      );

      expect(mockUserQueryService.findUserById).toHaveBeenCalledWith(userId);
    });
  });

  describe('updateUser', () => {
    it('should update user with full data', async () => {
      const userId = 'user-to-update';
      const updateUserDto = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      const mockUpdatedUser = new User({
        id: userId,
        name: 'Updated Name',
        email: 'updated@example.com',
      });

      mockUserAggregateService.updateUser.mockResolvedValue(mockUpdatedUser);

      const result = await controller.updateUser(userId, updateUserDto);

      expect(mockUserAggregateService.updateUser).toHaveBeenCalledWith(userId, {
        name: 'Updated Name',
        email: 'updated@example.com',
      });
      expect(mockUserAggregateService.updateUser).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should update user with partial data', async () => {
      const userId = 'user-to-update';
      const updateUserDto = {
        name: 'New Name Only',
      };

      const mockUpdatedUser = new User({
        id: userId,
        name: 'New Name Only',
        email: 'old@example.com',
      });

      mockUserAggregateService.updateUser.mockResolvedValue(mockUpdatedUser);

      const result = await controller.updateUser(userId, updateUserDto);

      expect(mockUserAggregateService.updateUser).toHaveBeenCalledWith(userId, {
        name: 'New Name Only',
        email: undefined,
      });
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should handle service errors', async () => {
      const userId = 'non-existent-user';
      const updateUserDto = { name: 'New Name' };
      const error = new Error('User not found');

      mockUserAggregateService.updateUser.mockRejectedValue(error);

      await expect(
        controller.updateUser(userId, updateUserDto),
      ).rejects.toThrow('User not found');

      expect(mockUserAggregateService.updateUser).toHaveBeenCalledWith(userId, {
        name: 'New Name',
        email: undefined,
      });
    });

    it('should pass undefined values correctly', async () => {
      const userId = 'user-id';
      const updateUserDto = {}; // Empty update

      const mockUser = new User({
        id: userId,
        name: 'Original Name',
        email: 'original@example.com',
      });

      mockUserAggregateService.updateUser.mockResolvedValue(mockUser);

      await controller.updateUser(userId, updateUserDto);

      expect(mockUserAggregateService.updateUser).toHaveBeenCalledWith(userId, {
        name: undefined,
        email: undefined,
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const userId = 'user-to-delete';

      mockUserAggregateService.deleteUser.mockResolvedValue(undefined);

      const result = await controller.deleteUser(userId);

      expect(mockUserAggregateService.deleteUser).toHaveBeenCalledWith(userId);
      expect(mockUserAggregateService.deleteUser).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });

    it('should handle service errors', async () => {
      const userId = 'non-existent-user';
      const error = new Error('User not found');

      mockUserAggregateService.deleteUser.mockRejectedValue(error);

      await expect(controller.deleteUser(userId)).rejects.toThrow(
        'User not found',
      );

      expect(mockUserAggregateService.deleteUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('createUserWithGroup', () => {
    it('should create user with group successfully', async () => {
      const createUserWithGroupDto = {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        groupId: 'existing-group-id',
      };

      const mockUser = new User({
        id: 'new-user-id',
        name: 'John Doe',
        email: 'john@example.com',
      });

      mockUserAggregateService.createUserWithGroup.mockResolvedValue(mockUser);

      const result = await controller.createUserWithGroup(
        createUserWithGroupDto,
      );

      expect(
        mockUserAggregateService.createUserWithGroup,
      ).toHaveBeenCalledWith(createUserWithGroupDto);
      expect(
        mockUserAggregateService.createUserWithGroup,
      ).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });

    it('should handle service errors', async () => {
      const createUserWithGroupDto = {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        groupId: 'non-existent-group',
      };

      const error = new Error('Group not found');
      mockUserAggregateService.createUserWithGroup.mockRejectedValue(error);

      await expect(
        controller.createUserWithGroup(createUserWithGroupDto),
      ).rejects.toThrow('Group not found');

      expect(
        mockUserAggregateService.createUserWithGroup,
      ).toHaveBeenCalledWith(createUserWithGroupDto);
    });

    it('should pass DTO structure correctly', async () => {
      const createUserWithGroupDto = {
        user: {
          name: 'Alice Smith',
          email: 'alice@company.com',
        },
        groupId: 'admin-group',
      };

      const mockUser = new User({
        id: 'alice-id',
        name: 'Alice Smith',
        email: 'alice@company.com',
      });

      mockUserAggregateService.createUserWithGroup.mockResolvedValue(mockUser);

      await controller.createUserWithGroup(createUserWithGroupDto);

      expect(
        mockUserAggregateService.createUserWithGroup,
      ).toHaveBeenCalledWith({
        user: {
          name: 'Alice Smith',
          email: 'alice@company.com',
        },
        groupId: 'admin-group',
      });
    });
  });

  describe('addUsersToGroup', () => {
    it('should add users to group successfully', async () => {
      const addUsersToGroupDto = {
        groupId: 'existing-group-id',
        users: [
          { name: 'User 1', email: 'user1@example.com' },
          { name: 'User 2', email: 'user2@example.com' },
        ],
      };

      const mockUsers = [
        new User({ id: '1', name: 'User 1', email: 'user1@example.com' }),
        new User({ id: '2', name: 'User 2', email: 'user2@example.com' }),
      ];

      mockUserAggregateService.addUsersToGroup.mockResolvedValue(mockUsers);

      const result = await controller.addUsersToGroup(addUsersToGroupDto);

      expect(mockUserAggregateService.addUsersToGroup).toHaveBeenCalledWith(
        addUsersToGroupDto,
      );
      expect(mockUserAggregateService.addUsersToGroup).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
    });

    it('should handle empty users array', async () => {
      const addUsersToGroupDto = {
        groupId: 'existing-group-id',
        users: [],
      };

      mockUserAggregateService.addUsersToGroup.mockResolvedValue([]);

      const result = await controller.addUsersToGroup(addUsersToGroupDto);

      expect(mockUserAggregateService.addUsersToGroup).toHaveBeenCalledWith(
        addUsersToGroupDto,
      );
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle service errors', async () => {
      const addUsersToGroupDto = {
        groupId: 'non-existent-group',
        users: [{ name: 'User 1', email: 'user1@example.com' }],
      };

      const error = new Error('Group not found');
      mockUserAggregateService.addUsersToGroup.mockRejectedValue(error);

      await expect(
        controller.addUsersToGroup(addUsersToGroupDto),
      ).rejects.toThrow('Group not found');

      expect(mockUserAggregateService.addUsersToGroup).toHaveBeenCalledWith(
        addUsersToGroupDto,
      );
    });

    it('should pass complex DTO structure correctly', async () => {
      const addUsersToGroupDto = {
        groupId: 'dev-team',
        users: [
          { name: 'Developer 1', email: 'dev1@company.com' },
          { name: 'Developer 2', email: 'dev2@company.com' },
          { name: 'Developer 3', email: 'dev3@company.com' },
        ],
      };

      const mockUsers = [
        new User({ id: '1', name: 'Developer 1', email: 'dev1@company.com' }),
        new User({ id: '2', name: 'Developer 2', email: 'dev2@company.com' }),
        new User({ id: '3', name: 'Developer 3', email: 'dev3@company.com' }),
      ];

      mockUserAggregateService.addUsersToGroup.mockResolvedValue(mockUsers);

      await controller.addUsersToGroup(addUsersToGroupDto);

      expect(mockUserAggregateService.addUsersToGroup).toHaveBeenCalledWith({
        groupId: 'dev-team',
        users: [
          { name: 'Developer 1', email: 'dev1@company.com' },
          { name: 'Developer 2', email: 'dev2@company.com' },
          { name: 'Developer 3', email: 'dev3@company.com' },
        ],
      });
    });
  });

  describe('integration behavior', () => {
    it('should delegate read operations to query service', async () => {
      const userId = 'test-user-id';
      const mockUser = new User({
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
      });

      mockUserQueryService.findUserById.mockResolvedValue(mockUser);
      mockUserQueryService.listUsers.mockResolvedValue([mockUser]);

      await controller.findUser(userId);
      await controller.listUsers();

      expect(mockUserQueryService.findUserById).toHaveBeenCalledWith(userId);
      expect(mockUserQueryService.listUsers).toHaveBeenCalled();

      // Verify aggregate service was not called for read operations
      expect(mockUserAggregateService.createUser).not.toHaveBeenCalled();
      expect(mockUserAggregateService.updateUser).not.toHaveBeenCalled();
      expect(mockUserAggregateService.deleteUser).not.toHaveBeenCalled();
    });

    it('should delegate write operations to aggregate service', async () => {
      const userId = 'test-user-id';
      const mockUser = new User({
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
      });

      mockUserAggregateService.createUser.mockResolvedValue(mockUser);
      mockUserAggregateService.updateUser.mockResolvedValue(mockUser);
      mockUserAggregateService.deleteUser.mockResolvedValue(undefined);

      await controller.createUser({ name: 'Test', email: 'test@example.com' });
      await controller.updateUser(userId, { name: 'Updated' });
      await controller.deleteUser(userId);

      expect(mockUserAggregateService.createUser).toHaveBeenCalled();
      expect(mockUserAggregateService.updateUser).toHaveBeenCalled();
      expect(mockUserAggregateService.deleteUser).toHaveBeenCalled();

      // Verify query service was not called for write operations
      expect(mockUserQueryService.findUserById).not.toHaveBeenCalled();
      expect(mockUserQueryService.listUsers).not.toHaveBeenCalled();
    });
  });
});