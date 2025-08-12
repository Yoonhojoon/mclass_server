import { BaseSuccess } from '../BaseSuccess.js';
import { EnrollmentFormResponse } from '../../../domains/enrollmentForm/dto/EnrollmentFormResponse.js';

export class EnrollmentFormSuccess extends BaseSuccess<EnrollmentFormResponse> {
  /**
   * 지원서 양식 생성 성공
   */
  static created(
    id: string,
    data: EnrollmentFormResponse
  ): EnrollmentFormSuccess {
    return new EnrollmentFormSuccess(
      '지원서 양식이 성공적으로 생성되었습니다',
      201,
      'SUCCESS',
      data,
      { id }
    );
  }

  /**
   * 지원서 양식 수정 성공
   */
  static updated(
    id: string,
    data: EnrollmentFormResponse
  ): EnrollmentFormSuccess {
    return new EnrollmentFormSuccess(
      '지원서 양식이 성공적으로 수정되었습니다',
      200,
      'SUCCESS',
      data,
      { id }
    );
  }

  /**
   * 지원서 양식 삭제 성공
   */
  static deleted(id: string): EnrollmentFormSuccess {
    return new EnrollmentFormSuccess(
      '지원서 양식이 성공적으로 삭제되었습니다',
      200,
      'SUCCESS',
      undefined,
      { id }
    );
  }

  /**
   * 지원서 양식 조회 성공
   */
  static retrieved(data: EnrollmentFormResponse): EnrollmentFormSuccess {
    return new EnrollmentFormSuccess(
      '지원서 양식 조회가 완료되었습니다',
      200,
      'SUCCESS',
      data
    );
  }
}
