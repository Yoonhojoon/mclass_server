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

  beforeEach(() => {
    repository = new MClassRepository(mockPrisma);
    jest.clearAllMocks();
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
        recruitStartAt: new Date('2025-01-01'),
        recruitEndAt: new Date('2025-01-15'),
        startAt: new Date('2025-12-20'),
        endAt: new Date('2025-12-25'),
        selectionType: 'REVIEW' as const,
        capacity: 20,
        approvedCount: 10,
        allowWaitlist: true,
        waitlistCapacity: 5,
        visibility: 'UNLISTED' as const,
        isOnline: false,
        location: '서울시 강남구',
        fee: 50000,
        createdBy: 'admin-2',
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: {
          id: 'admin-2',
          name: 'Admin User 2',
          email: 'admin2@test.com',
        },
      },
    ];

    it('should find MClasses with basic filters', async () => {
      const query: MClassListQuery = {
        page: 1,
        size: 10,
        visibility: 'PUBLIC',
        sort: 'startAt',
        order: 'asc',
      };

      mockPrisma.mClass.findMany.mockResolvedValue(mockMClasses);
      mockPrisma.mClass.count.mockResolvedValue(2);

      const result = await repository.findWithFilters(query);

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.size).toBe(10);
      expect(result.totalPages).toBe(1);

      expect(mockPrisma.mClass.findMany).toHaveBeenCalledWith({
        where: { visibility: 'PUBLIC' },
        orderBy: { startAt: 'asc' },
        skip: 0,
        take: 10,
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

    it('should apply admin visibility filter', async () => {
      const query: MClassListQuery = {
        page: 1,
        size: 10,
        visibility: 'UNLISTED',
        sort: 'startAt',
        order: 'asc',
      };

      mockPrisma.mClass.findMany.mockResolvedValue(mockMClasses);
      mockPrisma.mClass.count.mockResolvedValue(2);

      await repository.findWithFilters(query, true);

      expect(mockPrisma.mClass.findMany).toHaveBeenCalledWith({
        where: { visibility: 'UNLISTED' },
        orderBy: { startAt: 'asc' },
        skip: 0,
        take: 10,
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

    it('should apply selectionType filter', async () => {
      const query: MClassListQuery = {
        page: 1,
        size: 10,
        visibility: 'PUBLIC',
        sort: 'startAt',
        order: 'asc',
        selectionType: 'FIRST_COME',
      };

      mockPrisma.mClass.findMany.mockResolvedValue([mockMClasses[0]]);
      mockPrisma.mClass.count.mockResolvedValue(1);

      await repository.findWithFilters(query);

      expect(mockPrisma.mClass.findMany).toHaveBeenCalledWith({
        where: {
          visibility: 'PUBLIC',
          selectionType: 'FIRST_COME',
        },
        orderBy: { startAt: 'asc' },
        skip: 0,
        take: 10,
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

    it('should handle pagination correctly', async () => {
      const query: MClassListQuery = {
        page: 2,
        size: 5,
        visibility: 'PUBLIC',
        sort: 'createdAt',
        order: 'desc',
      };

      mockPrisma.mClass.findMany.mockResolvedValue([]);
      mockPrisma.mClass.count.mockResolvedValue(10);

      const result = await repository.findWithFilters(query);

      expect(result.page).toBe(2);
      expect(result.size).toBe(5);
      expect(result.totalPages).toBe(2);

      expect(mockPrisma.mClass.findMany).toHaveBeenCalledWith({
        where: { visibility: 'PUBLIC' },
        orderBy: { createdAt: 'desc' },
        skip: 5,
        take: 5,
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

  describe('findById', () => {
    it('should find MClass by ID with creator info', async () => {
      const mockMClass = {
        id: '1',
        title: 'Test Class',
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

      const result = await repository.findById('1');

      expect(result).toEqual(mockMClass);
      expect(mockPrisma.mClass.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
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

      const result = await repository.findById('999');

      expect(result).toBeNull();
    });
  });

  describe('findByTitle', () => {
    it('should find MClass by title', async () => {
      const mockMClass = {
        id: '1',
        title: 'Test Class',
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

      const result = await repository.findByTitle('Test Class');

      expect(result).toEqual(mockMClass);
      expect(mockPrisma.mClass.findFirst).toHaveBeenCalledWith({
        where: { title: 'Test Class' },
      });
    });

    it('should return null when title not found', async () => {
      mockPrisma.mClass.findFirst.mockResolvedValue(null);

      const result = await repository.findByTitle('Non-existent Class');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create MClass successfully', async () => {
      const createData: CreateMClassRequest = {
        title: 'New Class',
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
        id: '1',
        title: 'New Class',
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
          title: 'New Class',
          description: 'New class description',
          selectionType: 'FIRST_COME',
          capacity: 15,
          allowWaitlist: true,
          waitlistCapacity: 5,
          visibility: 'PUBLIC',
          recruitStartAt: new Date('2025-11-01T00:00:00Z'),
          recruitEndAt: new Date('2025-12-15T23:59:59Z'),
          startAt: new Date('2025-12-20T10:00:00Z'),
          endAt: new Date('2025-12-20T12:00:00Z'),
          isOnline: true,
          location: null,
          fee: null,
          creator: {
            connect: { id: 'admin-1' },
          },
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

    it('should handle null optional fields', async () => {
      const createData: CreateMClassRequest = {
        title: 'Simple Class',
        recruitStartAt: '2025-12-19T10:00:00Z',
        recruitEndAt: '2025-12-19T12:00:00Z',
        startAt: '2025-12-20T10:00:00Z',
        endAt: '2025-12-20T12:00:00Z',
        selectionType: 'FIRST_COME',
        allowWaitlist: false,
        visibility: 'PUBLIC',
        isOnline: true,
      };

      const mockCreatedMClass = {
        id: '1',
        title: 'Simple Class',
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

      await repository.create(createData, 'admin-1');

      expect(mockPrisma.mClass.create).toHaveBeenCalledWith({
        data: {
          title: 'Simple Class',
          description: undefined,
          selectionType: 'FIRST_COME',
          capacity: undefined,
          allowWaitlist: false,
          waitlistCapacity: undefined,
          visibility: 'PUBLIC',
          recruitStartAt: new Date('2025-12-19T10:00:00Z'),
          recruitEndAt: new Date('2025-12-19T12:00:00Z'),
          startAt: new Date('2025-12-20T10:00:00Z'),
          endAt: new Date('2025-12-20T12:00:00Z'),
          isOnline: true,
          location: undefined,
          fee: undefined,
          creator: {
            connect: { id: 'admin-1' },
          },
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
        title: 'Updated Class',
        description: 'Updated description',
        capacity: 20,
        fee: 50000,
      };

      const mockUpdatedMClass = {
        id: '1',
        title: 'Updated Class',
        description: 'Updated description',
        recruitStartAt: new Date('2024-01-01'),
        recruitEndAt: new Date('2025-12-31'),
        startAt: new Date('2026-01-20'),
        endAt: new Date('2026-01-25'),
        selectionType: 'FIRST_COME' as const,
        capacity: 20,
        approvedCount: 5,
        allowWaitlist: false,
        waitlistCapacity: null,
        visibility: 'PUBLIC' as const,
        isOnline: true,
        location: null,
        fee: 50000,
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

      const result = await repository.update('1', updateData);

      expect(result).toEqual(mockUpdatedMClass);
      expect(mockPrisma.mClass.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          title: 'Updated Class',
          description: 'Updated description',
          capacity: 20,
          fee: 50000,
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

    it('should handle date string conversion', async () => {
      const updateData: UpdateMClassRequest = {
        recruitStartAt: '2025-11-01T00:00:00Z',
        recruitEndAt: '2025-12-15T23:59:59Z',
        startAt: '2025-12-20T10:00:00Z',
        endAt: '2025-12-25T18:00:00Z',
      };

      const mockUpdatedMClass = {
        id: '1',
        title: 'Test Class',
        description: null,
        recruitStartAt: new Date('2025-11-01'),
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

      await repository.update('1', updateData);

      expect(mockPrisma.mClass.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          recruitStartAt: new Date('2025-11-01T00:00:00Z'),
          recruitEndAt: new Date('2025-12-15T23:59:59Z'),
          startAt: new Date('2025-12-20T10:00:00Z'),
          endAt: new Date('2025-12-25T18:00:00Z'),
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

  describe('delete', () => {
    it('should delete MClass successfully', async () => {
      const mockDeletedMClass = {
        id: '1',
        title: 'Test Class',
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
        createdBy: 'admin-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.mClass.delete.mockResolvedValue(mockDeletedMClass);

      const result = await repository.delete('1');

      expect(result).toEqual(mockDeletedMClass);
      expect(mockPrisma.mClass.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('getApprovedCount', () => {
    it('should return approved enrollment count', async () => {
      mockPrisma.enrollment.count.mockResolvedValue(15);

      const result = await repository.getApprovedCount('1');

      expect(result).toBe(15);
      expect(mockPrisma.enrollment.count).toHaveBeenCalledWith({
        where: {
          mclassId: '1',
          status: 'APPROVED',
        },
      });
    });

    it('should return 0 when no approved enrollments', async () => {
      mockPrisma.enrollment.count.mockResolvedValue(0);

      const result = await repository.getApprovedCount('1');

      expect(result).toBe(0);
    });
  });

  describe('getWaitlistedCount', () => {
    it('should return waitlisted enrollment count', async () => {
      mockPrisma.enrollment.count.mockResolvedValue(5);

      const result = await repository.getWaitlistedCount('1');

      expect(result).toBe(5);
      expect(mockPrisma.enrollment.count).toHaveBeenCalledWith({
        where: {
          mclassId: '1',
          status: 'WAITLISTED',
        },
      });
    });

    it('should return 0 when no waitlisted enrollments', async () => {
      mockPrisma.enrollment.count.mockResolvedValue(0);

      const result = await repository.getWaitlistedCount('1');

      expect(result).toBe(0);
    });
  });
});
