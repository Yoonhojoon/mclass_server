import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EnrollmentFormRepository } from '../../domains/enrollmentForm/enrollmentForm.repository.js';
import {
  CreateEnrollmentFormDto,
  UpdateEnrollmentFormDto,
} from '../../schemas/enrollmentForm/index.js';

// PrismaClient 모킹
const mockPrisma = {
  enrollmentForm: {
    findUnique: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
} as any;

describe('EnrollmentFormRepository', () => {
  let repository: EnrollmentFormRepository;

  beforeEach(() => {
    repository = new EnrollmentFormRepository(mockPrisma);
  });

  describe('findByMClassId', () => {
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

      mockPrisma.enrollmentForm.findUnique.mockResolvedValue(mockForm);

      const result = await repository.findByMClassId('mclass-1');

      expect(mockPrisma.enrollmentForm.findUnique).toHaveBeenCalledWith({
        where: { mclassId: 'mclass-1' },
      });
      expect(result).toEqual({
        ...mockForm,
        questions: mockForm.questions,
      });
    });

    it('존재하지 않는 MClass ID로 조회 시 null을 반환한다', async () => {
      mockPrisma.enrollmentForm.findUnique.mockResolvedValue(null);

      const result = await repository.findByMClassId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('ID로 지원서 양식을 성공적으로 조회한다', async () => {
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

      mockPrisma.enrollmentForm.findUnique.mockResolvedValue(mockForm);

      const result = await repository.findById('form-1');

      expect(mockPrisma.enrollmentForm.findUnique).toHaveBeenCalledWith({
        where: { id: 'form-1' },
      });
      expect(result).toEqual({
        ...mockForm,
        questions: mockForm.questions,
      });
    });

    it('존재하지 않는 ID로 조회 시 null을 반환한다', async () => {
      mockPrisma.enrollmentForm.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('지원서 양식을 성공적으로 생성한다', async () => {
      const createData: CreateEnrollmentFormDto = {
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
      };

      const mockCreatedForm = {
        id: 'form-1',
        mclassId: 'mclass-1',
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.enrollmentForm.create.mockResolvedValue(mockCreatedForm);

      const result = await repository.create('mclass-1', createData);

      expect(mockPrisma.enrollmentForm.create).toHaveBeenCalledWith({
        data: {
          mclassId: 'mclass-1',
          title: createData.title,
          description: createData.description,
          questions: createData.questions,
          isActive: createData.isActive,
        },
      });
      expect(result).toEqual({
        ...mockCreatedForm,
        questions: mockCreatedForm.questions,
      });
    });
  });

  describe('updateByMClassId', () => {
    it('MClass ID로 지원서 양식을 성공적으로 수정한다', async () => {
      const updateData: UpdateEnrollmentFormDto = {
        title: '수정된 제목',
        description: '수정된 설명',
      };

      const mockExistingForm = {
        id: 'form-1',
        mclassId: 'mclass-1',
        title: '기존 제목',
        description: '기존 설명',
        questions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedForm = {
        ...mockExistingForm,
        title: '수정된 제목',
        description: '수정된 설명',
      };

      mockPrisma.$transaction.mockResolvedValue(mockUpdatedForm);

      const result = await repository.updateByMClassId('mclass-1', updateData);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({
        ...mockUpdatedForm,
        questions: mockUpdatedForm.questions,
      });
    });
  });

  describe('deleteByMClassId', () => {
    it('MClass ID로 지원서 양식을 성공적으로 삭제한다', async () => {
      const mockExistingForm = {
        id: 'form-1',
        mclassId: 'mclass-1',
        title: '삭제할 양식',
        description: '삭제할 설명',
        questions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.$transaction.mockResolvedValue(undefined);

      await repository.deleteByMClassId('mclass-1');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('existsByMClassId', () => {
    it('존재하는 MClass ID에 대해 true를 반환한다', async () => {
      mockPrisma.enrollmentForm.count.mockResolvedValue(1);

      const result = await repository.existsByMClassId('mclass-1');

      expect(mockPrisma.enrollmentForm.count).toHaveBeenCalledWith({
        where: { mclassId: 'mclass-1' },
      });
      expect(result).toBe(true);
    });

    it('존재하지 않는 MClass ID에 대해 false를 반환한다', async () => {
      mockPrisma.enrollmentForm.count.mockResolvedValue(0);

      const result = await repository.existsByMClassId('non-existent');

      expect(result).toBe(false);
    });
  });
});
