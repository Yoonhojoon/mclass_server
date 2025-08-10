import { BaseSuccess } from '../BaseSuccess.js';

export class EnrollmentSuccess<T = unknown> extends BaseSuccess<T> {
  constructor(
    message: string,
    statusCode: number = 200,
    successCode: string = 'ENROLLMENT_SUCCESS',
    data?: T,
    meta?: Record<string, unknown>
  ) {
    super(message, statusCode, successCode, data, meta);
  }

  static enrollmentSuccess<T = unknown>(
    className: string,
    enrollmentId: string,
    data?: T
  ): EnrollmentSuccess<T> {
    const message = `"${className}" 클래스 신청이 성공적으로 완료되었습니다. (신청 ID: ${enrollmentId})`;
    return new EnrollmentSuccess<T>(message, 201, 'ENROLLMENT_SUCCESS', data);
  }

  static enrollmentCancellationSuccess(
    className: string
  ): EnrollmentSuccess<null> {
    const message = `"${className}" 클래스 신청이 성공적으로 취소되었습니다.`;
    return new EnrollmentSuccess<null>(
      message,
      200,
      'ENROLLMENT_CANCELLATION_SUCCESS',
      null
    );
  }

  static enrollmentUpdateSuccess<T = unknown>(data?: T): EnrollmentSuccess<T> {
    const message = '신청 정보가 성공적으로 업데이트되었습니다.';
    return new EnrollmentSuccess<T>(
      message,
      200,
      'ENROLLMENT_UPDATE_SUCCESS',
      data
    );
  }

  static enrollmentGetSuccess<T = unknown>(data?: T): EnrollmentSuccess<T> {
    const message = '신청 정보를 성공적으로 조회했습니다.';
    return new EnrollmentSuccess<T>(
      message,
      200,
      'ENROLLMENT_GET_SUCCESS',
      data
    );
  }

  static enrollmentListGetSuccess<T = unknown>(
    count: number,
    data?: T
  ): EnrollmentSuccess<T> {
    const message = `총 ${count}개의 신청 내역을 성공적으로 조회했습니다.`;
    return new EnrollmentSuccess<T>(
      message,
      200,
      'ENROLLMENT_LIST_GET_SUCCESS',
      data,
      { count }
    );
  }

  static enrollmentDetailsGetSuccess<T = unknown>(
    data?: T
  ): EnrollmentSuccess<T> {
    const message = '신청 상세 정보를 성공적으로 조회했습니다.';
    return new EnrollmentSuccess<T>(
      message,
      200,
      'ENROLLMENT_DETAILS_GET_SUCCESS',
      data
    );
  }

  static enrollmentStatusUpdateSuccess(
    newStatus: string
  ): EnrollmentSuccess<null> {
    const message = `신청 상태가 "${newStatus}"로 성공적으로 업데이트되었습니다.`;
    return new EnrollmentSuccess<null>(
      message,
      200,
      'ENROLLMENT_STATUS_UPDATE_SUCCESS',
      null
    );
  }

  static enrollmentConfirmationSuccess(
    enrollmentId: string
  ): EnrollmentSuccess<null> {
    const message = `신청이 성공적으로 확정되었습니다. (신청 ID: ${enrollmentId})`;
    return new EnrollmentSuccess<null>(
      message,
      200,
      'ENROLLMENT_CONFIRMATION_SUCCESS',
      null
    );
  }

  static enrollmentWaitlistSuccess(
    className: string,
    position: number
  ): EnrollmentSuccess<null> {
    const message = `"${className}" 클래스 대기자 명단 ${position}번째로 추가되었습니다.`;
    return new EnrollmentSuccess<null>(
      message,
      200,
      'ENROLLMENT_WAITLIST_SUCCESS',
      null
    );
  }

  static enrollmentStatsGetSuccess<T = unknown>(
    totalEnrollments: number,
    confirmedEnrollments: number,
    data?: T
  ): EnrollmentSuccess<T> {
    const message = `신청 통계를 성공적으로 조회했습니다. (총 신청: ${totalEnrollments}, 확정: ${confirmedEnrollments})`;
    return new EnrollmentSuccess<T>(
      message,
      200,
      'ENROLLMENT_STATS_GET_SUCCESS',
      data,
      { totalEnrollments, confirmedEnrollments }
    );
  }

  static enrollmentCountGetSuccess(count: number): EnrollmentSuccess<null> {
    const message = `총 ${count}개의 신청이 있습니다.`;
    return new EnrollmentSuccess<null>(
      message,
      200,
      'ENROLLMENT_COUNT_GET_SUCCESS',
      null,
      { count }
    );
  }

  static enrollmentNotificationSent(): EnrollmentSuccess<null> {
    const message = '신청 알림이 성공적으로 발송되었습니다.';
    return new EnrollmentSuccess<null>(
      message,
      200,
      'ENROLLMENT_NOTIFICATION_SENT',
      null
    );
  }

  static enrollmentReminderSent(): EnrollmentSuccess<null> {
    const message = '신청 리마인더가 성공적으로 발송되었습니다.';
    return new EnrollmentSuccess<null>(
      message,
      200,
      'ENROLLMENT_REMINDER_SENT',
      null
    );
  }

  static enrollmentSearchSuccess<T = unknown>(
    keyword: string,
    count: number,
    data?: T
  ): EnrollmentSuccess<T> {
    const message = `"${keyword}" 검색 결과 ${count}개의 신청을 찾았습니다.`;
    return new EnrollmentSuccess<T>(
      message,
      200,
      'ENROLLMENT_SEARCH_SUCCESS',
      data,
      { count, keyword }
    );
  }

  static enrollmentFilterSuccess<T = unknown>(
    count: number,
    data?: T
  ): EnrollmentSuccess<T> {
    const message = `필터링 결과 ${count}개의 신청을 찾았습니다.`;
    return new EnrollmentSuccess<T>(
      message,
      200,
      'ENROLLMENT_FILTER_SUCCESS',
      data,
      { count }
    );
  }

  static enrollmentExportSuccess<T = unknown>(data?: T): EnrollmentSuccess<T> {
    const message = '신청 데이터가 성공적으로 내보내기되었습니다.';
    return new EnrollmentSuccess<T>(
      message,
      200,
      'ENROLLMENT_EXPORT_SUCCESS',
      data
    );
  }

  static enrollmentReportGenerated<T = unknown>(
    data?: T
  ): EnrollmentSuccess<T> {
    const message = '신청 리포트가 성공적으로 생성되었습니다.';
    return new EnrollmentSuccess<T>(
      message,
      200,
      'ENROLLMENT_REPORT_GENERATED',
      data
    );
  }
}
