import { BaseSuccess } from '../BaseSuccess.js';

export class TermSuccess extends BaseSuccess {
  constructor(data: any, message?: string) {
    super(data, message);
  }

  static termsRetrieved<T = any>(data: T): TermSuccess {
    return new TermSuccess(data, '약관 목록이 성공적으로 조회되었습니다.');
  }

  static termRetrieved<T = any>(data: T): TermSuccess {
    return new TermSuccess(data, '약관이 성공적으로 조회되었습니다.');
  }

  static termTypeRetrieved<T = any>(data: T): TermSuccess {
    return new TermSuccess(
      data,
      '약관 유형별 목록이 성공적으로 조회되었습니다.'
    );
  }

  static requiredTermsRetrieved<T = any>(data: T): TermSuccess {
    return new TermSuccess(data, '필수 약관 목록이 성공적으로 조회되었습니다.');
  }

  static latestTermRetrieved<T = any>(data: T): TermSuccess {
    return new TermSuccess(
      data,
      '최신 버전의 약관이 성공적으로 조회되었습니다.'
    );
  }

  static termCreated<T = any>(data: T): TermSuccess {
    return new TermSuccess(data, '약관이 성공적으로 생성되었습니다.');
  }

  static termUpdated<T = any>(data: T): TermSuccess {
    return new TermSuccess(data, '약관이 성공적으로 수정되었습니다.');
  }

  static termDeleted(): TermSuccess {
    return new TermSuccess(null, '약관이 성공적으로 삭제되었습니다.');
  }

  static termAgreed<T = any>(data: T): TermSuccess {
    return new TermSuccess(data, '약관 동의가 성공적으로 완료되었습니다.');
  }

  static userAgreementsRetrieved<T = any>(data: T): TermSuccess {
    return new TermSuccess(
      data,
      '사용자 약관 동의 목록이 성공적으로 조회되었습니다.'
    );
  }

  static agreementChecked<T = any>(data: T): TermSuccess {
    return new TermSuccess(data, '약관 동의 확인이 완료되었습니다.');
  }

  static requiredAgreementChecked<T = any>(data: T): TermSuccess {
    return new TermSuccess(data, '필수 약관 동의 확인이 완료되었습니다.');
  }
}
