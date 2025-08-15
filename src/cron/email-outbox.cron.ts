import { CronJob } from 'cron';
import { EmailOutboxWorker } from '../services/email/email-outbox.worker.js';
import { Logger } from 'winston';

export class EmailOutboxCron {
  private worker: EmailOutboxWorker;
  private job: CronJob;
  private logger: Logger;

  constructor(worker: EmailOutboxWorker, logger: Logger) {
    this.worker = worker;
    this.logger = logger;

    // 매 1분마다 실행
    this.job = new CronJob('0 * * * * *', async () => {
      try {
        await this.worker.processOutbox();
      } catch (error) {
        this.logger.error('이메일 아웃박스 처리 실패:', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  start(): void {
    this.job.start();
    this.logger.info('이메일 아웃박스 Cron Job이 시작되었습니다.');
  }

  stop(): void {
    this.job.stop();
    this.logger.info('이메일 아웃박스 Cron Job이 중지되었습니다.');
  }

  isRunning(): boolean {
    return (this.job as any).running || false;
  }
}
