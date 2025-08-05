import { UserQueryService } from './user-query.service';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../entities/user.entity';

describe('UserQueryService', () => {
  let service: UserQueryService;
  let mockUserRepository: jest.Mocked<UserRepository>;

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

    service = new UserQueryService(mockUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findUserById', () => {
    it('should return user when found', async () => {
      const userId = 'existing-user-id';
      const mockUser = new User({
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
      });

      mockUserRepository.findUserById.mockResolvedValue(mockUser);

      const result = await service.findUserById(userId);

      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findUserById).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
      expect(result).toBeInstanceOf(User);
      expect(result?.name).toBe('John Doe');
      expect(result?.email).toBe('john@example.com');
    });

    it('should return null when user not found', async () => {
      const userId = 'non-existent-user-id';

      mockUserRepository.findUserById.mockResolvedValue(null);

      const result = await service.findUserById(userId);

      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findUserById).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    it('should handle repository errors', async () => {
      const userId = 'error-user-id';
      const error = new Error('Database connection failed');

      mockUserRepository.findUserById.mockRejectedValue(error);

      await expect(service.findUserById(userId)).rejects.toThrow(
        'Database connection failed',
      );

      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
    });
  });

  describe('listUsers', () => {
    it('should return array of users', async () => {
      const mockUsers = [
        new User({ id: '1', name: 'User 1', email: 'user1@example.com' }),
        new User({ id: '2', name: 'User 2', email: 'user2@example.com' }),
        new User({ id: '3', name: 'User 3', email: 'user3@example.com' }),
      ];

      mockUserRepository.listUsers.mockResolvedValue(mockUsers);

      const result = await service.listUsers();

      expect(mockUserRepository.listUsers).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.listUsers).toHaveBeenCalledWith();
      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(3);
      expect(result[0]).toBeInstanceOf(User);
      expect(result[1]).toBeInstanceOf(User);
      expect(result[2]).toBeInstanceOf(User);
    });

    it('should return empty array when no users exist', async () => {
      mockUserRepository.listUsers.mockResolvedValue([]);

      const result = await service.listUsers();

      expect(mockUserRepository.listUsers).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle repository errors', async () => {
      const error = new Error('Database connection failed');

      mockUserRepository.listUsers.mockRejectedValue(error);

      await expect(service.listUsers()).rejects.toThrow(
        'Database connection failed',
      );

      expect(mockUserRepository.listUsers).toHaveBeenCalledTimes(1);
    });

    it('should return users with correct properties', async () => {
      const mockUsers = [
        new User({
          id: 'user-1',
          name: 'Alice Smith',
          email: 'alice@example.com',
        }),
        new User({
          id: 'user-2',
          name: 'Bob Johnson',
          email: 'bob@example.com',
        }),
      ];

      mockUserRepository.listUsers.mockResolvedValue(mockUsers);

      const result = await service.listUsers();

      expect(result[0].id).toBe('user-1');
      expect(result[0].name).toBe('Alice Smith');
      expect(result[0].email).toBe('alice@example.com');
      expect(result[1].id).toBe('user-2');
      expect(result[1].name).toBe('Bob Johnson');
      expect(result[1].email).toBe('bob@example.com');
    });
  });

  describe('integration behavior', () => {
    it('should delegate all calls to repository without modification', async () => {
      const userId = 'test-user-id';
      const mockUser = new User({
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
      });

      mockUserRepository.findUserById.mockResolvedValue(mockUser);
      mockUserRepository.listUsers.mockResolvedValue([mockUser]);

      // Test findUserById delegation
      const foundUser = await service.findUserById(userId);
      expect(foundUser).toBe(mockUser); // Same reference, no transformation

      // Test listUsers delegation
      const userList = await service.listUsers();
      expect(userList).toEqual([mockUser]); // Same reference, no transformation

      // Verify no other repository methods were called
      expect(mockUserRepository.createUser).not.toHaveBeenCalled();
      expect(mockUserRepository.updateUser).not.toHaveBeenCalled();
      expect(mockUserRepository.deleteUserById).not.toHaveBeenCalled();
    });
  });
});