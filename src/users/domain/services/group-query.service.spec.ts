import { GroupQueryService } from './group-query.service';
import { GroupRepository } from '../repositories/group.repository';
import { Group } from '../entities/groups.entity';

describe('GroupQueryService', () => {
  let service: GroupQueryService;
  let mockGroupRepository: jest.Mocked<GroupRepository>;

  beforeEach(() => {
    mockGroupRepository = {
      createGroup: jest.fn(),
      listGroups: jest.fn(),
      findGroupById: jest.fn(),
      updateGroup: jest.fn(),
      deleteGroupById: jest.fn(),
      getGroupsByUserId: jest.fn(),
    } as any;

    service = new GroupQueryService(mockGroupRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findGroupById', () => {
    it('should return group when found', async () => {
      const groupId = 'existing-group-id';
      const mockGroup = new Group({
        id: groupId,
        name: 'Test Group',
      });

      mockGroupRepository.findGroupById.mockResolvedValue(mockGroup);

      const result = await service.findGroupById(groupId);

      expect(mockGroupRepository.findGroupById).toHaveBeenCalledWith(groupId);
      expect(mockGroupRepository.findGroupById).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockGroup);
      expect(result).toBeInstanceOf(Group);
      expect(result?.name).toBe('Test Group');
      expect(result?.id).toBe(groupId);
    });

    it('should return null when group not found', async () => {
      const groupId = 'non-existent-group-id';

      mockGroupRepository.findGroupById.mockResolvedValue(null);

      const result = await service.findGroupById(groupId);

      expect(mockGroupRepository.findGroupById).toHaveBeenCalledWith(groupId);
      expect(mockGroupRepository.findGroupById).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    it('should handle repository errors', async () => {
      const groupId = 'error-group-id';
      const error = new Error('Database connection failed');

      mockGroupRepository.findGroupById.mockRejectedValue(error);

      await expect(service.findGroupById(groupId)).rejects.toThrow(
        'Database connection failed',
      );

      expect(mockGroupRepository.findGroupById).toHaveBeenCalledWith(groupId);
    });

    it('should handle different group names and IDs', async () => {
      const testCases = [
        { id: 'group-1', name: 'Admin Group' },
        { id: 'group-2', name: 'User Group' },
        { id: 'group-3', name: 'Special Characters! @#$%' },
        { id: 'group-4', name: '' }, // Empty name
      ];

      for (const testCase of testCases) {
        const mockGroup = new Group(testCase);
        mockGroupRepository.findGroupById.mockResolvedValue(mockGroup);

        const result = await service.findGroupById(testCase.id);

        expect(result?.id).toBe(testCase.id);
        expect(result?.name).toBe(testCase.name);
      }
    });
  });

  describe('listGroups', () => {
    it('should return array of groups', async () => {
      const mockGroups = [
        new Group({ id: '1', name: 'Group 1' }),
        new Group({ id: '2', name: 'Group 2' }),
        new Group({ id: '3', name: 'Group 3' }),
      ];

      mockGroupRepository.listGroups.mockResolvedValue(mockGroups);

      const result = await service.listGroups();

      expect(mockGroupRepository.listGroups).toHaveBeenCalledTimes(1);
      expect(mockGroupRepository.listGroups).toHaveBeenCalledWith();
      expect(result).toEqual(mockGroups);
      expect(result).toHaveLength(3);
      expect(result[0]).toBeInstanceOf(Group);
      expect(result[1]).toBeInstanceOf(Group);
      expect(result[2]).toBeInstanceOf(Group);
    });

    it('should return empty array when no groups exist', async () => {
      mockGroupRepository.listGroups.mockResolvedValue([]);

      const result = await service.listGroups();

      expect(mockGroupRepository.listGroups).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle repository errors', async () => {
      const error = new Error('Database connection failed');

      mockGroupRepository.listGroups.mockRejectedValue(error);

      await expect(service.listGroups()).rejects.toThrow(
        'Database connection failed',
      );

      expect(mockGroupRepository.listGroups).toHaveBeenCalledTimes(1);
    });

    it('should return groups with correct properties', async () => {
      const mockGroups = [
        new Group({
          id: 'group-1',
          name: 'Administration',
        }),
        new Group({
          id: 'group-2',
          name: 'Development Team',
        }),
      ];

      mockGroupRepository.listGroups.mockResolvedValue(mockGroups);

      const result = await service.listGroups();

      expect(result[0].id).toBe('group-1');
      expect(result[0].name).toBe('Administration');
      expect(result[1].id).toBe('group-2');
      expect(result[1].name).toBe('Development Team');
    });

    it('should handle large number of groups', async () => {
      const mockGroups = Array.from({ length: 100 }, (_, i) =>
        new Group({ id: `group-${i}`, name: `Group ${i}` }),
      );

      mockGroupRepository.listGroups.mockResolvedValue(mockGroups);

      const result = await service.listGroups();

      expect(result).toHaveLength(100);
      expect(result[0].name).toBe('Group 0');
      expect(result[99].name).toBe('Group 99');
    });
  });

  describe('integration behavior', () => {
    it('should delegate all calls to repository without modification', async () => {
      const groupId = 'test-group-id';
      const mockGroup = new Group({
        id: groupId,
        name: 'Test Group',
      });

      mockGroupRepository.findGroupById.mockResolvedValue(mockGroup);
      mockGroupRepository.listGroups.mockResolvedValue([mockGroup]);

      // Test findGroupById delegation
      const foundGroup = await service.findGroupById(groupId);
      expect(foundGroup).toBe(mockGroup); // Same reference, no transformation

      // Test listGroups delegation
      const groupList = await service.listGroups();
      expect(groupList).toEqual([mockGroup]); // Same reference, no transformation

      // Verify no other repository methods were called
      expect(mockGroupRepository.createGroup).not.toHaveBeenCalled();
      expect(mockGroupRepository.updateGroup).not.toHaveBeenCalled();
      expect(mockGroupRepository.deleteGroupById).not.toHaveBeenCalled();
      expect(mockGroupRepository.getGroupsByUserId).not.toHaveBeenCalled();
    });

    it('should maintain referential integrity', async () => {
      const group1 = new Group({ id: '1', name: 'Group 1' });
      const group2 = new Group({ id: '2', name: 'Group 2' });

      mockGroupRepository.findGroupById.mockImplementation(async (id) => {
        if (id === '1') return group1;
        if (id === '2') return group2;
        return null;
      });

      const result1 = await service.findGroupById('1');
      const result2 = await service.findGroupById('2');
      const result3 = await service.findGroupById('3');

      expect(result1).toBe(group1);
      expect(result2).toBe(group2);
      expect(result3).toBeNull();
    });
  });

  describe('error handling consistency', () => {
    it('should propagate different types of errors correctly', async () => {
      const errorTypes = [
        new Error('Generic error'),
        new TypeError('Type error'),
        new ReferenceError('Reference error'),
        { message: 'Custom error object' },
      ];

      for (const error of errorTypes) {
        mockGroupRepository.findGroupById.mockRejectedValue(error);
        await expect(service.findGroupById('test-id')).rejects.toEqual(error);

        mockGroupRepository.listGroups.mockRejectedValue(error);
        await expect(service.listGroups()).rejects.toEqual(error);
      }
    });
  });
});