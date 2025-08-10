import { Response } from 'express';
import { BaseSuccess } from '../BaseSuccess.js';

export class TermSuccess<T = unknown> extends BaseSuccess<T> {
  constructor(
    message: string,
    statusCode: number = 200,
    successCode: string = 'TERM_SUCCESS',
    data?: T,
    meta?: Record<string, unknown>
  ) {
    super(message, statusCode, successCode, data, meta);
  }

  static termsRetrieved<T = unknown>(
    data: T,
    meta?: Record<string, unknown>
  ): TermSuccess<T> {
    return new TermSuccess<T>(
      '약관 목록이 성공적으로 조회되었습니다.',
      200,
      'TERMS_RETRIEVED_SUCCESS',
      data,
      meta
    );
  }

  static termRetrieved<T = unknown>(data: T): TermSuccess<T> {
    return new TermSuccess<T>(
      '약관이 성공적으로 조회되었습니다.',
      200,
      'TERM_RETRIEVED_SUCCESS',
      data
    );
  }

  static termTypeRetrieved<T = unknown>(data: T): TermSuccess<T> {
    return new TermSuccess<T>(
      '약관 유형별 목록이 성공적으로 조회되었습니다.',
      200,
      'TERM_TYPE_RETRIEVED_SUCCESS',
      data
    );
  }

  static requiredTermsRetrieved<T = unknown>(data: T): TermSuccess<T> {
    return new TermSuccess<T>(
      '필수 약관 목록이 성공적으로 조회되었습니다.',
      200,
      'REQUIRED_TERMS_RETRIEVED_SUCCESS',
      data
    );
  }

  static latestTermRetrieved<T = unknown>(data: T): TermSuccess<T> {
    return new TermSuccess<T>(
      '최신 버전의 약관이 성공적으로 조회되었습니다.',
      200,
      'LATEST_TERM_RETRIEVED_SUCCESS',
      data
    );
  }

  static termCreated<T = unknown>(data: T): TermSuccess<T> {
    return new TermSuccess<T>(
      '약관이 성공적으로 생성되었습니다.',
      201,
      'TERM_CREATED_SUCCESS',
      data
    );
  }

  static termUpdated<T = unknown>(data: T): TermSuccess<T> {
    return new TermSuccess<T>(
      '약관이 성공적으로 수정되었습니다.',
      200,
      'TERM_UPDATED_SUCCESS',
      data
    );
  }

  static termDeleted(): { send: (res: Response) => void } {
    return {
      send: (res: Response) => BaseSuccess.noContent(res),
    };
  }

  static termAgreed<T = unknown>(data: T): TermSuccess<T> {
    return new TermSuccess<T>(
      '약관 동의가 성공적으로 완료되었습니다.',
      201,
      'TERM_AGREED_SUCCESS',
      data
    );
  }

  static userAgreementsRetrieved<T = unknown>(
    data: T,
    meta?: Record<string, unknown>
  ): TermSuccess<T> {
    return new TermSuccess<T>(
      '사용자 약관 동의 목록이 성공적으로 조회되었습니다.',
      200,
      'USER_AGREEMENTS_RETRIEVED_SUCCESS',
      data,
      meta
    );
  }

  static agreementChecked<T = unknown>(data: T): TermSuccess<T> {
    return new TermSuccess<T>(
      '약관 동의 확인이 완료되었습니다.',
      200,
      'AGREEMENT_CHECKED_SUCCESS',
      data
    );
  }

  static requiredAgreementChecked<T = unknown>(data: T): TermSuccess<T> {
    return new TermSuccess<T>(
      '필수 약관 동의 확인이 완료되었습니다.',
      200,
      'REQUIRED_AGREEMENT_CHECKED_SUCCESS',
      data
    );
  }
}
