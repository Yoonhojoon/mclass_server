import { BaseError } from '../BaseError.js';

export class EnrollmentError extends BaseError {
  constructor(
    message: string,
    statusCode: number = 400,
    originalError?: unknown
  ) {
    super(message, statusCode, originalError);
  }

  // 정원 초과용 정적 메서드
  static capacityExceeded(): EnrollmentError {
    return new EnrollmentError('정원이 초과되었습니다.', 409);
  }

  // 중복 신청용 정적 메서드
  static duplicateEnrollment(): EnrollmentError {
    return new EnrollmentError('이미 신청한 클래스입니다.', 409);
  }

  // 신청 기간 외용 정적 메서드
  static outOfPeriod(): EnrollmentError {
    return new EnrollmentError('신청 기간이 아닙니다.', 422);
  }

  // 신청서 미준비용 정적 메서드
  static formNotReady(): EnrollmentError {
    return new EnrollmentError('신청서가 준비되지 않았습니다.', 422);
  }

  // 답변 검증 오류용 정적 메서드
  static validationError(message: string): EnrollmentError {
    return new EnrollmentError(message, 422);
  }

  // 권한 부족용 정적 메서드
  static insufficientPermission(): EnrollmentError {
    return new EnrollmentError('접근 권한이 없습니다.', 403);
  }

  // 신청서를 찾을 수 없음용 정적 메서드
  static enrollmentNotFound(): EnrollmentError {
    return new EnrollmentError('존재하지 않는 신청입니다.', 404);
  }

  // 클래스를 찾을 수 없음용 정적 메서드
  static classNotFound(): EnrollmentError {
    return new EnrollmentError('존재하지 않는 클래스입니다.', 404);
  }

  // 신청할 수 없는 클래스용 정적 메서드
  static classNotAvailable(): EnrollmentError {
    return new EnrollmentError('신청할 수 없는 클래스입니다.', 422);
  }

  // 상태 변경 불가용 정적 메서드
  static statusChangeNotAllowed(): EnrollmentError {
    return new EnrollmentError('상태를 변경할 수 없습니다.', 422);
  }

  // 취소 불가용 정적 메서드
  static cancellationNotAllowed(): EnrollmentError {
    return new EnrollmentError('취소할 수 없는 상태입니다.', 422);
  }
}
