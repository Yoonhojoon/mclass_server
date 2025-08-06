import { BaseSuccess } from '../BaseSuccess.js';

export class TermSuccess extends BaseSuccess {
  constructor(
    message: string,
    statusCode: number = 200,
    successCode: string = 'TERM_SUCCESS',
    data?: unknown
  ) {
    super(message, statusCode, successCode, data);
  }

  static termsRetrieved<T = unknown>(data: T): TermSuccess {
    return new TermSuccess(
      '약관 목록이 성공적으로 조회되었습니다.',
      200,
      'TERMS_RETRIEVED_SUCCESS',
      data
    );
  }

  static termRetrieved<T = unknown>(data: T): TermSuccess {
    return new TermSuccess(
      '약관이 성공적으로 조회되었습니다.',
      200,
      'TERM_RETRIEVED_SUCCESS',
      data
    );
  }

  static termTypeRetrieved<T = unknown>(data: T): TermSuccess {
    return new TermSuccess(
      '약관 유형별 목록이 성공적으로 조회되었습니다.',
      200,
      'TERM_TYPE_RETRIEVED_SUCCESS',
      data
    );
  }

  static requiredTermsRetrieved<T = unknown>(data: T): TermSuccess {
    return new TermSuccess(
      '필수 약관 목록이 성공적으로 조회되었습니다.',
      200,
      'REQUIRED_TERMS_RETRIEVED_SUCCESS',
      data
    );
  }

  static latestTermRetrieved<T = unknown>(data: T): TermSuccess {
    return new TermSuccess(
      '최신 버전의 약관이 성공적으로 조회되었습니다.',
      200,
      'LATEST_TERM_RETRIEVED_SUCCESS',
      data
    );
  }

  static termCreated<T = unknown>(data: T): TermSuccess {
    return new TermSuccess(
      '약관이 성공적으로 생성되었습니다.',
      201,
      'TERM_CREATED_SUCCESS',
      data
    );
  }

  static termUpdated<T = unknown>(data: T): TermSuccess {
    return new TermSuccess(
      '약관이 성공적으로 수정되었습니다.',
      200,
      'TERM_UPDATED_SUCCESS',
      data
    );
  }

  static termDeleted(): TermSuccess {
    return new TermSuccess(
      '약관이 성공적으로 삭제되었습니다.',
      200,
      'TERM_DELETED_SUCCESS'
    );
  }

  static termAgreed<T = unknown>(data: T): TermSuccess {
    return new TermSuccess(
      '약관 동의가 성공적으로 완료되었습니다.',
      200,
      'TERM_AGREED_SUCCESS',
      data
    );
  }

  static userAgreementsRetrieved<T = unknown>(data: T): TermSuccess {
    return new TermSuccess(
      '사용자 약관 동의 목록이 성공적으로 조회되었습니다.',
      200,
      'USER_AGREEMENTS_RETRIEVED_SUCCESS',
      data
    );
  }

  static agreementChecked<T = unknown>(data: T): TermSuccess {
    return new TermSuccess(
      '약관 동의 확인이 완료되었습니다.',
      200,
      'AGREEMENT_CHECKED_SUCCESS',
      data
    );
  }

  static requiredAgreementChecked<T = unknown>(data: T): TermSuccess {
    return new TermSuccess(
      '필수 약관 동의 확인이 완료되었습니다.',
      200,
      'REQUIRED_AGREEMENT_CHECKED_SUCCESS',
      data
    );
  }
}
