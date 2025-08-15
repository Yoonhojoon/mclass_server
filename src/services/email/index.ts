export { EmailService } from './email.service.js';
export { EmailOutboxWorker } from './email-outbox.worker.js';
export { EnrollmentEmailService } from './enrollment.email.service.js';
export { emailTemplates } from './email.templates.js';

import { Logger } from 'winston';
import { EmailService } from './email.service.js';

/**
 * 서비스 컨테이너 - 싱글톤 인스턴스들을 관리
 */
class ServiceContainer {
  private static emailService: EmailService | null = null;

  /**
   * EmailService 인스턴스를 반환합니다.
   * @param logger Winston 로거 인스턴스
   * @returns EmailService 인스턴스
   */
  static getEmailService(logger: Logger): EmailService {
    if (!this.emailService) {
      this.emailService = EmailService.getInstance(logger);
    }
    return this.emailService;
  }

  /**
   * 모든 서비스 인스턴스를 초기화합니다. (테스트용)
   */
  static reset(): void {
    this.emailService = null;
    EmailService.resetInstance();
  }
}

export { ServiceContainer };

export type { EmailOptions } from './email.service.js';
