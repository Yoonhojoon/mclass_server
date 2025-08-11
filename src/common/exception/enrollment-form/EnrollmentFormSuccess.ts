import { BaseSuccess } from '../BaseSuccess.js';
import { EnrollmentFormResponse } from '../../../domains/enrollmentForm/dto/EnrollmentFormResponse.js';

export class EnrollmentFormSuccess extends BaseSuccess<EnrollmentFormResponse> {
  /**
   * 지원서 양식 생성 성공
   */
  static created(id: string, data: EnrollmentFormResponse) {
    return new EnrollmentFormSuccess(data, {
      message: '지원서 양식이 성공적으로 생성되었습니다',
      statusCode: 201,
      meta: { id },
    });
  }

  /**
   * 지원서 양식 수정 성공
   */
  static updated(id: string, data: EnrollmentFormResponse) {
    return new EnrollmentFormSuccess(data, {
      message: '지원서 양식이 성공적으로 수정되었습니다',
      statusCode: 200,
      meta: { id },
    });
  }

  /**
   * 지원서 양식 삭제 성공
   */
  static deleted(id: string) {
    return new EnrollmentFormSuccess(null as any, {
      message: '지원서 양식이 성공적으로 삭제되었습니다',
      statusCode: 200,
      meta: { id },
    });
  }

  /**
   * 지원서 양식 조회 성공
   */
  static retrieved(data: EnrollmentFormResponse) {
    return new EnrollmentFormSuccess(data, {
      message: '지원서 양식 조회가 완료되었습니다',
      statusCode: 200,
    });
  }
}
