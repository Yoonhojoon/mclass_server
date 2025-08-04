import { BaseSuccess } from '../BaseSuccess.js';

export class EnrollmentSuccess extends BaseSuccess {
  constructor(
    message: string,
    statusCode: number = 200,
    successCode: string = 'ENROLLMENT_SUCCESS',
    data?: unknown
  ) {
    super(message, statusCode, successCode, data);
  }

  static enrollmentSuccess(
    className: string,
    enrollmentId: string,
    data?: unknown
  ): EnrollmentSuccess {
    const message = `"${className}" 클래스 신청이 성공적으로 완료되었습니다. (신청 ID: ${enrollmentId})`;
    return new EnrollmentSuccess(message, 201, 'ENROLLMENT_SUCCESS', data);
  }

  static enrollmentCancellationSuccess(className: string): EnrollmentSuccess {
    const message = `"${className}" 클래스 신청이 성공적으로 취소되었습니다.`;
    return new EnrollmentSuccess(
      message,
      200,
      'ENROLLMENT_CANCELLATION_SUCCESS'
    );
  }

  static enrollmentUpdateSuccess(data?: unknown): EnrollmentSuccess {
    const message = '신청 정보가 성공적으로 업데이트되었습니다.';
    return new EnrollmentSuccess(
      message,
      200,
      'ENROLLMENT_UPDATE_SUCCESS',
      data
    );
  }

  static enrollmentGetSuccess(data?: unknown): EnrollmentSuccess {
    const message = '신청 정보를 성공적으로 조회했습니다.';
    return new EnrollmentSuccess(message, 200, 'ENROLLMENT_GET_SUCCESS', data);
  }

  static enrollmentListGetSuccess(
    count: number,
    data?: unknown
  ): EnrollmentSuccess {
    const message = `총 ${count}개의 신청 내역을 성공적으로 조회했습니다.`;
    return new EnrollmentSuccess(
      message,
      200,
      'ENROLLMENT_LIST_GET_SUCCESS',
      data
    );
  }

  static enrollmentDetailsGetSuccess(data?: unknown): EnrollmentSuccess {
    const message = '신청 상세 정보를 성공적으로 조회했습니다.';
    return new EnrollmentSuccess(
      message,
      200,
      'ENROLLMENT_DETAILS_GET_SUCCESS',
      data
    );
  }

  static enrollmentStatusUpdateSuccess(newStatus: string): EnrollmentSuccess {
    const message = `신청 상태가 "${newStatus}"로 성공적으로 업데이트되었습니다.`;
    return new EnrollmentSuccess(
      message,
      200,
      'ENROLLMENT_STATUS_UPDATE_SUCCESS'
    );
  }

  static enrollmentConfirmationSuccess(
    enrollmentId: string
  ): EnrollmentSuccess {
    const message = `신청이 성공적으로 확정되었습니다. (신청 ID: ${enrollmentId})`;
    return new EnrollmentSuccess(
      message,
      200,
      'ENROLLMENT_CONFIRMATION_SUCCESS'
    );
  }

  static enrollmentWaitlistSuccess(
    className: string,
    position: number
  ): EnrollmentSuccess {
    const message = `"${className}" 클래스 대기자 명단 ${position}번째로 추가되었습니다.`;
    return new EnrollmentSuccess(message, 200, 'ENROLLMENT_WAITLIST_SUCCESS');
  }

  static enrollmentStatsGetSuccess(
    totalEnrollments: number,
    confirmedEnrollments: number,
    data?: unknown
  ): EnrollmentSuccess {
    const message = `총 ${totalEnrollments}개 신청 중 ${confirmedEnrollments}개 확정되었습니다.`;
    return new EnrollmentSuccess(
      message,
      200,
      'ENROLLMENT_STATS_GET_SUCCESS',
      data
    );
  }

  static enrollmentCountGetSuccess(count: number): EnrollmentSuccess {
    const message = `신청 수를 성공적으로 조회했습니다. (총 ${count}개)`;
    return new EnrollmentSuccess(message, 200, 'ENROLLMENT_COUNT_GET_SUCCESS');
  }

  static enrollmentNotificationSent(): EnrollmentSuccess {
    const message = '신청 관련 알림이 발송되었습니다.';
    return new EnrollmentSuccess(message, 200, 'ENROLLMENT_NOTIFICATION_SENT');
  }

  static enrollmentReminderSent(): EnrollmentSuccess {
    const message = '신청 관련 리마인더가 발송되었습니다.';
    return new EnrollmentSuccess(message, 200, 'ENROLLMENT_REMINDER_SENT');
  }

  static enrollmentSearchSuccess(
    keyword: string,
    count: number,
    data?: unknown
  ): EnrollmentSuccess {
    const message = `"${keyword}" 검색 결과 ${count}개의 신청 내역을 찾았습니다.`;
    return new EnrollmentSuccess(
      message,
      200,
      'ENROLLMENT_SEARCH_SUCCESS',
      data
    );
  }

  static enrollmentFilterSuccess(
    count: number,
    data?: unknown
  ): EnrollmentSuccess {
    const message = `필터링 결과 ${count}개의 신청 내역을 찾았습니다.`;
    return new EnrollmentSuccess(
      message,
      200,
      'ENROLLMENT_FILTER_SUCCESS',
      data
    );
  }

  static enrollmentExportSuccess(data?: unknown): EnrollmentSuccess {
    const message = '신청 데이터가 성공적으로 내보내졌습니다.';
    return new EnrollmentSuccess(
      message,
      200,
      'ENROLLMENT_EXPORT_SUCCESS',
      data
    );
  }

  static enrollmentReportGenerated(data?: unknown): EnrollmentSuccess {
    const message = '신청 리포트가 성공적으로 생성되었습니다.';
    return new EnrollmentSuccess(
      message,
      200,
      'ENROLLMENT_REPORT_GENERATED',
      data
    );
  }
}
