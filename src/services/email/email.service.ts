import { createTransport, Transporter } from 'nodemailer';
import { Logger } from 'winston';
import { emailTemplates } from './email.templates';

export interface EmailOptions {
  to: string;
  template: string;
  data: Record<string, any>;
  subject?: string;
}

export class EmailService {
  private transporter: Transporter;

  constructor(private logger: Logger) {
    // 환경 변수 검증
    this.validateEmailConfig();

    this.transporter = createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // 추가 설정
      tls: {
        rejectUnauthorized: false,
      },
      debug: process.env.NODE_ENV === 'development', // 개발 환경에서만 디버그 모드
    });

    // 연결 이벤트 리스너 추가
    this.transporter.on('error', error => {
      this.logger.error('이메일 전송기 오류', { error: error.message });
    });

    this.transporter.on('idle', () => {
      this.logger.info('이메일 전송기 준비됨');
    });
  }

  private validateEmailConfig(): void {
    const requiredEnvVars = [
      'EMAIL_HOST',
      'EMAIL_USER',
      'EMAIL_PASS',
      'EMAIL_FROM',
    ];
    const missingVars = requiredEnvVars.filter(
      varName => !process.env[varName]
    );

    if (missingVars.length > 0) {
      this.logger.error('필수 이메일 환경 변수가 누락되었습니다', {
        missing: missingVars,
        currentConfig: {
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          user: process.env.EMAIL_USER ? '설정됨' : '누락',
          pass: process.env.EMAIL_PASS ? '설정됨' : '누락',
          from: process.env.EMAIL_FROM,
        },
      });
      throw new Error(
        `필수 이메일 환경 변수가 누락되었습니다: ${missingVars.join(', ')}`
      );
    }
  }

  async sendTemplateEmail(options: EmailOptions): Promise<void> {
    const { to, template, data, subject } = options;

    try {
      // 템플릿 렌더링
      const html = await this.renderTemplate(template, data);
      const emailSubject = subject || this.getDefaultSubject(template, data);

      // 이메일 발송
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject: emailSubject,
        html,
      });

      this.logger.info(`이메일 발송 완료: ${to}`, {
        template,
        subject: emailSubject,
      });
    } catch (error) {
      this.logger.error(`이메일 발송 실패: ${to}`, {
        error: error instanceof Error ? error.message : String(error),
        template,
        data,
      });
      throw error;
    }
  }

  private async renderTemplate(
    template: string,
    data: Record<string, any>
  ): Promise<string> {
    const templateHtml =
      emailTemplates[template as keyof typeof emailTemplates];

    if (!templateHtml) {
      this.logger.error(`템플릿을 찾을 수 없습니다: ${template}`);
      throw new Error(`템플릿을 찾을 수 없습니다: ${template}`);
    }

    let html = templateHtml;

    // 변수 치환
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`\\[${key}\\]`, 'g');
      html = html.replace(regex, String(value));
    });

    // 사유가 있는 경우에만 표시
    if (data.reason) {
      html = html.replace(
        '[reason]',
        `<li><strong>사유:</strong> ${data.reason}</li>`
      );
    } else {
      html = html.replace('[reason]', '');
    }

    return html;
  }

  private getDefaultSubject(
    template: string,
    data: Record<string, any>
  ): string {
    const subjects: Record<string, string> = {
      'enrollment-status': `[${data.mclassTitle}] 신청이 완료되었습니다.`,
      'enrollment-status-change': `[${data.mclassTitle}] 신청 상태가 변경되었습니다.`,
      'waitlist-promoted': `[${data.mclassTitle}] 대기자 신청이 승인되었습니다.`,
      'enrollment-cancelled': `[${data.mclassTitle}] 신청이 취소되었습니다.`,
    };

    return subjects[template] || 'MClass 신청 알림';
  }

  async verifyConnection(): Promise<boolean> {
    try {
      this.logger.info('이메일 서버 연결 검증 시작...');

      // 연결 검증
      await this.transporter.verify();

      this.logger.info('이메일 서버 연결 확인 완료');
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error('이메일 서버 연결 실패', {
        error: errorMessage,
        config: {
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          user: process.env.EMAIL_USER,
          secure: false,
        },
      });

      // Gmail 특정 오류 메시지 분석
      if (
        errorMessage.includes('535-5.7.8') ||
        errorMessage.includes('Username and Password not accepted')
      ) {
        this.logger.error('Gmail 인증 실패 - 다음 단계를 확인하세요:');
        this.logger.error('1. Gmail 2단계 인증이 활성화되어 있는지 확인');
        this.logger.error('2. 앱 비밀번호가 올바르게 생성되었는지 확인');
        this.logger.error(
          '3. EMAIL_PASS 환경 변수가 앱 비밀번호로 설정되었는지 확인'
        );
        this.logger.error('4. Gmail 계정이 잠기지 않았는지 확인');
      } else if (errorMessage.includes('ECONNREFUSED')) {
        this.logger.error(
          'SMTP 서버 연결 거부 - 호스트/포트 설정을 확인하세요'
        );
      } else if (errorMessage.includes('ETIMEDOUT')) {
        this.logger.error(
          'SMTP 서버 연결 시간 초과 - 네트워크 설정을 확인하세요'
        );
      }

      return false;
    }
  }
}
