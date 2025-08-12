import { Request, Response, NextFunction } from 'express';
import { MClassController } from '../../domains/mclass/mclass.controller.js';
import { MClassService } from '../../domains/mclass/mclass.service.js';
import { MClassError } from '../../common/exception/mclass/MClassError.js';
import { MClassSuccess } from '../../common/exception/mclass/MClassSuccess.js';
import { ZodError } from 'zod';

// Mock service
const mockService = {
  list: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getStatistics: jest.fn(),
} as unknown as jest.Mocked<MClassService>;

describe('MClassController', () => {
  let controller: MClassController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    controller = new MClassController(mockService);
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getMClasses', () => {
    beforeEach(() => {
      mockRequest = {
        query: {
          page: '1',
          size: '10',
          visibility: 'PUBLIC',
          sort: 'startAt',
          order: 'asc',
        },
        user: {
          userId: 'user-1',
          email: 'user@example.com',
          role: 'USER',
          isAdmin: false,
          signUpCompleted: true,
        },
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
    });

    it('should return MClass list successfully', async () => {
      const mockMClasses = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          title: 'Test Class 1',
          description: null,
          recruitStartAt: '2024-01-01T00:00:00.000Z',
          recruitEndAt: '2025-12-31T23:59:59.000Z',
          startAt: '2026-01-20T10:00:00.000Z',
          endAt: '2026-01-25T12:00:00.000Z',
          selectionType: 'FIRST_COME' as const,
          capacity: 10,
          approvedCount: 5,
          allowWaitlist: false,
          waitlistCapacity: null,
          visibility: 'PUBLIC' as const,
          isOnline: true,
          location: null,
          fee: null,
          createdBy: '550e8400-e29b-41d4-a716-446655440002',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          phase: 'RECRUITING' as const,
          creator: {
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'Admin',
            email: 'admin@test.com',
          },
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          title: 'Test Class 2',
          description: null,
          recruitStartAt: '2025-12-15T00:00:00.000Z',
          recruitEndAt: '2025-12-19T23:59:59.000Z',
          startAt: '2025-12-20T10:00:00.000Z',
          endAt: '2025-12-25T12:00:00.000Z',
          selectionType: 'FIRST_COME' as const,
          capacity: 10,
          approvedCount: 5,
          allowWaitlist: false,
          waitlistCapacity: null,
          visibility: 'PUBLIC' as const,
          isOnline: true,
          location: null,
          fee: null,
          createdBy: '550e8400-e29b-41d4-a716-446655440002',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          phase: 'UPCOMING' as const,
          creator: {
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'Admin',
            email: 'admin@test.com',
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

      mockService.list.mockResolvedValue(mockResult as any);

      await controller.getMClasses(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.list).toHaveBeenCalledWith(
        {
          page: 1,
          size: 10,
          visibility: 'PUBLIC',
          sort: 'startAt',
          order: 'asc',
        },
        false
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      mockRequest.query = {
        page: 'invalid',
        size: '10',
      };

      await controller.getMClasses(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(MClassError));
    });

    it('should pass admin flag when user is admin', async () => {
      mockRequest.user = {
        userId: 'admin-1',
        email: 'admin@example.com',
        role: 'ADMIN',
        isAdmin: true,
        signUpCompleted: true,
      };

      const mockResult = {
        items: [],
        total: 0,
        page: 1,
        size: 10,
        totalPages: 0,
      };

      mockService.list.mockResolvedValue(mockResult);

      await controller.getMClasses(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.list).toHaveBeenCalledWith(expect.any(Object), true);
    });
  });

  describe('getMClass', () => {
    beforeEach(() => {
      mockRequest = {
        params: { id: '1' },
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
    });

    it('should return single MClass successfully', async () => {
      const mockMClass = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Test Class',
        description: null,
        recruitStartAt: '2024-01-01T00:00:00.000Z',
        recruitEndAt: '2025-12-31T23:59:59.000Z',
        startAt: '2026-01-20T10:00:00.000Z',
        endAt: '2026-01-25T12:00:00.000Z',
        selectionType: 'FIRST_COME' as const,
        capacity: 10,
        approvedCount: 5,
        allowWaitlist: false,
        waitlistCapacity: null,
        visibility: 'PUBLIC' as const,
        isOnline: true,
        location: null,
        fee: null,
        createdBy: '550e8400-e29b-41d4-a716-446655440002',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        phase: 'RECRUITING' as const,
        creator: {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Admin',
          email: 'admin@test.com',
        },
      };

      mockService.getById.mockResolvedValue(mockMClass as any);

      await controller.getMClass(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.getById).toHaveBeenCalledWith('1');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle MClass not found error', async () => {
      mockService.getById.mockRejectedValue(MClassError.notFound('1'));

      await controller.getMClass(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(MClassError.notFound('1'));
    });
  });

  describe('createMClass', () => {
    beforeEach(() => {
      mockRequest = {
        body: {
          title: 'New Class',
          recruitStartAt: '2025-12-19T10:00:00Z',
          recruitEndAt: '2025-12-19T12:00:00Z',
          startAt: '2025-12-20T10:00:00Z',
          endAt: '2025-12-20T12:00:00Z',
          selectionType: 'FIRST_COME',
          allowWaitlist: false,
          visibility: 'PUBLIC',
          isOnline: true,
        },
        user: {
          userId: 'admin-1',
          email: 'admin@example.com',
          role: 'ADMIN',
          isAdmin: true,
          signUpCompleted: true,
        },
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
    });

    it('should create MClass successfully', async () => {
      const mockCreatedMClass = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'New Class',
        description: null,
        recruitStartAt: '2025-12-19T10:00:00.000Z',
        recruitEndAt: '2025-12-19T12:00:00.000Z',
        startAt: '2025-12-20T10:00:00.000Z',
        endAt: '2025-12-20T12:00:00.000Z',
        selectionType: 'FIRST_COME' as const,
        capacity: null,
        approvedCount: 0,
        allowWaitlist: false,
        waitlistCapacity: null,
        visibility: 'PUBLIC' as const,
        isOnline: true,
        location: null,
        fee: null,
        createdBy: '550e8400-e29b-41d4-a716-446655440002',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        phase: 'UPCOMING' as const,
        creator: {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Admin',
          email: 'admin@test.com',
        },
      };

      mockService.create.mockResolvedValue(mockCreatedMClass as any);

      await controller.createMClass(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.create).toHaveBeenCalledWith('admin-1', {
        title: 'New Class',
        recruitStartAt: '2025-12-19T10:00:00Z',
        recruitEndAt: '2025-12-19T12:00:00Z',
        startAt: '2025-12-20T10:00:00Z',
        endAt: '2025-12-20T12:00:00Z',
        selectionType: 'FIRST_COME',
        allowWaitlist: false,
        visibility: 'PUBLIC',
        isOnline: true,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject non-admin users', async () => {
      mockRequest.user = {
        userId: 'user-1',
        email: 'user@test.com',
        role: 'USER',
        isAdmin: false,
        signUpCompleted: true,
        provider: 'LOCAL',
      };

      await controller.createMClass(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(MClassError));
      expect(mockService.create).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      mockRequest.body = {
        title: '', // invalid title
        startAt: 'invalid-date',
      };

      await controller.createMClass(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(MClassError));
    });

    it('should handle service errors', async () => {
      // 유효한 데이터로 설정
      mockRequest.body = {
        title: 'New Class',
        recruitStartAt: '2025-12-19T10:00:00Z',
        recruitEndAt: '2025-12-19T12:00:00Z',
        startAt: '2025-12-20T10:00:00Z',
        endAt: '2025-12-20T12:00:00Z',
        selectionType: 'FIRST_COME',
        allowWaitlist: false,
        visibility: 'PUBLIC',
        isOnline: true,
      };

      mockService.create.mockRejectedValue(
        MClassError.duplicateTitle('New Class')
      );

      await controller.createMClass(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        MClassError.duplicateTitle('New Class')
      );
    });
  });

  describe('updateMClass', () => {
    beforeEach(() => {
      mockRequest = {
        params: { id: '1' },
        body: {
          title: 'Updated Class',
          description: 'Updated description',
        },
        user: {
          userId: 'admin-1',
          email: 'admin@test.com',
          role: 'ADMIN',
          isAdmin: true,
          signUpCompleted: true,
          provider: 'LOCAL',
        },
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
    });

    it('should update MClass successfully', async () => {
      const mockUpdatedMClass = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Updated Class',
        description: 'Updated description',
        recruitStartAt: '2025-12-15T00:00:00.000Z',
        recruitEndAt: '2025-12-19T23:59:59.000Z',
        startAt: '2025-12-20T10:00:00.000Z',
        endAt: '2025-12-25T12:00:00.000Z',
        selectionType: 'FIRST_COME' as const,
        capacity: 10,
        approvedCount: 5,
        allowWaitlist: false,
        waitlistCapacity: null,
        visibility: 'PUBLIC' as const,
        isOnline: true,
        location: null,
        fee: null,
        createdBy: '550e8400-e29b-41d4-a716-446655440002',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        phase: 'UPCOMING' as const,
        creator: {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Admin',
          email: 'admin@test.com',
        },
      };

      mockService.update.mockResolvedValue(mockUpdatedMClass as any);

      await controller.updateMClass(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.update).toHaveBeenCalledWith('1', {
        title: 'Updated Class',
        description: 'Updated description',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject non-admin users', async () => {
      mockRequest.user = {
        userId: 'user-1',
        email: 'user@test.com',
        role: 'USER',
        isAdmin: false,
        signUpCompleted: true,
        provider: 'LOCAL',
      };

      await controller.updateMClass(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(MClassError));
      expect(mockService.update).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      mockRequest.body = {
        title: '', // invalid title
      };

      await controller.updateMClass(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(MClassError));
    });

    it('should handle service errors', async () => {
      mockService.update.mockRejectedValue(MClassError.notFound('1'));

      await controller.updateMClass(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(MClassError.notFound('1'));
    });
  });

  describe('deleteMClass', () => {
    beforeEach(() => {
      mockRequest = {
        params: { id: '1' },
        user: {
          userId: 'admin-1',
          email: 'admin@test.com',
          role: 'ADMIN',
          isAdmin: true,
          signUpCompleted: true,
          provider: 'LOCAL',
        },
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
    });

    it('should delete MClass successfully', async () => {
      mockService.delete.mockResolvedValue(undefined);

      await controller.deleteMClass(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.delete).toHaveBeenCalledWith('1');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject non-admin users', async () => {
      mockRequest.user = {
        userId: 'user-1',
        email: 'user@test.com',
        role: 'USER',
        isAdmin: false,
        signUpCompleted: true,
        provider: 'LOCAL',
      };

      await controller.deleteMClass(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(MClassError));
      expect(mockService.delete).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockService.delete.mockRejectedValue(MClassError.notFound('1'));

      await controller.deleteMClass(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(MClassError.notFound('1'));
    });
  });

  describe('getMClassStatistics', () => {
    beforeEach(() => {
      mockRequest = {
        params: { id: '1' },
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
    });

    it('should return MClass statistics successfully', async () => {
      const mockStatistics = {
        approvedCount: 15,
        waitlistedCount: 5,
      };

      mockService.getStatistics.mockResolvedValue(mockStatistics);

      await controller.getMClassStatistics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.getStatistics).toHaveBeenCalledWith('1');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockService.getStatistics.mockRejectedValue(MClassError.notFound('1'));

      await controller.getMClassStatistics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(MClassError.notFound('1'));
    });
  });
});
