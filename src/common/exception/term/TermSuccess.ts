export interface SuccessResponse {
  success: true;
  code: string;
  message: string;
  data?: unknown;
}

export class TermSuccessResponse {
  // 약관 조회 관련
  static termRetrieved(data: unknown): SuccessResponse {
    return {
      success: true,
      code: 'TERM2000',
      message: '약관이 성공적으로 조회되었습니다.',
      data,
    };
  }

  static termsRetrieved(data: unknown): SuccessResponse {
    return {
      success: true,
      code: 'TERM2001',
      message: '약관 목록이 성공적으로 조회되었습니다.',
      data,
    };
  }

  static termTypeRetrieved(data: unknown): SuccessResponse {
    return {
      success: true,
      code: 'TERM2002',
      message: '약관 유형별 목록이 성공적으로 조회되었습니다.',
      data,
    };
  }

  static requiredTermsRetrieved(data: unknown): SuccessResponse {
    return {
      success: true,
      code: 'TERM2003',
      message: '필수 약관 목록이 성공적으로 조회되었습니다.',
      data,
    };
  }

  static latestTermRetrieved(data: unknown): SuccessResponse {
    return {
      success: true,
      code: 'TERM2004',
      message: '최신 버전의 약관이 성공적으로 조회되었습니다.',
      data,
    };
  }

  // 약관 관리 관련
  static termCreated(data: unknown): SuccessResponse {
    return {
      success: true,
      code: 'TERM2010',
      message: '약관이 성공적으로 생성되었습니다.',
      data,
    };
  }

  static termUpdated(data: unknown): SuccessResponse {
    return {
      success: true,
      code: 'TERM2011',
      message: '약관이 성공적으로 수정되었습니다.',
      data,
    };
  }

  static termDeleted(): SuccessResponse {
    return {
      success: true,
      code: 'TERM2012',
      message: '약관이 성공적으로 삭제되었습니다.',
    };
  }

  // 약관 동의 관련
  static termAgreed(data: unknown): SuccessResponse {
    return {
      success: true,
      code: 'TERM2020',
      message: '약관 동의가 성공적으로 완료되었습니다.',
      data,
    };
  }

  static userAgreementsRetrieved(data: unknown): SuccessResponse {
    return {
      success: true,
      code: 'TERM2021',
      message: '사용자 약관 동의 목록이 성공적으로 조회되었습니다.',
      data,
    };
  }

  static agreementChecked(data: unknown): SuccessResponse {
    return {
      success: true,
      code: 'TERM2022',
      message: '약관 동의 확인이 완료되었습니다.',
      data,
    };
  }

  static requiredAgreementChecked(data: unknown): SuccessResponse {
    return {
      success: true,
      code: 'TERM2023',
      message: '필수 약관 동의 확인이 완료되었습니다.',
      data,
    };
  }
}
