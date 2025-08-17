import { MClassRepository } from '../../domains/mclass/mclass.repository.js';
import { CreateMClassRequest } from '../../schemas/mclass/index.js';
import {
  MClassListQuery,
  UpdateMClassRequest,
} from '../../schemas/mclass/index.js';

// Mock Prisma client
const mockPrisma = {
  mClass: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  enrollment: {
    count: jest.fn(),
  },
} as any;

describe('MClassRepository', () => {
  let repository: MClassRepository;
  let testId: string;
  let uniqueTitle: string;

  beforeEach(() => {
    repository = new MClassRepository(mockPrisma);
    jest.clearAllMocks();

    // 각 테스트마다 고유한 ID와 제목 생성
    testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    uniqueTitle = `Test Class ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  });

  describe('findWithFilters', () => {
    const mockMClasses = [
      {
        id: '1',
        title: 'Test Class 1',
        description: 'Test description 1',
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
        createdBy: 'admin-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: {
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@test.com',
        },
      },
      {
        id: '2',
        title: 'Test Class 2',
        description: 'Test description 2',
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
        createdBy: 'admin-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: {
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@test.com',
        },
      },
    ];

    it('should find MClasses with filters', async () => {
      const query: MClassListQuery = {
        page: 1,
        size: 10,
        visibility: 'PUBLIC',
        sort: 'startAt',
        order: 'asc',
      };

      mockPrisma.mClass.findMany.mockResolvedValue(mockMClasses);
      mockPrisma.mClass.count.mockResolvedValue(2);

      const result = await repository.findWithFilters(query, false);

      expect(result.items).toEqual(mockMClasses);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.size).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should handle empty results', async () => {
      const query: MClassListQuery = {
        page: 1,
        size: 10,
        visibility: 'PUBLIC',
        sort: 'startAt',
        order: 'asc',
      };

      mockPrisma.mClass.findMany.mockResolvedValue([]);
      mockPrisma.mClass.count.mockResolvedValue(0);

      const result = await repository.findWithFilters(query, false);

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.size).toBe(10);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('findById', () => {
    it('should find MClass by ID', async () => {
      const mockMClass = {
        id: testId,
        title: uniqueTitle,
        description: 'Test description',
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
        createdBy: 'admin-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: {
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@test.com',
        },
      };

      mockPrisma.mClass.findUnique.mockResolvedValue(mockMClass);

      const result = await repository.findById(testId);

      expect(result).toEqual(mockMClass);
      expect(mockPrisma.mClass.findUnique).toHaveBeenCalledWith({
        where: { id: testId },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    it('should return null when MClass not found', async () => {
      mockPrisma.mClass.findUnique.mockResolvedValue(null);

      const result = await repository.findById(testId);

      expect(result).toBeNull();
    });
  });

  describe('findByTitle', () => {
    it('should find MClass by title', async () => {
      const mockMClass = {
        id: testId,
        title: uniqueTitle,
        description: 'Test description',
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
        createdBy: 'admin-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.mClass.findFirst.mockResolvedValue(mockMClass);

      const result = await repository.findByTitle(uniqueTitle);

      expect(result).toEqual(mockMClass);
      expect(mockPrisma.mClass.findFirst).toHaveBeenCalledWith({
        where: { title: uniqueTitle },
      });
    });

    it('should return null when MClass not found by title', async () => {
      mockPrisma.mClass.findFirst.mockResolvedValue(null);

      const result = await repository.findByTitle(uniqueTitle);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create MClass successfully', async () => {
      const createData: CreateMClassRequest = {
        title: uniqueTitle,
        description: 'New class description',
        startAt: '2025-12-20T10:00:00Z',
        endAt: '2025-12-20T12:00:00Z',
        selectionType: 'FIRST_COME',
        capacity: 15,
        allowWaitlist: true,
        waitlistCapacity: 5,
        visibility: 'PUBLIC',
        recruitStartAt: '2025-11-01T00:00:00Z',
        recruitEndAt: '2025-12-15T23:59:59Z',
        isOnline: true,
        location: null,
        fee: null,
      };

      const mockCreatedMClass = {
        id: testId,
        title: uniqueTitle,
        description: 'New class description',
        recruitStartAt: new Date('2025-11-01'),
        recruitEndAt: new Date('2025-12-15'),
        startAt: new Date('2025-12-20'),
        endAt: new Date('2025-12-20'),
        selectionType: 'FIRST_COME' as const,
        capacity: 15,
        approvedCount: 0,
        allowWaitlist: true,
        waitlistCapacity: 5,
        visibility: 'PUBLIC' as const,
        isOnline: true,
        location: null,
        fee: null,
        createdBy: 'admin-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: {
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@test.com',
        },
      };

      mockPrisma.mClass.create.mockResolvedValue(mockCreatedMClass);

      const result = await repository.create(createData, 'admin-1');

      expect(result).toEqual(mockCreatedMClass);
      expect(mockPrisma.mClass.create).toHaveBeenCalledWith({
        data: {
          ...createData,
          creator: {
            connect: { id: 'admin-1' },
          },
          recruitStartAt: new Date(createData.recruitStartAt!),
          recruitEndAt: new Date(createData.recruitEndAt!),
          startAt: new Date(createData.startAt),
          endAt: new Date(createData.endAt),
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });
  });

  describe('update', () => {
    it('should update MClass successfully', async () => {
      const updateData: UpdateMClassRequest = {
        title: `Updated ${uniqueTitle}`,
        description: 'Updated description',
      };

      const mockUpdatedMClass = {
        id: testId,
        title: `Updated ${uniqueTitle}`,
        description: 'Updated description',
        recruitStartAt: new Date('2025-11-01'),
        recruitEndAt: new Date('2025-12-15'),
        startAt: new Date('2025-12-20'),
        endAt: new Date('2025-12-20'),
        selectionType: 'FIRST_COME' as const,
        capacity: 15,
        approvedCount: 0,
        allowWaitlist: true,
        waitlistCapacity: 5,
        visibility: 'PUBLIC' as const,
        isOnline: true,
        location: null,
        fee: null,
        createdBy: 'admin-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: {
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@test.com',
        },
      };

      mockPrisma.mClass.update.mockResolvedValue(mockUpdatedMClass);

      const result = await repository.update(testId, updateData);

      expect(result).toEqual(mockUpdatedMClass);
      expect(mockPrisma.mClass.update).toHaveBeenCalledWith({
        where: { id: testId },
        data: updateData,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });
  });

  describe('delete', () => {
    it('should delete MClass successfully', async () => {
      const mockDeletedMClass = {
        id: testId,
        title: uniqueTitle,
        description: 'Test description',
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
        createdBy: 'admin-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: {
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@test.com',
        },
      };

      mockPrisma.mClass.delete.mockResolvedValue(mockDeletedMClass);

      const result = await repository.delete(testId);

      expect(result).toEqual(mockDeletedMClass);
      expect(mockPrisma.mClass.delete).toHaveBeenCalledWith({
        where: { id: testId },
      });
    });
  });

  describe('getApprovedCount', () => {
    it('should return approved count', async () => {
      mockPrisma.enrollment.count.mockResolvedValue(5);

      const result = await repository.getApprovedCount(testId);

      expect(result).toBe(5);
      expect(mockPrisma.enrollment.count).toHaveBeenCalledWith({
        where: {
          mclassId: testId,
          status: 'APPROVED',
        },
      });
    });
  });

  describe('getWaitlistedCount', () => {
    it('should return waitlisted count', async () => {
      mockPrisma.enrollment.count.mockResolvedValue(3);

      const result = await repository.getWaitlistedCount(testId);

      expect(result).toBe(3);
      expect(mockPrisma.enrollment.count).toHaveBeenCalledWith({
        where: {
          mclassId: testId,
          status: 'WAITLISTED',
        },
      });
    });
  });
});
