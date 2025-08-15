import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  EnrollmentRepository,
  CreateEnrollmentData,
} from '../../domains/enrollment/enrollment.repository.js';
import { EnrollmentStatus } from '@prisma/client';

// PrismaClient 모킹
const mockPrisma = {
  enrollment: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
} as any;

// Logger 모킹
jest.mock('../../config/logger.config.js', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('EnrollmentRepository', () => {
  let repository: EnrollmentRepository;

  beforeEach(() => {
    repository = new EnrollmentRepository(mockPrisma);
  });

  describe('create', () => {
    it('신청 데이터를 성공적으로 생성한다', async () => {
      const createData: CreateEnrollmentData = {
        userId: 'user-1',
        mclassId: 'mclass-1',
        enrollmentFormId: 'form-1',
        answers: {
          q1_name: '홍길동',
          q2_email: 'hong@example.com',
        },
        idempotencyKey: 'key-123',
      };

      const mockEnrollment = {
        id: 'enrollment-1',
        userId: 'user-1',
        mclassId: 'mclass-1',
        enrollmentFormId: 'form-1',
        answers: createData.answers,
        status: EnrollmentStatus.APPLIED,
        appliedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        mclass: { id: 'mclass-1', title: '테스트 클래스' },
        enrollmentForm: { id: 'form-1', title: '신청서' },
        user: { id: 'user-1', name: '홍길동' },
      };

      mockPrisma.enrollment.create.mockResolvedValue(mockEnrollment);

      const result = await repository.create(createData);

      expect(mockPrisma.enrollment.create).toHaveBeenCalledWith({
        data: createData,
        include: {
          mclass: true,
          enrollmentForm: true,
          user: true,
        },
      });
      expect(result).toEqual(mockEnrollment);
    });
  });

  describe('findByUserId', () => {
    it('사용자 ID로 신청 목록을 성공적으로 조회한다', async () => {
      const mockEnrollments = [
        {
          id: 'enrollment-1',
          userId: 'user-1',
          mclassId: 'mclass-1',
          status: EnrollmentStatus.APPLIED,
          mclass: { id: 'mclass-1', title: '클래스 1' },
          enrollmentForm: { id: 'form-1', title: '신청서 1' },
        },
        {
          id: 'enrollment-2',
          userId: 'user-1',
          mclassId: 'mclass-2',
          status: EnrollmentStatus.APPROVED,
          mclass: { id: 'mclass-2', title: '클래스 2' },
          enrollmentForm: { id: 'form-2', title: '신청서 2' },
        },
      ];

      mockPrisma.enrollment.findMany.mockResolvedValue(mockEnrollments);

      const result = await repository.findByUserId('user-1');

      expect(mockPrisma.enrollment.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          mclass: true,
          enrollmentForm: true,
        },
      });
      expect(result).toEqual(mockEnrollments);
    });

    it('쿼리 옵션과 함께 사용자 ID로 신청 목록을 조회한다', async () => {
      const options = {
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' as const },
        where: { status: EnrollmentStatus.APPLIED },
      };

      mockPrisma.enrollment.findMany.mockResolvedValue([]);

      await repository.findByUserId('user-1', options);

      expect(mockPrisma.enrollment.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: EnrollmentStatus.APPLIED },
        include: {
          mclass: true,
          enrollmentForm: true,
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findByMclassId', () => {
    it('클래스 ID로 신청 목록을 성공적으로 조회한다', async () => {
      const mockEnrollments = [
        {
          id: 'enrollment-1',
          mclassId: 'mclass-1',
          userId: 'user-1',
          status: EnrollmentStatus.APPLIED,
          user: { id: 'user-1', name: '홍길동' },
          enrollmentForm: { id: 'form-1', title: '신청서' },
        },
      ];

      mockPrisma.enrollment.findMany.mockResolvedValue(mockEnrollments);

      const result = await repository.findByMclassId('mclass-1');

      expect(mockPrisma.enrollment.findMany).toHaveBeenCalledWith({
        where: { mclassId: 'mclass-1' },
        include: {
          user: true,
          enrollmentForm: true,
        },
      });
      expect(result).toEqual(mockEnrollments);
    });
  });

  describe('findById', () => {
    it('ID로 신청을 성공적으로 조회한다', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: 'user-1',
        mclassId: 'mclass-1',
        status: EnrollmentStatus.APPLIED,
        user: { id: 'user-1', name: '홍길동' },
        mclass: { id: 'mclass-1', title: '테스트 클래스' },
        enrollmentForm: { id: 'form-1', title: '신청서' },
      };

      mockPrisma.enrollment.findUnique.mockResolvedValue(mockEnrollment);

      const result = await repository.findById('enrollment-1');

      expect(mockPrisma.enrollment.findUnique).toHaveBeenCalledWith({
        where: { id: 'enrollment-1' },
        include: {
          user: true,
          mclass: true,
          enrollmentForm: true,
        },
      });
      expect(result).toEqual(mockEnrollment);
    });

    it('존재하지 않는 ID로 조회 시 null을 반환한다', async () => {
      mockPrisma.enrollment.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('신청 상태를 성공적으로 업데이트한다', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        status: EnrollmentStatus.APPROVED,
        decidedAt: new Date(),
        decidedByAdminId: 'admin-1',
        reason: '승인되었습니다.',
        updatedAt: new Date(),
        user: { id: 'user-1', name: '홍길동' },
        mclass: { id: 'mclass-1', title: '테스트 클래스' },
        enrollmentForm: { id: 'form-1', title: '신청서' },
      };

      mockPrisma.enrollment.update.mockResolvedValue(mockEnrollment);

      const result = await repository.updateStatus(
        'enrollment-1',
        EnrollmentStatus.APPROVED,
        new Date(),
        'admin-1',
        '승인되었습니다.'
      );

      expect(mockPrisma.enrollment.update).toHaveBeenCalledWith({
        where: { id: 'enrollment-1' },
        data: {
          status: EnrollmentStatus.APPROVED,
          decidedAt: expect.any(Date),
          decidedByAdminId: 'admin-1',
          reason: '승인되었습니다.',
          updatedAt: expect.any(Date),
        },
        include: {
          user: true,
          mclass: true,
          enrollmentForm: true,
        },
      });
      expect(result).toEqual(mockEnrollment);
    });
  });

  describe('updateWithVersion', () => {
    it('버전과 함께 신청 데이터를 성공적으로 업데이트한다', async () => {
      const updateData = {
        answers: {
          q1_name: '수정된 이름',
          q2_email: 'modified@example.com',
        },
        updatedAt: new Date(),
      };

      const mockEnrollment = {
        id: 'enrollment-1',
        answers: updateData.answers,
        version: 2,
        updatedAt: new Date(),
        user: { id: 'user-1', name: '홍길동' },
        mclass: { id: 'mclass-1', title: '테스트 클래스' },
        enrollmentForm: { id: 'form-1', title: '신청서' },
      };

      mockPrisma.enrollment.update.mockResolvedValue(mockEnrollment);

      const result = await repository.updateWithVersion(
        'enrollment-1',
        updateData,
        1
      );

      expect(mockPrisma.enrollment.update).toHaveBeenCalledWith({
        where: {
          id: 'enrollment-1',
          version: 1,
        },
        data: {
          ...updateData,
          version: { increment: 1 },
        },
        include: {
          user: true,
          mclass: true,
          enrollmentForm: true,
        },
      });
      expect(result).toEqual(mockEnrollment);
    });
  });

  describe('delete', () => {
    it('신청을 성공적으로 삭제한다', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        status: EnrollmentStatus.CANCELED,
        canceledAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.enrollment.delete.mockResolvedValue(mockEnrollment);

      const result = await repository.delete('enrollment-1');

      expect(mockPrisma.enrollment.delete).toHaveBeenCalledWith({
        where: { id: 'enrollment-1' },
        include: {
          user: true,
          mclass: true,
          enrollmentForm: true,
        },
      });
      expect(result).toEqual(mockEnrollment);
    });
  });

  describe('countByMclassAndStatus', () => {
    it('클래스와 상태별 신청 개수를 성공적으로 조회한다', async () => {
      mockPrisma.enrollment.count.mockResolvedValue(5);

      const result = await repository.countByMclassAndStatus(
        'mclass-1',
        EnrollmentStatus.APPLIED
      );

      expect(mockPrisma.enrollment.count).toHaveBeenCalledWith({
        where: {
          mclassId: 'mclass-1',
          status: EnrollmentStatus.APPLIED,
        },
      });
      expect(result).toBe(5);
    });
  });

  describe('findByUserAndMclass', () => {
    it('사용자와 클래스로 신청을 성공적으로 조회한다', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: 'user-1',
        mclassId: 'mclass-1',
        status: EnrollmentStatus.APPLIED,
        user: { id: 'user-1', name: '테스트 사용자' },
        mclass: { id: 'mclass-1', name: '테스트 클래스' },
        enrollmentForm: { id: 'form-1', title: '테스트 폼' },
      };

      mockPrisma.enrollment.findUnique.mockResolvedValue(mockEnrollment);

      const result = await repository.findByUserAndMclass('user-1', 'mclass-1');

      expect(mockPrisma.enrollment.findUnique).toHaveBeenCalledWith({
        where: {
          userId_mclassId: { userId: 'user-1', mclassId: 'mclass-1' },
        },
        include: {
          user: true,
          mclass: true,
          enrollmentForm: true,
        },
      });
      expect(result).toEqual(mockEnrollment);
    });

    it('존재하지 않는 조합으로 조회 시 null을 반환한다', async () => {
      mockPrisma.enrollment.findUnique.mockResolvedValue(null);

      const result = await repository.findByUserAndMclass('user-1', 'mclass-1');

      expect(result).toBeNull();
    });
  });

  describe('findByIdempotencyKey', () => {
    it('멱등성 키로 신청을 성공적으로 조회한다', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: 'user-1',
        mclassId: 'mclass-1',
        status: EnrollmentStatus.APPLIED,
        idempotencyKey: 'test-key-123',
        user: { id: 'user-1', name: '홍길동' },
        mclass: { id: 'mclass-1', title: '테스트 클래스' },
        enrollmentForm: { id: 'form-1', title: '신청서' },
      };

      mockPrisma.enrollment.findFirst.mockResolvedValue(mockEnrollment);

      const result = await repository.findByIdempotencyKey('test-key-123');

      expect(mockPrisma.enrollment.findFirst).toHaveBeenCalledWith({
        where: { idempotencyKey: 'test-key-123' },
        include: {
          user: true,
          mclass: true,
          enrollmentForm: true,
        },
      });
      expect(result).toEqual(mockEnrollment);
    });

    it('존재하지 않는 멱등성 키로 조회 시 null을 반환한다', async () => {
      mockPrisma.enrollment.findFirst.mockResolvedValue(null);

      const result = await repository.findByIdempotencyKey('non-existent-key');

      expect(result).toBeNull();
    });
  });
});
