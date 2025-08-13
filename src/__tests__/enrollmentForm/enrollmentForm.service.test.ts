import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EnrollmentFormService } from '../../domains/enrollmentForm/enrollmentForm.service.js';

import { EnrollmentFormError } from '../../common/exception/enrollmentForm/EnrollmentFormError.js';
import {
  CreateEnrollmentFormDto,
  UpdateEnrollmentFormDto,
} from '../../schemas/enrollmentForm/index.js';

// Repository 모킹
const mockRepository = {
  findByMClassId: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateByMClassId: jest.fn(),
  deleteByMClassId: jest.fn(),
  existsByMClassId: jest.fn(),
} as any;

// Logger 모킹
jest.mock('../../config/logger.config.js', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('EnrollmentFormService', () => {
  let service: EnrollmentFormService;

  beforeEach(() => {
    service = new EnrollmentFormService(mockRepository);
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

      mockRepository.findByMClassId.mockResolvedValue(mockForm);

      const result = await service.findByMClassId('mclass-1');

      expect(mockRepository.findByMClassId).toHaveBeenCalledWith('mclass-1');
      expect(result).toEqual(mockForm);
    });

    it('존재하지 않는 MClass ID로 조회 시 NotFound 에러를 던진다', async () => {
      mockRepository.findByMClassId.mockResolvedValue(null);

      await expect(service.findByMClassId('non-existent')).rejects.toThrow(
        EnrollmentFormError
      );
    });
  });

  describe('findById', () => {
    it('ID로 지원서 양식을 성공적으로 조회한다', async () => {
      const mockForm = {
        id: 'form-1',
        mclassId: 'mclass-1',
        title: '테스트 지원서',
        description: '테스트 설명',
        questions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(mockForm);

      const result = await service.findById('form-1');

      expect(mockRepository.findById).toHaveBeenCalledWith('form-1');
      expect(result).toEqual(mockForm);
    });

    it('존재하지 않는 ID로 조회 시 NotFound 에러를 던진다', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        EnrollmentFormError
      );
    });
  });

  describe('create', () => {
    const validCreateData: CreateEnrollmentFormDto = {
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

    it('지원서 양식을 성공적으로 생성한다', async () => {
      const mockCreatedForm = {
        id: 'form-1',
        mclassId: 'mclass-1',
        ...validCreateData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.existsByMClassId.mockResolvedValue(false);
      mockRepository.create.mockResolvedValue(mockCreatedForm);

      const result = await service.create('mclass-1', validCreateData);

      expect(mockRepository.existsByMClassId).toHaveBeenCalledWith('mclass-1');
      expect(mockRepository.create).toHaveBeenCalledWith(
        'mclass-1',
        validCreateData
      );
      expect(result).toEqual(mockCreatedForm);
    });

    it('이미 존재하는 MClass에 대해 AlreadyExists 에러를 던진다', async () => {
      mockRepository.existsByMClassId.mockResolvedValue(true);

      await expect(service.create('mclass-1', validCreateData)).rejects.toThrow(
        EnrollmentFormError
      );
    });

    it('중복된 질문 ID가 있을 때 DuplicateQuestionIds 에러를 던진다', async () => {
      const invalidData: CreateEnrollmentFormDto = {
        ...validCreateData,
        questions: [
          { id: 'q1', type: 'text', label: '질문1', required: true },
          { id: 'q1', type: 'text', label: '질문2', required: true }, // 중복 ID
        ],
      };

      mockRepository.existsByMClassId.mockResolvedValue(false);

      await expect(service.create('mclass-1', invalidData)).rejects.toThrow(
        EnrollmentFormError
      );
    });

    it('radio 타입 질문에 옵션이 없을 때 MissingOptions 에러를 던진다', async () => {
      const invalidData: CreateEnrollmentFormDto = {
        ...validCreateData,
        questions: [
          {
            id: 'q1',
            type: 'radio',
            label: '선택하세요',
            required: true,
            // options 누락
          },
        ],
      };

      mockRepository.existsByMClassId.mockResolvedValue(false);

      await expect(service.create('mclass-1', invalidData)).rejects.toThrow(
        EnrollmentFormError
      );
    });

    it('agreeTerms ID는 옵션 검증을 제외한다', async () => {
      const validData: CreateEnrollmentFormDto = {
        ...validCreateData,
        questions: [
          {
            id: 'agreeTerms',
            type: 'checkbox',
            label: '약관에 동의합니다',
            required: true,
            // options 없어도 허용
          },
        ],
      };

      const mockCreatedForm = {
        id: 'form-1',
        mclassId: 'mclass-1',
        ...validData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.existsByMClassId.mockResolvedValue(false);
      mockRepository.create.mockResolvedValue(mockCreatedForm);

      const result = await service.create('mclass-1', validData);

      expect(result).toEqual(mockCreatedForm);
    });
  });

  describe('update', () => {
    const validUpdateData: UpdateEnrollmentFormDto = {
      title: '수정된 제목',
      description: '수정된 설명',
    };

    it('지원서 양식을 성공적으로 수정한다', async () => {
      const existingForm = {
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
        ...existingForm,
        ...validUpdateData,
      };

      mockRepository.findById.mockResolvedValue(existingForm);
      mockRepository.updateByMClassId.mockResolvedValue(mockUpdatedForm);

      const result = await service.update('form-1', validUpdateData);

      expect(mockRepository.findById).toHaveBeenCalledWith('form-1');
      expect(mockRepository.updateByMClassId).toHaveBeenCalledWith(
        'mclass-1',
        validUpdateData
      );
      expect(result).toEqual(mockUpdatedForm);
    });

    it('존재하지 않는 양식을 수정할 때 NotFound 에러를 던진다', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('non-existent', validUpdateData)
      ).rejects.toThrow(EnrollmentFormError);
    });

    it('질문이 포함된 업데이트에서 중복 ID 검증을 수행한다', async () => {
      const existingForm = {
        id: 'form-1',
        mclassId: 'mclass-1',
        title: '기존 제목',
        description: '기존 설명',
        questions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const invalidUpdateData: UpdateEnrollmentFormDto = {
        questions: [
          { id: 'q1', type: 'text', label: '질문1', required: true },
          { id: 'q1', type: 'text', label: '질문2', required: true }, // 중복 ID
        ],
      };

      mockRepository.findById.mockResolvedValue(existingForm);

      await expect(service.update('form-1', invalidUpdateData)).rejects.toThrow(
        EnrollmentFormError
      );
    });

    it('질문이 포함된 업데이트에서 옵션 검증을 수행한다', async () => {
      const existingForm = {
        id: 'form-1',
        mclassId: 'mclass-1',
        title: '기존 제목',
        description: '기존 설명',
        questions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const invalidUpdateData: UpdateEnrollmentFormDto = {
        questions: [
          {
            id: 'q1',
            type: 'select',
            label: '선택하세요',
            required: true,
            // options 누락
          },
        ],
      };

      mockRepository.findById.mockResolvedValue(existingForm);

      await expect(service.update('form-1', invalidUpdateData)).rejects.toThrow(
        EnrollmentFormError
      );
    });
  });

  describe('delete', () => {
    it('지원서 양식을 성공적으로 삭제한다', async () => {
      const existingForm = {
        id: 'form-1',
        mclassId: 'mclass-1',
        title: '삭제할 양식',
        description: '삭제할 설명',
        questions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(existingForm);
      mockRepository.deleteByMClassId.mockResolvedValue(undefined);

      await service.delete('form-1');

      expect(mockRepository.findById).toHaveBeenCalledWith('form-1');
      expect(mockRepository.deleteByMClassId).toHaveBeenCalledWith('mclass-1');
    });

    it('존재하지 않는 양식을 삭제할 때 NotFound 에러를 던진다', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(
        EnrollmentFormError
      );
    });
  });
});
