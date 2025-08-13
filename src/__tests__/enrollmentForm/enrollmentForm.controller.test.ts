import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { EnrollmentFormController } from '../../domains/enrollmentForm/enrollmentForm.controller.js';

// Service 모킹
const mockService = {
  findByMClassId: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateByMClassId: jest.fn(),
  delete: jest.fn(),
  deleteByMClassId: jest.fn(),
} as any;

// Logger 모킹
jest.mock('../../config/logger.config.js', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('EnrollmentFormController', () => {
  let controller: EnrollmentFormController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    controller = new EnrollmentFormController(mockService);
    mockNext = jest.fn();
  });

  describe('getEnrollmentForm', () => {
    beforeEach(() => {
      mockRequest = {
        params: { id: 'mclass-1' },
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as any;
    });

    it('MClass ID로 지원서 양식을 성공적으로 조회한다', async () => {
      const mockForm = {
        id: 'form-1',
        mclassId: 'mclass-1',
        title: '테스트 지원서',
        description: '테스트 설명',
        questions: [
          {
            id: 'q1',
            type: 'text',
            label: '이름',
            required: true,
          },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockService.findByMClassId.mockResolvedValue(mockForm);

      await controller.getEnrollmentForm(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.findByMClassId).toHaveBeenCalledWith('mclass-1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockForm,
        })
      );
    });

    it('서비스 에러 시 next 함수를 호출한다', async () => {
      const error = new Error('서비스 에러');
      mockService.findByMClassId.mockRejectedValue(error);

      await controller.getEnrollmentForm(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('createEnrollmentForm', () => {
    beforeEach(() => {
      mockRequest = {
        params: { id: 'mclass-1' },
        body: {
          title: '새 지원서',
          description: '새 설명',
          questions: [
            {
              id: 'q1',
              type: 'text',
              label: '이름',
              required: true,
            },
          ],
          isActive: true,
        },
        user: {
          userId: 'user-1',
          email: 'admin@example.com',
          role: 'ADMIN',
          isAdmin: true,
          signUpCompleted: true,
        },
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as any;
    });

    it('관리자 권한으로 지원서 양식을 성공적으로 생성한다', async () => {
      const mockForm = {
        id: 'form-1',
        mclassId: 'mclass-1',
        title: '새 지원서',
        description: '새 설명',
        questions: [
          {
            id: 'q1',
            type: 'text',
            label: '이름',
            required: true,
          },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockService.create.mockResolvedValue(mockForm);

      await controller.createEnrollmentForm(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.create).toHaveBeenCalledWith(
        'mclass-1',
        mockRequest.body
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockForm,
        })
      );
    });

    it('관리자가 아닌 사용자는 Forbidden 에러를 받는다', async () => {
      mockRequest.user = {
        userId: 'user-1',
        email: 'user@example.com',
        role: 'USER',
        isAdmin: false,
        signUpCompleted: true,
      };

      await controller.createEnrollmentForm(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
        })
      );
    });

    it('서비스 에러 시 next 함수를 호출한다', async () => {
      const error = new Error('서비스 에러');
      mockService.create.mockRejectedValue(error);

      await controller.createEnrollmentForm(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateEnrollmentForm', () => {
    beforeEach(() => {
      mockRequest = {
        params: { id: 'mclass-1' },
        body: {
          title: '수정된 제목',
          description: '수정된 설명',
        },
        user: {
          userId: 'user-1',
          email: 'admin@example.com',
          role: 'ADMIN',
          isAdmin: true,
          signUpCompleted: true,
        },
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as any;
    });

    it('관리자 권한으로 지원서 양식을 성공적으로 수정한다', async () => {
      const updatedForm = {
        id: 'form-1',
        mclassId: 'mclass-1',
        title: '수정된 제목',
        description: '수정된 설명',
        questions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockService.updateByMClassId.mockResolvedValue(updatedForm);

      await controller.updateEnrollmentForm(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.updateByMClassId).toHaveBeenCalledWith(
        'mclass-1',
        mockRequest.body
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: updatedForm,
        })
      );
    });

    it('관리자가 아닌 사용자는 Forbidden 에러를 받는다', async () => {
      mockRequest.user = {
        userId: 'user-1',
        email: 'user@example.com',
        role: 'USER',
        isAdmin: false,
        signUpCompleted: true,
      };

      await controller.updateEnrollmentForm(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
        })
      );
    });

    it('서비스 에러 시 next 함수를 호출한다', async () => {
      const error = new Error('서비스 에러');
      mockService.updateByMClassId.mockRejectedValue(error);

      await controller.updateEnrollmentForm(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteEnrollmentForm', () => {
    beforeEach(() => {
      mockRequest = {
        params: { id: 'mclass-1' },
        user: {
          userId: 'user-1',
          email: 'admin@example.com',
          role: 'ADMIN',
          isAdmin: true,
          signUpCompleted: true,
        },
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as any;
    });

    it('관리자 권한으로 지원서 양식을 성공적으로 삭제한다', async () => {
      mockService.deleteByMClassId.mockResolvedValue(undefined);

      await controller.deleteEnrollmentForm(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.deleteByMClassId).toHaveBeenCalledWith('mclass-1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('삭제되었습니다'),
        })
      );
    });

    it('관리자가 아닌 사용자는 Forbidden 에러를 받는다', async () => {
      mockRequest.user = {
        userId: 'user-1',
        email: 'user@example.com',
        role: 'USER',
        isAdmin: false,
        signUpCompleted: true,
      };

      await controller.deleteEnrollmentForm(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
        })
      );
    });

    it('서비스 에러 시 next 함수를 호출한다', async () => {
      const error = new Error('서비스 에러');
      mockService.deleteByMClassId.mockRejectedValue(error);

      await controller.deleteEnrollmentForm(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
