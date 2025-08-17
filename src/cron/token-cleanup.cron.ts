import { CronJob } from 'cron';
import { TokenStorageService } from '../services/redis/token-storage.service.js';
import logger from '../config/logger.config.js';

/**
 * 만료된 토큰 정리 크론 작업
 * 매일 새벽 3시에 실행
 */
export const tokenCleanupJob = new CronJob(
  '0 3 * * *', // 매일 새벽 3시
  async () => {
    try {
      logger.info('🧹 만료된 토큰 정리 작업 시작');

      const cleanedCount = await TokenStorageService.cleanupExpiredTokens();

      logger.info('✅ 만료된 토큰 정리 작업 완료', {
        cleanedCount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('❌ 만료된 토큰 정리 작업 실패', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  },
  null,
  false, // 자동 시작하지 않음
  'Asia/Seoul'
);

/**
 * 토큰 정리 작업 시작
 */
export const startTokenCleanupJob = (): void => {
  tokenCleanupJob.start();
  logger.info('🕐 토큰 정리 크론 작업 시작됨');
};

/**
 * 토큰 정리 작업 중지
 */
export const stopTokenCleanupJob = (): void => {
  tokenCleanupJob.stop();
  logger.info('🛑 토큰 정리 크론 작업 중지됨');
};
