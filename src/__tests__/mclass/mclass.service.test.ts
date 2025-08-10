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
        recruitStartAt: null,
        recruitEndAt: null,
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
        startAt: '2025-12-20T10:00:00Z',
        endAt: '2025-12-20T12:00:00Z',
        selectionType: 'FIRST_COME' as const,
        allowWaitlist: false,
        visibility: 'PUBLIC' as const,
        isOnline: true,
      };

      const mockCreatedMClass = {
        id: '1',
        title: 'New Class',
        description: null,
        recruitStartAt: null,
        recruitEndAt: null,
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
        startAt: '2025-12-20T10:00:00Z',
        endAt: '2025-12-20T12:00:00Z',
        selectionType: 'FIRST_COME' as const,
        allowWaitlist: false,
        visibility: 'PUBLIC' as const,
        isOnline: true,
      };

      const existingMClass = {
        id: '1',
        title: 'Existing Class',
        description: null,
        recruitStartAt: null,
        recruitEndAt: null,
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
});
