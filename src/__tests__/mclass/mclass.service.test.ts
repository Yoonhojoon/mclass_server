import { MClassService } from '../../domains/mclass/mclass.service.js';
import { MClassRepository } from '../../domains/mclass/mclass.repository.js';
import { MClassError } from '../../common/exception/mclass/MClassError.js';

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
  let testId: string;
  let uniqueTitle: string;

  beforeEach(() => {
    service = new MClassService(mockRepository);
    jest.clearAllMocks();

    // 각 테스트마다 고유한 ID와 제목 생성
    testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    uniqueTitle = `Test Class ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  });

  describe('calculatePhase', () => {
    it('should return UPCOMING when now < recruitStartAt', async () => {
      const mclass = {
        id: testId,
        title: uniqueTitle,
        description: null,
        recruitStartAt: new Date('2025-12-01'),
        recruitEndAt: new Date('2025-12-15'),
        startAt: new Date('2025-12-20'),
        endAt: new Date('2025-12-25'),
        selectionType: 'FIRST_COME' as const,
        capacity: 10,
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

      const result = await service['calculatePhase'](mclass);
      expect(result).toBe('UPCOMING');
    });

    it('should return RECRUITING when in recruitment period', async () => {
      const mclass = {
        id: testId,
        title: uniqueTitle,
        description: null,
        recruitStartAt: new Date('2024-01-01'),
        recruitEndAt: new Date('2025-12-31'),
        startAt: new Date('2026-01-20'),
        endAt: new Date('2026-01-25'),
        selectionType: 'FIRST_COME' as const,
        capacity: 10,
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

      mockRepository.getApprovedCount.mockResolvedValue(5);

      const result = await service['calculatePhase'](mclass);
      expect(result).toBe('RECRUITING');
    });

    it('should return IN_PROGRESS when now >= startAt and now < endAt', async () => {
      const now = new Date();
      const startAt = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1일 전
      const endAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1일 후

      const mclass = {
        id: testId,
        title: uniqueTitle,
        description: null,
        recruitStartAt: new Date(startAt.getTime() - 30 * 24 * 60 * 60 * 1000), // 30일 전
        recruitEndAt: new Date(startAt.getTime() - 1 * 24 * 60 * 60 * 1000), // 1일 전
        startAt: startAt,
        endAt: endAt,
        selectionType: 'FIRST_COME' as const,
        capacity: 10,
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

      const result = await service['calculatePhase'](mclass);
      expect(result).toBe('IN_PROGRESS');
    });

    it('should return ENDED when now >= endAt', async () => {
      const now = new Date();
      const startAt = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2일 전
      const endAt = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1일 전

      const mclass = {
        id: testId,
        title: uniqueTitle,
        description: null,
        recruitStartAt: new Date(startAt.getTime() - 30 * 24 * 60 * 60 * 1000), // 30일 전
        recruitEndAt: new Date(startAt.getTime() - 1 * 24 * 60 * 60 * 1000), // 1일 전
        startAt: startAt,
        endAt: endAt,
        selectionType: 'FIRST_COME' as const,
        capacity: 10,
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

      const result = await service['calculatePhase'](mclass);
      expect(result).toBe('ENDED');
    });
  });

  describe('getById', () => {
    it('should return MClass with phase when found', async () => {
      const mockMClass = {
        id: testId,
        title: uniqueTitle,
        description: null,
        recruitStartAt: new Date('2024-01-01'),
        recruitEndAt: new Date('2025-12-31'),
        startAt: new Date('2026-01-20'),
        endAt: new Date('2026-01-25'),
        selectionType: 'FIRST_COME' as const,
        capacity: 10,
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
      mockRepository.getApprovedCount.mockResolvedValue(5);

      const result = await service.getById(testId);

      expect(result).toHaveProperty('phase');
      expect(result.id).toBe(testId);
      expect(mockRepository.findById).toHaveBeenCalledWith(testId);
    });

    it('should throw error when MClass not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getById(testId)).rejects.toThrow(MClassError);
    });
  });

  describe('create', () => {
    it('should create MClass successfully', async () => {
      const createData = {
        title: uniqueTitle,
        recruitStartAt: '2025-12-19T10:00:00Z',
        recruitEndAt: '2025-12-19T12:00:00Z',
        startAt: '2025-12-20T10:00:00Z',
        endAt: '2025-12-20T12:00:00Z',
        selectionType: 'FIRST_COME' as const,
        allowWaitlist: false,
        visibility: 'PUBLIC' as const,
        isOnline: true,
      };

      const mockCreatedMClass = {
        id: testId,
        title: uniqueTitle,
        description: null,
        recruitStartAt: new Date('2025-12-19'),
        recruitEndAt: new Date('2025-12-19'),
        startAt: new Date('2025-12-20'),
        endAt: new Date('2025-12-20'),
        selectionType: 'FIRST_COME' as const,
        capacity: null,
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
        title: uniqueTitle,
        recruitStartAt: '2025-12-19T10:00:00Z',
        recruitEndAt: '2025-12-19T12:00:00Z',
        startAt: '2025-12-20T10:00:00Z',
        endAt: '2025-12-20T12:00:00Z',
        selectionType: 'FIRST_COME' as const,
        allowWaitlist: false,
        visibility: 'PUBLIC' as const,
        isOnline: true,
      };

      const existingMClass = {
        id: 'existing-id',
        title: uniqueTitle,
        description: null,
        recruitStartAt: new Date('2025-12-19'),
        recruitEndAt: new Date('2025-12-19'),
        startAt: new Date('2025-12-20'),
        endAt: new Date('2025-12-20'),
        selectionType: 'FIRST_COME' as const,
        capacity: null,
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

  describe('update', () => {
    it('should update MClass successfully', async () => {
      const updateData = {
        title: `Updated ${uniqueTitle}`,
        description: 'Updated description',
      };

      const existingMClass = {
        id: testId,
        title: uniqueTitle,
        description: null,
        recruitStartAt: new Date('2025-12-19'),
        recruitEndAt: new Date('2025-12-19'),
        startAt: new Date('2025-12-20'),
        endAt: new Date('2025-12-20'),
        selectionType: 'FIRST_COME' as const,
        capacity: null,
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

      const updatedMClass = {
        ...existingMClass,
        title: `Updated ${uniqueTitle}`,
        description: 'Updated description',
      };

      mockRepository.findById.mockResolvedValue(existingMClass);
      mockRepository.findByTitle.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue(updatedMClass);

      const result = await service.update(testId, updateData);

      expect(result).toHaveProperty('phase');
      expect(mockRepository.update).toHaveBeenCalledWith(testId, updateData);
    });

    it('should throw error when MClass not found', async () => {
      const updateData = {
        title: `Updated ${uniqueTitle}`,
      };

      mockRepository.findById.mockResolvedValue(null);

      await expect(service.update(testId, updateData)).rejects.toThrow(
        MClassError
      );
    });

    it('should throw error when title already exists', async () => {
      const updateData = {
        title: `Updated ${uniqueTitle}`,
      };

      const existingMClass = {
        id: testId,
        title: uniqueTitle,
        description: null,
        recruitStartAt: new Date('2025-12-19'),
        recruitEndAt: new Date('2025-12-19'),
        startAt: new Date('2025-12-20'),
        endAt: new Date('2025-12-20'),
        selectionType: 'FIRST_COME' as const,
        capacity: null,
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
        id: 'duplicate-id',
        title: `Updated ${uniqueTitle}`,
        description: null,
        recruitStartAt: new Date('2025-12-19'),
        recruitEndAt: new Date('2025-12-19'),
        startAt: new Date('2025-12-20'),
        endAt: new Date('2025-12-20'),
        selectionType: 'FIRST_COME' as const,
        capacity: null,
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

      await expect(service.update(testId, updateData)).rejects.toThrow(
        MClassError
      );
    });
  });

  describe('delete', () => {
    it('should delete MClass successfully', async () => {
      const existingMClass = {
        id: testId,
        title: uniqueTitle,
        description: null,
        recruitStartAt: new Date('2025-12-19'),
        recruitEndAt: new Date('2025-12-19'),
        startAt: new Date('2025-12-20'),
        endAt: new Date('2025-12-20'),
        selectionType: 'FIRST_COME' as const,
        capacity: null,
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

      await service.delete(testId);

      expect(mockRepository.delete).toHaveBeenCalledWith(testId);
    });

    it('should throw error when MClass not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.delete(testId)).rejects.toThrow(MClassError);
    });

    it('should throw error when MClass is in progress', async () => {
      const now = new Date();
      const startAt = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1일 전
      const endAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1일 후

      const existingMClass = {
        id: testId,
        title: uniqueTitle,
        description: null,
        recruitStartAt: new Date(startAt.getTime() - 30 * 24 * 60 * 60 * 1000), // 30일 전
        recruitEndAt: new Date(startAt.getTime() - 1 * 24 * 60 * 60 * 1000), // 1일 전
        startAt: startAt,
        endAt: endAt,
        selectionType: 'FIRST_COME' as const,
        capacity: null,
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

      await expect(service.delete(testId)).rejects.toThrow(MClassError);
    });
  });

  describe('getStatistics', () => {
    it('should return statistics successfully', async () => {
      mockRepository.getApprovedCount.mockResolvedValue(5);
      mockRepository.getWaitlistedCount.mockResolvedValue(2);

      const result = await service.getStatistics(testId);

      expect(result).toEqual({
        approvedCount: 5,
        waitlistedCount: 2,
      });
      expect(mockRepository.getApprovedCount).toHaveBeenCalledWith(testId);
      expect(mockRepository.getWaitlistedCount).toHaveBeenCalledWith(testId);
    });
  });
});
