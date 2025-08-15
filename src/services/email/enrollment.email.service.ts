import { Logger } from 'winston';
import { EmailService } from './email.service.js';
import { Enrollment, User, MClass, EnrollmentStatus } from '@prisma/client';

export class EnrollmentEmailService {
  constructor(
    private emailService: EmailService,
    private logger: Logger
  ) {}

  async sendEnrollmentConfirmation(
    enrollment: Enrollment,
    user: User,
    mclass: MClass
  ): Promise<void> {
    try {
      await this.emailService.sendTemplateEmail({
        to: user.email,
        template: 'enrollment-status',
        data: {
          enrollmentId: enrollment.id,
          mclassTitle: mclass.title,
          status: this.getStatusText(enrollment.status),
          appliedAt: enrollment.appliedAt.toLocaleString('ko-KR'),
          userName: user.name,
        },
      });

      this.logger.info(`신청 완료 이메일 발송: ${user.email}`, {
        enrollmentId: enrollment.id,
        mclassTitle: mclass.title,
      });
    } catch (error) {
      this.logger.error(`신청 완료 이메일 발송 실패: ${user.email}`, {
        error: error instanceof Error ? error.message : String(error),
        enrollmentId: enrollment.id,
      });
      throw error;
    }
  }

  async sendStatusChangeNotification(
    enrollment: Enrollment,
    user: User,
    mclass: MClass,
    previousStatus: EnrollmentStatus,
    reason?: string
  ): Promise<void> {
    try {
      await this.emailService.sendTemplateEmail({
        to: user.email,
        template: 'enrollment-status-change',
        data: {
          enrollmentId: enrollment.id,
          mclassTitle: mclass.title,
          previousStatus: this.getStatusText(previousStatus),
          currentStatus: this.getStatusText(enrollment.status),
          changedAt:
            enrollment.decidedAt?.toLocaleString('ko-KR') ||
            new Date().toLocaleString('ko-KR'),
          reason,
          userName: user.name,
        },
      });

      this.logger.info(`상태 변경 이메일 발송: ${user.email}`, {
        enrollmentId: enrollment.id,
        previousStatus,
        currentStatus: enrollment.status,
      });
    } catch (error) {
      this.logger.error(`상태 변경 이메일 발송 실패: ${user.email}`, {
        error: error instanceof Error ? error.message : String(error),
        enrollmentId: enrollment.id,
      });
      throw error;
    }
  }

  async sendWaitlistApproval(
    enrollment: Enrollment,
    user: User,
    mclass: MClass
  ): Promise<void> {
    try {
      await this.emailService.sendTemplateEmail({
        to: user.email,
        template: 'waitlist-promoted',
        data: {
          enrollmentId: enrollment.id,
          mclassTitle: mclass.title,
          approvedAt:
            enrollment.decidedAt?.toLocaleString('ko-KR') ||
            new Date().toLocaleString('ko-KR'),
          userName: user.name,
        },
      });

      this.logger.info(`대기자 승인 이메일 발송: ${user.email}`, {
        enrollmentId: enrollment.id,
        mclassTitle: mclass.title,
      });
    } catch (error) {
      this.logger.error(`대기자 승인 이메일 발송 실패: ${user.email}`, {
        error: error instanceof Error ? error.message : String(error),
        enrollmentId: enrollment.id,
      });
      throw error;
    }
  }

  async sendEnrollmentCancellation(
    enrollment: Enrollment,
    user: User,
    mclass: MClass
  ): Promise<void> {
    try {
      await this.emailService.sendTemplateEmail({
        to: user.email,
        template: 'enrollment-cancelled',
        data: {
          enrollmentId: enrollment.id,
          mclassTitle: mclass.title,
          cancelledAt: new Date().toLocaleString('ko-KR'),
          userName: user.name,
        },
      });

      this.logger.info(`신청 취소 이메일 발송: ${user.email}`, {
        enrollmentId: enrollment.id,
        mclassTitle: mclass.title,
      });
    } catch (error) {
      this.logger.error(`신청 취소 이메일 발송 실패: ${user.email}`, {
        error: error instanceof Error ? error.message : String(error),
        enrollmentId: enrollment.id,
      });
      throw error;
    }
  }

  private getStatusText(status: EnrollmentStatus): string {
    const statusMap: Record<EnrollmentStatus, string> = {
      APPLIED: '신청됨',
      APPROVED: '승인됨',
      REJECTED: '거절됨',
      WAITLISTED: '대기자',
      CANCELED: '취소됨',
    };

    return statusMap[status] || status;
  }
}
