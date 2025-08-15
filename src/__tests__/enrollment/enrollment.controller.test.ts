import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { EnrollmentController } from '../../domains/enrollment/enrollment.controller.js';
import { EnrollmentStatus } from '@prisma/client';

// Service 모킹
const mockService = {
  enrollToClass: jest.fn(),
  getMyEnrollments: jest.fn(),
  getMyEnrollment: jest.fn(),
  cancelEnrollment: jest.fn(),
  updateEnrollment: jest.fn(),
  getEnrollmentsByMclass: jest.fn(),
  updateEnrollmentStatus: jest.fn(),
  getEnrollmentStats: jest.fn(),
  getWaitlist: jest.fn(),
  approveWaitlist: jest.fn(),
  checkAvailability: jest.fn(),
} as any;

// Logger 모킹
jest.mock('../../config/logger.config.js', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('EnrollmentController', () => {
  let controller: EnrollmentController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    controller = new EnrollmentController(mockService);
    mockNext = jest.fn();
  });

  describe('enrollToClass', () => {
    beforeEach(() => {
      mockRequest = {
        params: { mclassId: 'mclass-1' },
        body: {
          answers: {
            q1_name: '홍길동',
            q2_email: 'hong@example.com',
            q3_phone: '010-1234-5678',
            q4_birth: '1990-01-01',
            q5_motivation: '새로운 기술을 배우고 싶습니다.',
            q6_experience: ['javascript', 'react'],
            q7_agree: true,
            q8_level: 'intermediate',
          },
          idempotencyKey: 'test-key-123',
        },
        user: {
          userId: 'user-1',
          email: 'test@example.com',
          role: 'USER',
          isAdmin: false,
          signUpCompleted: true,
        },
        headers: {},
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as any;
    });

    it('클래스 신청을 성공적으로 처리한다', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: 'user-1',
        mclassId: 'mclass-1',
        status: EnrollmentStatus.APPLIED,
        answers: mockRequest.body.answers,
        appliedAt: new Date(),
      };

      mockService.enrollToClass.mockResolvedValue(mockEnrollment);

      await controller.enrollToClass(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.enrollToClass).toHaveBeenCalledWith(
        'mclass-1',
        mockRequest.body,
        'user-1'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(
            '클래스 신청이 성공적으로 완료되었습니다'
          ),
          data: mockEnrollment,
          statusCode: 201,
          successCode: 'ENROLLMENT_SUCCESS',
        })
      );
    });

    it('헤더의 멱등성 키를 사용한다', async () => {
      mockRequest.headers = { 'idempotency-key': 'header-key-456' };
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: 'user-1',
        mclassId: 'mclass-1',
        status: EnrollmentStatus.APPLIED,
      };

      mockService.enrollToClass.mockResolvedValue(mockEnrollment);

      await controller.enrollToClass(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.enrollToClass).toHaveBeenCalledWith(
        'mclass-1',
        expect.objectContaining({
          idempotencyKey: 'header-key-456',
        }),
        'user-1'
      );
    });

    it('로그인이 필요한 경우 에러를 던진다', async () => {
      mockRequest.user = undefined;

      await expect(
        controller.enrollToClass(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('로그인이 필요합니다.');
    });
  });

  describe('getMyEnrollments', () => {
    beforeEach(() => {
      mockRequest = {
        query: {
          status: 'APPLIED',
          page: '1',
          limit: '10',
        },
        user: {
          userId: 'user-1',
          email: 'test@example.com',
          role: 'USER',
          isAdmin: false,
          signUpCompleted: true,
        },
      };
      mockResponse = {
        json: jest.fn().mockReturnThis(),
      } as any;
    });

    it('내 신청 목록을 성공적으로 조회한다', async () => {
      const mockEnrollments = [
        {
          id: 'enrollment-1',
          userId: 'user-1',
          mclassId: 'mclass-1',
          status: EnrollmentStatus.APPLIED,
          mclass: { id: 'mclass-1', title: '클래스 1' },
          enrollmentForm: { id: 'form-1', title: '신청서 1' },
        },
      ];

      const mockResult = {
        enrollments: mockEnrollments,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockService.getMyEnrollments.mockResolvedValue(mockResult);

      await controller.getMyEnrollments(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getMyEnrollments).toHaveBeenCalledWith('user-1', {
        status: 'APPLIED',
        page: 1,
        limit: 10,
      });
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(
            '신청 내역을 성공적으로 조회했습니다'
          ),
          data: mockEnrollments,
          statusCode: 200,
          successCode: 'ENROLLMENT_LIST_GET_SUCCESS',
        })
      );
    });

    it('로그인이 필요한 경우 에러를 던진다', async () => {
      mockRequest.user = undefined;

      await expect(
        controller.getMyEnrollments(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('로그인이 필요합니다.');
    });
  });

  describe('getMyEnrollmentById', () => {
    beforeEach(() => {
      mockRequest = {
        params: { enrollmentId: 'enrollment-1' },
        user: {
          userId: 'user-1',
          email: 'test@example.com',
          role: 'USER',
          isAdmin: false,
          signUpCompleted: true,
        },
      };
      mockResponse = {
        json: jest.fn().mockReturnThis(),
      } as any;
    });

    it('내 특정 신청을 성공적으로 조회한다', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: 'user-1',
        mclassId: 'mclass-1',
        status: EnrollmentStatus.APPLIED,
        mclass: { id: 'mclass-1', title: '클래스 1' },
        enrollmentForm: { id: 'form-1', title: '신청서 1' },
      };

      mockService.getMyEnrollment.mockResolvedValue(mockEnrollment);

      await controller.getMyEnrollment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getMyEnrollment).toHaveBeenCalledWith(
        'enrollment-1',
        'user-1'
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(
            '신청 상세 정보를 성공적으로 조회했습니다'
          ),
          data: mockEnrollment,
          statusCode: 200,
          successCode: 'ENROLLMENT_DETAILS_GET_SUCCESS',
        })
      );
    });

    it('로그인이 필요한 경우 에러를 던진다', async () => {
      mockRequest.user = undefined;

      await expect(
        controller.getMyEnrollment(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('로그인이 필요합니다.');
    });
  });

  describe('cancelEnrollment', () => {
    beforeEach(() => {
      mockRequest = {
        params: { enrollmentId: 'enrollment-1' },
        body: { reason: '개인 사정으로 취소합니다.' },
        user: {
          userId: 'user-1',
          email: 'test@example.com',
          role: 'USER',
          isAdmin: false,
          signUpCompleted: true,
        },
      };
      mockResponse = {
        json: jest.fn().mockReturnThis(),
      } as any;
    });

    it('신청을 성공적으로 취소한다', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: 'user-1',
        mclassId: 'mclass-1',
        status: EnrollmentStatus.CANCELED,
        canceledAt: new Date(),
        reason: '개인 사정으로 취소합니다.',
      };

      mockService.cancelEnrollment.mockResolvedValue(mockEnrollment);

      await controller.cancelEnrollment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.cancelEnrollment).toHaveBeenCalledWith(
        'enrollment-1',
        'user-1',
        { reason: '개인 사정으로 취소합니다.' }
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(
            '클래스 신청이 성공적으로 취소되었습니다'
          ),
          data: null,
          statusCode: 200,
          successCode: 'ENROLLMENT_CANCELLATION_SUCCESS',
        })
      );
    });

    it('로그인이 필요한 경우 에러를 던진다', async () => {
      mockRequest.user = undefined;

      await expect(
        controller.cancelEnrollment(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('로그인이 필요합니다.');
    });
  });

  describe('updateEnrollment', () => {
    beforeEach(() => {
      mockRequest = {
        params: { enrollmentId: 'enrollment-1' },
        body: {
          answers: {
            q1_name: '수정된 이름',
            q2_email: 'modified@example.com',
          },
        },
        user: {
          userId: 'user-1',
          email: 'test@example.com',
          role: 'USER',
          isAdmin: false,
          signUpCompleted: true,
        },
      };
      mockResponse = {
        json: jest.fn().mockReturnThis(),
      } as any;
    });

    it('신청 답변을 성공적으로 수정한다', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: 'user-1',
        mclassId: 'mclass-1',
        status: EnrollmentStatus.APPLIED,
        answers: {
          q1_name: '수정된 이름',
          q2_email: 'modified@example.com',
        },
        updatedAt: new Date(),
      };

      mockService.updateEnrollment.mockResolvedValue(mockEnrollment);

      await controller.updateEnrollment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.updateEnrollment).toHaveBeenCalledWith(
        'enrollment-1',
        {
          answers: { q1_name: '수정된 이름', q2_email: 'modified@example.com' },
        },
        'user-1'
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(
            '신청 정보가 성공적으로 업데이트되었습니다'
          ),
          data: mockEnrollment,
          statusCode: 200,
          successCode: 'ENROLLMENT_UPDATE_SUCCESS',
        })
      );
    });

    it('로그인이 필요한 경우 에러를 던진다', async () => {
      mockRequest.user = undefined;

      await expect(
        controller.updateEnrollment(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('로그인이 필요합니다.');
    });
  });

  describe('getEnrollmentsByMclass', () => {
    beforeEach(() => {
      mockRequest = {
        params: { mclassId: 'mclass-1' },
        query: {
          status: 'APPLIED',
          page: '1',
          limit: '10',
          search: '홍길동',
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
        json: jest.fn().mockReturnThis(),
      } as any;
    });

    it('클래스별 신청 목록을 성공적으로 조회한다', async () => {
      const mockEnrollments = [
        {
          id: 'enrollment-1',
          userId: 'user-1',
          mclassId: 'mclass-1',
          status: EnrollmentStatus.APPLIED,
          user: { id: 'user-1', name: '홍길동' },
          enrollmentForm: { id: 'form-1', title: '신청서' },
        },
      ];

      const mockResult = {
        enrollments: mockEnrollments,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockService.getEnrollmentsByMclass.mockResolvedValue(mockResult);

      await controller.getEnrollmentsByMclass(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getEnrollmentsByMclass).toHaveBeenCalledWith(
        'mclass-1',
        {
          status: 'APPLIED',
          page: 1,
          limit: 10,
          search: '홍길동',
        }
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(
            '신청 내역을 성공적으로 조회했습니다'
          ),
          data: mockEnrollments,
          statusCode: 200,
          successCode: 'ENROLLMENT_LIST_GET_SUCCESS',
        })
      );
    });
  });

  describe('updateEnrollmentStatus', () => {
    beforeEach(() => {
      mockRequest = {
        params: { enrollmentId: 'enrollment-1' },
        body: {
          status: 'APPROVED',
          reason: '승인되었습니다.',
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
        json: jest.fn().mockReturnThis(),
      } as any;
    });

    it('신청 상태를 성공적으로 변경한다', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: 'user-1',
        mclassId: 'mclass-1',
        status: EnrollmentStatus.APPROVED,
        decidedAt: new Date(),
        decidedByAdminId: 'admin-1',
        reason: '승인되었습니다.',
      };

      mockService.updateEnrollmentStatus.mockResolvedValue(mockEnrollment);

      await controller.updateEnrollmentStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.updateEnrollmentStatus).toHaveBeenCalledWith(
        'enrollment-1',
        { status: 'APPROVED', reason: '승인되었습니다.' },
        'admin-1'
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(
            '신청 상태가 "APPROVED"로 성공적으로 업데이트되었습니다'
          ),
          data: null,
          statusCode: 200,
          successCode: 'ENROLLMENT_STATUS_UPDATE_SUCCESS',
        })
      );
    });
  });

  describe('getEnrollmentStats', () => {
    beforeEach(() => {
      mockRequest = {
        params: { mclassId: 'mclass-1' },
        user: {
          userId: 'admin-1',
          email: 'admin@example.com',
          role: 'ADMIN',
          isAdmin: true,
          signUpCompleted: true,
        },
      };
      mockResponse = {
        json: jest.fn().mockReturnThis(),
      } as any;
    });

    it('클래스별 신청 통계를 성공적으로 조회한다', async () => {
      const mockStats = {
        totalEnrollments: 100,
        applied: 20,
        approved: 50,
        rejected: 10,
        waitlisted: 15,
        canceled: 5,
        capacity: 60,
        waitlistCapacity: 20,
      };

      mockService.getEnrollmentStats.mockResolvedValue(mockStats);

      await controller.getEnrollmentStats(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getEnrollmentStats).toHaveBeenCalledWith('mclass-1');
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(
            '신청 통계를 성공적으로 조회했습니다'
          ),
          data: mockStats,
          statusCode: 200,
          successCode: 'ENROLLMENT_STATS_GET_SUCCESS',
        })
      );
    });
  });
});
