// 성공 응답 인터페이스
export interface SuccessResponse {
  success: true;
  code: string;
  message: string;
  data?: unknown;
}

// 에러 응답 인터페이스
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// 통일된 응답 클래스
export class TermResponse {
  // 성공 응답 생성 메서드들
  static success(
    code: string,
    message: string,
    data?: unknown
  ): SuccessResponse {
    return {
      success: true,
      code,
      message,
      data,
    };
  }

  static error(
    code: string,
    message: string,
    details?: unknown
  ): ErrorResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
    };
  }

  // 약관 조회 관련 성공 응답
  static termRetrieved(data: unknown): SuccessResponse {
    return this.success('TERM2000', '약관이 성공적으로 조회되었습니다.', data);
  }

  static termsRetrieved(data: unknown): SuccessResponse {
    return this.success(
      'TERM2001',
      '약관 목록이 성공적으로 조회되었습니다.',
      data
    );
  }

  static termTypeRetrieved(data: unknown): SuccessResponse {
    return this.success(
      'TERM2002',
      '약관 유형별 목록이 성공적으로 조회되었습니다.',
      data
    );
  }

  static requiredTermsRetrieved(data: unknown): SuccessResponse {
    return this.success(
      'TERM2003',
      '필수 약관 목록이 성공적으로 조회되었습니다.',
      data
    );
  }

  static latestTermRetrieved(data: unknown): SuccessResponse {
    return this.success(
      'TERM2004',
      '최신 버전의 약관이 성공적으로 조회되었습니다.',
      data
    );
  }

  // 약관 관리 관련 성공 응답
  static termCreated(data: unknown): SuccessResponse {
    return this.success('TERM2010', '약관이 성공적으로 생성되었습니다.', data);
  }

  static termUpdated(data: unknown): SuccessResponse {
    return this.success('TERM2011', '약관이 성공적으로 수정되었습니다.', data);
  }

  static termDeleted(): SuccessResponse {
    return this.success('TERM2012', '약관이 성공적으로 삭제되었습니다.');
  }

  // 약관 동의 관련 성공 응답
  static termAgreed(data: unknown): SuccessResponse {
    return this.success(
      'TERM2020',
      '약관 동의가 성공적으로 완료되었습니다.',
      data
    );
  }

  static userAgreementsRetrieved(data: unknown): SuccessResponse {
    return this.success(
      'TERM2021',
      '사용자 약관 동의 목록이 성공적으로 조회되었습니다.',
      data
    );
  }

  static agreementChecked(data: unknown): SuccessResponse {
    return this.success('TERM2022', '약관 동의 확인이 완료되었습니다.', data);
  }

  static requiredAgreementChecked(data: unknown): SuccessResponse {
    return this.success(
      'TERM2023',
      '필수 약관 동의 확인이 완료되었습니다.',
      data
    );
  }

  // 권한 관련 에러 응답
  static forbidden(): ErrorResponse {
    return this.error('FORBIDDEN', '관리자 권한이 필요합니다.');
  }

  static unauthorized(): ErrorResponse {
    return this.error('UNAUTHORIZED', '인증이 필요합니다.');
  }
}
