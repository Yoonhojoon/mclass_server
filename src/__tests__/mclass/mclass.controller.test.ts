import { Request, Response, NextFunction } from 'express';
import { MClassController } from '../../domains/mclass/mclass.controller.js';
import {
  MClassService,
  MClassPhase,
} from '../../domains/mclass/mclass.service.js';
import { MClassError } from '../../common/exception/mclass/MClassError.js';

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
  let testId: string;
  let uniqueTitle: string;

  beforeEach(() => {
    controller = new MClassController(mockService);
    mockNext = jest.fn();
    jest.clearAllMocks();

    // 각 테스트마다 고유한 ID와 제목 생성
    testId = `123e4567-e89b-12d3-a456-426614174000`;
    uniqueTitle = `Test Class ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Mock response 설정
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
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
          email: 'user@test.com',
          role: 'USER',
          isAdmin: false,
          signUpCompleted: true,
          provider: 'LOCAL',
        },
      };
    });

    it('should return MClass list successfully', async () => {
      const mockResult = {
        items: [
          {
            id: testId,
            title: uniqueTitle,
            description: 'Test description',
            selectionType: 'FIRST_COME',
            capacity: 10,
            allowWaitlist: false,
            waitlistCapacity: null,
            visibility: 'PUBLIC',
            recruitStartAt: '2024-01-01T00:00:00.000Z',
            recruitEndAt: '2025-12-31T23:59:59.000Z',
            startAt: '2025-12-20T10:00:00Z',
            endAt: '2025-12-20T12:00:00Z',
            isOnline: true,
            location: null,
            fee: null,
            createdBy: '123e4567-e89b-12d3-a456-426614174001',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            phase: 'RECRUITING' as MClassPhase,
            creator: {
              id: '123e4567-e89b-12d3-a456-426614174001',
              name: 'Admin User',
              email: 'admin@test.com',
            },
          },
        ],
        total: 1,
        page: 1,
        size: 10,
        totalPages: 1,
      };

      mockService.list.mockResolvedValue(mockResult);

      await controller.getMClasses(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // mockNext가 호출되었는지 확인
      if ((mockNext as jest.Mock).mock.calls.length > 0) {
        console.error(
          'mockNext was called with:',
          (mockNext as jest.Mock).mock.calls[0][0]
        );
      }

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
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        code: 'MCLASS_LIST_RETRIEVED',
        message: 'MClass 목록을 성공적으로 조회했습니다',
        data: mockResult.items,
        meta: {
          page: 1,
          size: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('should handle admin user correctly', async () => {
      mockRequest.user = {
        userId: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
        isAdmin: true,
        signUpCompleted: true,
        provider: 'LOCAL',
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

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockService.list.mockRejectedValue(error);

      await controller.getMClasses(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getMClass', () => {
    beforeEach(() => {
      mockRequest = {
        params: { id: testId },
        user: {
          userId: 'user-1',
          email: 'user@test.com',
          role: 'USER',
          isAdmin: false,
          signUpCompleted: true,
          provider: 'LOCAL',
        },
      };
    });

    it('should return MClass by ID successfully', async () => {
      const mockMClass = {
        id: testId,
        title: uniqueTitle,
        description: 'Test description',
        selectionType: 'FIRST_COME',
        capacity: 10,
        allowWaitlist: false,
        waitlistCapacity: null,
        visibility: 'PUBLIC',
        recruitStartAt: '2024-01-01T00:00:00.000Z',
        recruitEndAt: '2025-12-31T23:59:59.000Z',
        startAt: '2025-12-20T10:00:00Z',
        endAt: '2025-12-20T12:00:00Z',
        isOnline: true,
        location: null,
        fee: null,
        createdBy: '123e4567-e89b-12d3-a456-426614174001',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        phase: 'RECRUITING' as MClassPhase,
        creator: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Admin User',
          email: 'admin@test.com',
        },
      };

      mockService.getById.mockResolvedValue(mockMClass);

      await controller.getMClass(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.getById).toHaveBeenCalledWith(testId);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        code: 'MCLASS_RETRIEVED',
        message: 'MClass를 성공적으로 조회했습니다',
        data: mockMClass,
      });
    });

    it('should handle MClass not found', async () => {
      mockService.getById.mockRejectedValue(MClassError.notFound(testId));

      await controller.getMClass(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(MClassError.notFound(testId));
    });
  });

  describe('createMClass', () => {
    beforeEach(() => {
      mockRequest = {
        body: {
          title: uniqueTitle,
          description: 'Test description',
          startAt: '2025-12-20T10:00:00Z',
          endAt: '2025-12-20T12:00:00Z',
          selectionType: 'FIRST_COME',
          visibility: 'PUBLIC',
          isOnline: true,
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
    });

    it('should create MClass successfully', async () => {
      const mockCreatedMClass = {
        id: testId,
        title: uniqueTitle,
        description: 'Test description',
        selectionType: 'FIRST_COME',
        capacity: null,
        allowWaitlist: false,
        waitlistCapacity: null,
        visibility: 'PUBLIC',
        recruitStartAt: null,
        recruitEndAt: null,
        startAt: '2025-12-20T10:00:00Z',
        endAt: '2025-12-20T12:00:00Z',
        isOnline: true,
        location: null,
        fee: null,
        createdBy: '123e4567-e89b-12d3-a456-426614174001',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        phase: 'UPCOMING' as MClassPhase,
        creator: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Admin User',
          email: 'admin@test.com',
        },
      };

      mockService.create.mockResolvedValue(mockCreatedMClass);

      await controller.createMClass(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.create).toHaveBeenCalledWith(
        'admin-1',
        mockRequest.body
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        code: 'MCLASS_CREATED',
        message: 'MClass가 성공적으로 생성되었습니다',
        data: mockCreatedMClass,
        meta: { id: testId },
      });
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

    it('should handle service errors', async () => {
      const error = MClassError.duplicateTitle(uniqueTitle);
      mockService.create.mockRejectedValue(error);

      await controller.createMClass(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateMClass', () => {
    beforeEach(() => {
      mockRequest = {
        params: { id: testId },
        body: {
          title: `Updated ${uniqueTitle}`,
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
    });

    it('should update MClass successfully', async () => {
      const mockUpdatedMClass = {
        id: testId,
        title: `Updated ${uniqueTitle}`,
        description: 'Updated description',
        selectionType: 'FIRST_COME',
        capacity: null,
        allowWaitlist: false,
        waitlistCapacity: null,
        visibility: 'PUBLIC',
        recruitStartAt: null,
        recruitEndAt: null,
        startAt: '2025-12-20T10:00:00Z',
        endAt: '2025-12-20T12:00:00Z',
        isOnline: true,
        location: null,
        fee: null,
        createdBy: '123e4567-e89b-12d3-a456-426614174001',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        phase: 'UPCOMING' as MClassPhase,
        creator: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Admin User',
          email: 'admin@test.com',
        },
      };

      mockService.update.mockResolvedValue(mockUpdatedMClass);

      await controller.updateMClass(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.update).toHaveBeenCalledWith(testId, mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        code: 'MCLASS_UPDATED',
        message: 'MClass가 성공적으로 수정되었습니다',
        data: mockUpdatedMClass,
        meta: { id: testId },
      });
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

    it('should handle service errors', async () => {
      const error = MClassError.notFound(testId);
      mockService.update.mockRejectedValue(error);

      await controller.updateMClass(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteMClass', () => {
    beforeEach(() => {
      mockRequest = {
        params: { id: testId },
        user: {
          userId: 'admin-1',
          email: 'admin@test.com',
          role: 'ADMIN',
          isAdmin: true,
          signUpCompleted: true,
          provider: 'LOCAL',
        },
      };
    });

    it('should delete MClass successfully', async () => {
      mockService.delete.mockResolvedValue(undefined);

      await controller.deleteMClass(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.delete).toHaveBeenCalledWith(testId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        code: 'MCLASS_DELETED',
        message: 'MClass가 성공적으로 삭제되었습니다',
        data: undefined,
        meta: { id: testId },
      });
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
      const error = MClassError.notFound(testId);
      mockService.delete.mockRejectedValue(error);

      await controller.deleteMClass(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getMClassStatistics', () => {
    beforeEach(() => {
      mockRequest = {
        params: { id: testId },
        user: {
          userId: 'admin-1',
          email: 'admin@test.com',
          role: 'ADMIN',
          isAdmin: true,
          signUpCompleted: true,
          provider: 'LOCAL',
        },
      };
    });

    it('should return MClass statistics successfully', async () => {
      const mockStatistics = {
        approvedCount: 5,
        waitlistedCount: 2,
      };

      mockService.getStatistics.mockResolvedValue(mockStatistics);

      await controller.getMClassStatistics(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.getStatistics).toHaveBeenCalledWith(testId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        code: 'MCLASS_RETRIEVED',
        message: 'MClass를 성공적으로 조회했습니다',
        data: mockStatistics,
      });
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

      await controller.getMClassStatistics(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(MClassError));
      expect(mockService.getStatistics).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const error = MClassError.notFound(testId);
      mockService.getStatistics.mockRejectedValue(error);

      await controller.getMClassStatistics(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
