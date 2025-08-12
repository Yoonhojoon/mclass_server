import { MClassService } from '../../domains/mclass/mclass.service.js';
import { MClassRepository } from '../../domains/mclass/mclass.repository.js';
import { MClassError } from '../../common/exception/mclass/MClassError.js';
import {
  SelectionType,
  Visibility,
} from '../../domains/mclass/dto/CreateMClassDto.js';

// Mock repository
const mockRepository = {
  findWithFilters: jest.fn(),
  findById: jest.fn(),
  findByTitle: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getApprovedCount: jest.fn(),
  getWaitlistedCount: jest.fn(),
} as unknown as jest.Mocked<MClassRepository>;

describe('MClassService', () => {
  let service: MClassService;

  beforeEach(() => {
    service = new MClassService(mockRepository);
    jest.clearAllMocks();
  });

  describe('calculatePhase', () => {
    it('should return UPCOMING when now < recruitStartAt', () => {
      const mclass = {
        id: '1',
        title: 'Test Class',
        description: null,
        recruitStartAt: new Date('2025-12-01'),
        recruitEndAt: new Date('2025-12-15'),
        startAt: new Date('2025-12-20'),
        endAt: new Date('2025-12-25'),
        selectionType: 'FIRST_COME' as const,
        capacity: 10,
        approvedCount: 5,
        allowWaitlist: false,
        waitlistCapacity: null,
        visibility: 'PUBLIC' as const,
        isOnline: true,
        location: null,
        fee: null,
        createdBy: 'admin-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = service['calculatePhase'](mclass);
      expect(result).toBe('UPCOMING');
    });

    it('should return RECRUITING when in recruitment period', () => {
      const mclass = {
        id: '1',
        title: 'Test Class',
        description: null,
        recruitStartAt: new Date('2024-01-01'),
        recruitEndAt: new Date('2025-12-31'),
        startAt: new Date('2026-01-20'),
        endAt: new Date('2026-01-25'),
        selectionType: 'FIRST_COME' as const,
        capacity: 10,
        approvedCount: 5,
        allowWaitlist: false,
        waitlistCapacity: null,
        visibility: 'PUBLIC' as const,
        isOnline: true,
        location: null,
        fee: null,
        createdBy: 'admin-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = service['calculatePhase'](mclass);
      expect(result).toBe('RECRUITING');
    });

    it('should return IN_PROGRESS when in progress', () => {
      const mclass = {
        id: '1',
        title: 'Test Class',
        description: null,
        recruitStartAt: new Date('2024-01-01'),
        recruitEndAt: new Date('2024-12-15'),
        startAt: new Date('2024-12-20'),
        endAt: new Date('2025-12-25'),
        selectionType: 'FIRST_COME' as const,
        capacity: 10,
        approvedCount: 5,
        allowWaitlist: false,
        waitlistCapacity: null,
        visibility: 'PUBLIC' as const,
        isOnline: true,
        location: null,
        fee: null,
        createdBy: 'admin-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = service['calculatePhase'](mclass);
      expect(result).toBe('IN_PROGRESS');
    });

    it('should return ENDED when ended', () => {
      const mclass = {
        id: '1',
        title: 'Test Class',
        description: null,
        recruitStartAt: new Date('2020-01-01'),
        recruitEndAt: new Date('2020-12-15'),
        startAt: new Date('2021-01-01'),
        endAt: new Date('2021-01-25'),
        selectionType: 'FIRST_COME' as const,
        capacity: 10,
        approvedCount: 5,
        allowWaitlist: false,
        waitlistCapacity: null,
        visibility: 'PUBLIC' as const,
        isOnline: true,
        location: null,
        fee: null,
        createdBy: 'admin-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = service['calculatePhase'](mclass);
      expect(result).toBe('ENDED');
    });
  });

  describe('getById', () => {
    it('should return MClass with phase when found', async () => {
      const mockMClass = {
        id: '1',
        title: 'Test Class',
        description: null,
        recruitStartAt: new Date('2025-12-15'),
        recruitEndAt: new Date('2025-12-19'),
        startAt: new Date('2025-12-20'),
        endAt: new Date('2025-12-25'),
        selectionType: 'FIRST_COME' as const,
        capacity: 10,
        approvedCount: 5,
        allowWaitlist: false,
        waitlistCapacity: null,
        visibility: 'PUBLIC' as const,
        isOnline: true,
        location: null,
        fee: null,
        createdBy: 'admin-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(mockMClass);

      const result = await service.getById('1');

      expect(result).toHaveProperty('phase');
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw MClassError.notFound when not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getById('1')).rejects.toThrow(MClassError);
    });
  });

  describe('create', () => {
    it('should create MClass successfully', async () => {
      const createData = {
        title: 'New Class',
        recruitStartAt: '2025-12-19T10:00:00Z',
        recruitEndAt: '2025-12-19T12:00:00Z',
        startAt: '2025-12-20T10:00:00Z',
        endAt: '2025-12-20T12:00:00Z',
        selectionType: SelectionType.FIRST_COME,
        allowWaitlist: false,
        visibility: Visibility.PUBLIC,
        isOnline: true,
      };

      const mockCreatedMClass = {
        id: '1',
        title: 'New Class',
        description: null,
        recruitStartAt: new Date('2025-12-19'),
        recruitEndAt: new Date('2025-12-19'),
        startAt: new Date('2025-12-20'),
        endAt: new Date('2025-12-20'),
        selectionType: 'FIRST_COME' as const,
        capacity: null,
        approvedCount: 0,
        allowWaitlist: false,
        waitlistCapacity: null,
        visibility: 'PUBLIC' as const,
        isOnline: true,
        location: null,
        fee: null,
        createdBy: 'admin-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findByTitle.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockCreatedMClass);

      const result = await service.create('admin-id', createData);

      expect(result).toHaveProperty('phase');
      expect(mockRepository.create).toHaveBeenCalledWith(
        createData,
        'admin-id'
      );
    });

    it('should throw error when title already exists', async () => {
      const createData = {
        title: 'Existing Class',
        recruitStartAt: '2025-12-19T10:00:00Z',
        recruitEndAt: '2025-12-19T12:00:00Z',
        startAt: '2025-12-20T10:00:00Z',
        endAt: '2025-12-20T12:00:00Z',
        selectionType: SelectionType.FIRST_COME,
        allowWaitlist: false,
        visibility: Visibility.PUBLIC,
        isOnline: true,
      };

      const existingMClass = {
        id: '1',
        title: 'Existing Class',
        description: null,
        recruitStartAt: new Date('2025-12-19T10:00:00Z'),
        recruitEndAt: new Date('2025-12-19T12:00:00Z'),
        startAt: new Date('2025-12-20'),
        endAt: new Date('2025-12-20'),
        selectionType: 'FIRST_COME' as const,
        capacity: null,
        approvedCount: 0,
        allowWaitlist: false,
        waitlistCapacity: null,
        visibility: 'PUBLIC' as const,
        isOnline: true,
        location: null,
        fee: null,
        createdBy: 'admin-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findByTitle.mockResolvedValue(existingMClass);

      await expect(service.create('admin-id', createData)).rejects.toThrow(
        MClassError
      );
    });
  });

  describe('list', () => {
    it('should return MClass list with phases', async () => {
      const mockMClasses = [
        {
          id: '1',
          title: 'Test Class 1',
          description: null,
          recruitStartAt: new Date('2025-12-19T10:00:00Z'),
          recruitEndAt: new Date('2025-12-19T12:00:00Z'),
          startAt: new Date('2026-01-20'),
          endAt: new Date('2026-01-25'),
          selectionType: 'FIRST_COME' as const,
          capacity: 10,
          approvedCount: 5,
          allowWaitlist: false,
          waitlistCapacity: null,
          visibility: 'PUBLIC' as const,
          isOnline: true,
          location: null,
          fee: null,
          createdBy: 'admin-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          creator: {
            id: 'admin-id',
            name: 'Admin User',
            email: 'admin@example.com',
          },
        },
        {
          id: '2',
          title: 'Test Class 2',
          description: null,
          recruitStartAt: new Date('2025-12-19T10:00:00Z'),
          recruitEndAt: new Date('2025-12-19T12:00:00Z'),
          startAt: new Date('2024-12-20'),
          endAt: new Date('2024-12-25'),
          selectionType: 'FIRST_COME' as const,
          capacity: 10,
          approvedCount: 5,
          allowWaitlist: false,
          waitlistCapacity: null,
          visibility: 'PUBLIC' as const,
          isOnline: true,
          location: null,
          fee: null,
          createdBy: 'admin-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          creator: {
            id: 'admin-id',
            name: 'Admin User',
            email: 'admin@example.com',
          },
        },
      ];

      const mockResult = {
        items: mockMClasses,
        total: 2,
        page: 1,
        size: 10,
        totalPages: 1,
      };

      mockRepository.findWithFilters.mockResolvedValue(mockResult);

      const query = {
        page: 1,
        size: 10,
        visibility: 'PUBLIC' as const,
        sort: 'startAt' as const,
        order: 'asc' as const,
      };
      const result = await service.list(query);

      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toHaveProperty('phase');
      expect(result.items[1]).toHaveProperty('phase');
      expect(result.total).toBe(2);
      expect(mockRepository.findWithFilters).toHaveBeenCalledWith(query, false);
    });

    it('should filter by phase when specified', async () => {
      const mockMClasses = [
        {
          id: '1',
          title: 'Recruiting Class',
          description: null,
          recruitStartAt: new Date('2025-08-01T10:00:00Z'),
          recruitEndAt: new Date('2025-08-31T12:00:00Z'),
          startAt: new Date('2025-09-20'),
          endAt: new Date('2025-09-25'),
          selectionType: 'FIRST_COME' as const,
          capacity: 10,
          approvedCount: 5,
          allowWaitlist: false,
          waitlistCapacity: null,
          visibility: 'PUBLIC' as const,
          isOnline: true,
          location: null,
          fee: null,
          createdBy: 'admin-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          creator: {
            id: 'admin-id',
            name: 'Admin User',
            email: 'admin@example.com',
          },
        },
        {
          id: '2',
          title: 'Ended Class',
          description: null,
          recruitStartAt: new Date('2020-01-01'),
          recruitEndAt: new Date('2020-12-15'),
          startAt: new Date('2021-01-01'),
          endAt: new Date('2021-01-25'),
          selectionType: 'FIRST_COME' as const,
          capacity: 10,
          approvedCount: 5,
          allowWaitlist: false,
          waitlistCapacity: null,
          visibility: 'PUBLIC' as const,
          isOnline: true,
          location: null,
          fee: null,
          createdBy: 'admin-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          creator: {
            id: 'admin-id',
            name: 'Admin User',
            email: 'admin@example.com',
          },
        },
      ];

      const mockResult = {
        items: mockMClasses,
        total: 2,
        page: 1,
        size: 10,
        totalPages: 1,
      };

      mockRepository.findWithFilters.mockResolvedValue(mockResult);

      const query = {
        page: 1,
        size: 10,
        phase: 'RECRUITING' as const,
        visibility: 'PUBLIC' as const,
        sort: 'startAt' as const,
        order: 'asc' as const,
      };
      const result = await service.list(query);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].phase).toBe('RECRUITING');
      expect(result.items[0].title).toBe('Recruiting Class');
      // 필터링 후에도 total과 totalPages는 원본 값 유지 (서비스 로직에 맞춤)
      expect(result.total).toBe(2);
      expect(result.totalPages).toBe(1);
    });

    it('should pass admin flag to repository', async () => {
      const mockResult = {
        items: [],
        total: 0,
        page: 1,
        size: 10,
        totalPages: 0,
      };

      mockRepository.findWithFilters.mockResolvedValue(mockResult);

      const query = {
        page: 1,
        size: 10,
        visibility: 'PUBLIC' as const,
        sort: 'startAt' as const,
        order: 'asc' as const,
      };
      await service.list(query, true);

      expect(mockRepository.findWithFilters).toHaveBeenCalledWith(query, true);
    });
  });

  describe('update', () => {
    it('should update MClass successfully', async () => {
      const existingMClass = {
        id: '1',
        title: 'Original Title',
        description: null,
        recruitStartAt: new Date('2025-01-01'),
        recruitEndAt: new Date('2025-01-15'),
        startAt: new Date('2025-12-20'),
        endAt: new Date('2025-12-25'),
        selectionType: 'FIRST_COME' as const,
        capacity: 10,
        approvedCount: 5,
        allowWaitlist: false,
        waitlistCapacity: null,
        visibility: 'PUBLIC' as const,
        isOnline: true,
        location: null,
        fee: null,
        createdBy: 'admin-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      const updatedMClass = {
        ...existingMClass,
        ...updateData,
      };

      mockRepository.findById.mockResolvedValue(existingMClass);
      mockRepository.findByTitle.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue(updatedMClass);

      const result = await service.update('1', updateData);

      expect(result).toHaveProperty('phase');
      expect(result.title).toBe('Updated Title');
      expect(result.description).toBe('Updated description');
      expect(mockRepository.update).toHaveBeenCalledWith('1', updateData);
    });

    it('should throw error when MClass not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const updateData = { title: 'Updated Title' };

      await expect(service.update('1', updateData)).rejects.toThrow(
        MClassError
      );
    });

    it('should throw error when title already exists', async () => {
      const existingMClass = {
        id: '1',
        title: 'Original Title',
        description: null,
        recruitStartAt: new Date('2025-01-01'),
        recruitEndAt: new Date('2025-01-15'),
        startAt: new Date('2025-12-20'),
        endAt: new Date('2025-12-25'),
        selectionType: 'FIRST_COME' as const,
        capacity: 10,
        approvedCount: 5,
        allowWaitlist: false,
        waitlistCapacity: null,
        visibility: 'PUBLIC' as const,
        isOnline: true,
        location: null,
        fee: null,
        createdBy: 'admin-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const duplicateMClass = {
        id: '2',
        title: 'Existing Title',
        description: null,
        recruitStartAt: new Date('2025-01-01'),
        recruitEndAt: new Date('2025-01-15'),
        startAt: new Date('2025-12-20'),
        endAt: new Date('2025-12-25'),
        selectionType: 'FIRST_COME' as const,
        capacity: 10,
        approvedCount: 5,
        allowWaitlist: false,
        waitlistCapacity: null,
        visibility: 'PUBLIC' as const,
        isOnline: true,
        location: null,
        fee: null,
        createdBy: 'admin-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(existingMClass);
      mockRepository.findByTitle.mockResolvedValue(duplicateMClass);

      const updateData = { title: 'Existing Title' };

      await expect(service.update('1', updateData)).rejects.toThrow(
        MClassError
      );
    });

    it('should not check title duplicate when title is not changed', async () => {
      const existingMClass = {
        id: '1',
        title: 'Original Title',
        description: null,
        recruitStartAt: new Date('2025-01-01'),
        recruitEndAt: new Date('2025-01-15'),
        startAt: new Date('2025-12-20'),
        endAt: new Date('2025-12-25'),
        selectionType: 'FIRST_COME' as const,
        capacity: 10,
        approvedCount: 5,
        allowWaitlist: false,
        waitlistCapacity: null,
        visibility: 'PUBLIC' as const,
        isOnline: true,
        location: null,
        fee: null,
        createdBy: 'admin-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateData = { description: 'Updated description' };

      const updatedMClass = {
        ...existingMClass,
        ...updateData,
      };

      mockRepository.findById.mockResolvedValue(existingMClass);
      mockRepository.update.mockResolvedValue(updatedMClass);

      const result = await service.update('1', updateData);

      expect(result).toHaveProperty('phase');
      expect(mockRepository.findByTitle).not.toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalledWith('1', updateData);
    });

    it('should throw error when trying to modify recruiting class', async () => {
      const recruitingMClass = {
        id: '1',
        title: 'Recruiting Class',
        description: null,
        recruitStartAt: new Date('2024-01-01'),
        recruitEndAt: new Date('2025-12-31'),
        startAt: new Date('2026-01-20'),
        endAt: new Date('2026-01-25'),
        selectionType: 'FIRST_COME' as const,
        capacity: 10,
        approvedCount: 5,
        allowWaitlist: false,
        waitlistCapacity: null,
        visibility: 'PUBLIC' as const,
        isOnline: true,
        location: null,
        fee: null,
        createdBy: 'admin-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(recruitingMClass);

      const updateData = { title: 'Updated Title' };

      await expect(service.update('1', updateData)).rejects.toThrow(
        MClassError
      );
    });
  });

  describe('delete', () => {
    it('should delete MClass successfully', async () => {
      const existingMClass = {
        id: '1',
        title: 'Test Class',
        description: null,
        recruitStartAt: new Date('2025-12-10T12:00:00Z'),
        recruitEndAt: new Date('2025-12-15T12:00:00Z'),
        startAt: new Date('2025-12-20'),
        endAt: new Date('2025-12-25'),
        selectionType: 'FIRST_COME' as const,
        capacity: 10,
        approvedCount: 5,
        allowWaitlist: false,
        waitlistCapacity: null,
        visibility: 'PUBLIC' as const,
        isOnline: true,
        location: null,
        fee: null,
        createdBy: 'admin-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(existingMClass);
      mockRepository.delete.mockResolvedValue(existingMClass);

      await service.delete('1');

      expect(mockRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw error when MClass not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.delete('1')).rejects.toThrow(MClassError);
    });

    it('should throw error when trying to delete in-progress class', async () => {
      const inProgressMClass = {
        id: '1',
        title: 'In Progress Class',
        description: null,
        recruitStartAt: new Date('2024-01-01'),
        recruitEndAt: new Date('2024-12-15'),
        startAt: new Date('2024-12-20'),
        endAt: new Date('2025-12-25'),
        selectionType: 'FIRST_COME' as const,
        capacity: 10,
        approvedCount: 5,
        allowWaitlist: false,
        waitlistCapacity: null,
        visibility: 'PUBLIC' as const,
        isOnline: true,
        location: null,
        fee: null,
        createdBy: 'admin-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(inProgressMClass);

      await expect(service.delete('1')).rejects.toThrow(MClassError);
    });
  });

  describe('getStatistics', () => {
    it('should return statistics for MClass', async () => {
      mockRepository.getApprovedCount.mockResolvedValue(15);
      mockRepository.getWaitlistedCount.mockResolvedValue(5);

      const result = await service.getStatistics('1');

      expect(result).toEqual({
        approvedCount: 15,
        waitlistedCount: 5,
      });
      expect(mockRepository.getApprovedCount).toHaveBeenCalledWith('1');
      expect(mockRepository.getWaitlistedCount).toHaveBeenCalledWith('1');
    });
  });

  describe('getApprovedCount', () => {
    it('should return approved count', async () => {
      mockRepository.getApprovedCount.mockResolvedValue(15);

      const result = await service.getApprovedCount('1');

      expect(result).toBe(15);
      expect(mockRepository.getApprovedCount).toHaveBeenCalledWith('1');
    });
  });

  describe('getWaitlistedCount', () => {
    it('should return waitlisted count', async () => {
      mockRepository.getWaitlistedCount.mockResolvedValue(5);

      const result = await service.getWaitlistedCount('1');

      expect(result).toBe(5);
      expect(mockRepository.getWaitlistedCount).toHaveBeenCalledWith('1');
    });
  });
});
