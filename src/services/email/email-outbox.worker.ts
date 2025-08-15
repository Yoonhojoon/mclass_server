import { Logger } from 'winston';
import { prisma } from '../../config/prisma.config';
import { EmailService } from './email.service';
import { EmailOutbox } from '@prisma/client';

export class EmailOutboxWorker {
  constructor(
    private emailService: EmailService,
    private logger: Logger
  ) {}

  async processOutbox(): Promise<void> {
    const pendingEmails = await prisma.emailOutbox.findMany({
      where: {
        OR: [
          { processedAt: null },
          {
            AND: [{ processedAt: null }, { nextTryAt: { lte: new Date() } }],
          },
        ],
        attempts: { lt: 3 }, // 최대 3회 재시도
      },
      orderBy: { createdAt: 'asc' },
      take: 10, // 한 번에 10개씩 처리
    });

    this.logger.info(`이메일 아웃박스 처리 시작: ${pendingEmails.length}개`);

    for (const email of pendingEmails) {
      try {
        await this.sendEmail(email);

        // 성공 시 처리 완료 표시
        await prisma.emailOutbox.update({
          where: { id: email.id },
          data: {
            processedAt: new Date(),
            attempts: { increment: 1 },
          },
        });

        this.logger.info(`이메일 발송 성공: ${email.id}`);
      } catch (error) {
        // 실패 시 재시도 스케줄링
        const nextTryAt = this.calculateNextTryTime(email.attempts);
        await prisma.emailOutbox.update({
          where: { id: email.id },
          data: {
            attempts: { increment: 1 },
            nextTryAt,
            error: error instanceof Error ? error.message : String(error),
          },
        });

        this.logger.error(`이메일 발송 실패: ${email.id}`, {
          error: error instanceof Error ? error.message : String(error),
          attempts: email.attempts + 1,
        });
      }
    }
  }

  async addToOutbox(options: {
    to: string;
    template: string;
    payload: Record<string, any>;
    subject?: string;
    type?: string;
  }): Promise<void> {
    try {
      await prisma.emailOutbox.create({
        data: {
          to: options.to,
          template: options.template,
          payload: options.payload as any,
          subject: options.subject,
          type: options.type as any,
          attempts: 0,
          processedAt: null,
          nextTryAt: null,
          error: null,
        },
      });

      this.logger.info(`이메일 아웃박스에 추가됨: ${options.to}`, {
        template: options.template,
      });
    } catch (error) {
      this.logger.error(`이메일 아웃박스 추가 실패: ${options.to}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private calculateNextTryTime(attempts: number): Date {
    const delays = [5, 15, 60]; // 5분, 15분, 1시간
    const delay = delays[Math.min(attempts, delays.length - 1)];
    return new Date(Date.now() + delay * 60 * 1000);
  }

  private async sendEmail(emailOutbox: EmailOutbox): Promise<void> {
    // 실제 이메일 발송 로직
    await this.emailService.sendTemplateEmail({
      to: emailOutbox.to,
      template: emailOutbox.template,
      data: emailOutbox.payload as Record<string, any>,
    });
  }

  async getOutboxStats(): Promise<{
    pending: number;
    processed: number;
    failed: number;
    total: number;
  }> {
    const [pending, processed, failed, total] = await Promise.all([
      prisma.emailOutbox.count({
        where: { processedAt: null, attempts: { lt: 3 } },
      }),
      prisma.emailOutbox.count({
        where: { processedAt: { not: null } },
      }),
      prisma.emailOutbox.count({
        where: { attempts: { gte: 3 } },
      }),
      prisma.emailOutbox.count(),
    ]);

    return { pending, processed, failed, total };
  }

  async retryFailedEmails(): Promise<void> {
    const failedEmails = await prisma.emailOutbox.findMany({
      where: {
        attempts: { gte: 3 },
        processedAt: null,
      },
    });

    this.logger.info(`실패한 이메일 재시도: ${failedEmails.length}개`);

    for (const email of failedEmails) {
      await prisma.emailOutbox.update({
        where: { id: email.id },
        data: {
          attempts: 0,
          nextTryAt: null,
          error: null,
        },
      });
    }
  }
}
