import { createHash } from 'crypto';
import { Buffer } from 'buffer';
import { redis } from '../../config/redis.config.js';
import logger from '../../config/logger.config.js';

export interface TokenMetadata {
  userId: string;
  device?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
  expiresAt: string;
  tokenType: 'access' | 'refresh';
  tokenHash: string; // 토큰 해시를 메타데이터에 포함
}

export class TokenStorageService {
  private static readonly USER_TOKENS_PREFIX = 'user_tokens:';
  private static readonly TOKEN_META_PREFIX = 'token_meta:';
  private static readonly BLACKLIST_PREFIX = 'blacklist:';

  /**
   * 사용자 토큰을 Redis에 저장
   */
  static async storeToken(
    userId: string,
    token: string,
    metadata: Omit<
      TokenMetadata,
      'userId' | 'createdAt' | 'expiresAt' | 'tokenHash'
    >
  ): Promise<void> {
    try {
      const tokenHash = this.hashToken(token);
      const now = new Date();
      const expiresAt = this.getTokenExpiration(token);

      if (!expiresAt) {
        throw new Error('토큰 만료 시간을 확인할 수 없습니다.');
      }

      const tokenMetadata: TokenMetadata = {
        userId,
        ...metadata,
        tokenHash, // 토큰 해시를 메타데이터에 포함
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      const ttl = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);

      logger.info('🔍 토큰 저장 시작', {
        userId,
        tokenHash,
        ttl,
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...',
      });

      // Redis 연결 상태 확인 및 재연결 시도
      logger.info('🔍 Redis 연결 상태 확인', {
        status: redis.status,
        connected: redis.status === 'ready',
        options: {
          host: redis.options.host,
          port: redis.options.port,
          db: redis.options.db,
        },
      });

      // Redis 데이터베이스 선택 확인
      try {
        const currentDb = await redis.eval(
          'return redis.call("SELECT", redis.call("CLIENT", "GETNAME"))',
          0
        );
        logger.info('🔍 Redis 현재 데이터베이스 확인', { currentDb });
      } catch (dbError) {
        logger.warn('⚠️ Redis 데이터베이스 확인 실패', { error: dbError });
      }

      if (!redis.status || redis.status !== 'ready') {
        logger.warn('⚠️ Redis 연결 상태 확인 중...', { status: redis.status });
        try {
          await redis.ping();
          logger.info('✅ Redis PING 성공');
        } catch (pingError) {
          logger.error('❌ Redis PING 실패', { error: pingError });
          throw new Error('Redis 연결이 불안정합니다');
        }
      }

      // Redis 데이터베이스 선택 강제 설정
      try {
        await redis.select(0);
        logger.info('✅ Redis 데이터베이스 0 선택 완료');
      } catch (selectError) {
        logger.error('❌ Redis 데이터베이스 선택 실패', { error: selectError });
      }

      // Redis 트랜잭션으로 원자적 저장
      const pipeline = redis.pipeline();

      // 토큰 메타데이터 저장 (토큰 해시를 키로 사용)
      const metaKey = `${this.TOKEN_META_PREFIX}${tokenHash}`;
      const metaValue = JSON.stringify(tokenMetadata);
      pipeline.setex(metaKey, ttl, metaValue);

      // 사용자별 토큰 목록에 토큰 해시 추가
      const userKey = `${this.USER_TOKENS_PREFIX}${userId}`;
      pipeline.sadd(userKey, tokenHash);

      // 사용자 토큰 목록 만료 시간 설정 (토큰보다 조금 더 길게)
      pipeline.expire(userKey, ttl + 3600);

      logger.info('🔍 Redis 명령어 준비 완료', {
        metaKey,
        userKey,
        metaValueLength: metaValue.length,
        ttl,
      });

      const results = await pipeline.exec();

      if (!results) {
        throw new Error('Redis pipeline 실행 실패');
      }

      // 각 명령어의 결과 확인
      results.forEach((result, index) => {
        if (result[0]) {
          logger.error(`Redis 명령어 ${index} 실패:`, result[0]);
        } else {
          logger.info(`Redis 명령어 ${index} 성공:`, result[1]);
        }
      });

      // 저장 후 실제로 데이터가 있는지 확인
      const savedMeta = await redis.get(metaKey);
      const savedUserTokens = await redis.smembers(userKey);

      logger.info('✅ 토큰 저장 완료', {
        userId,
        tokenHash,
        device: metadata.device,
        ttl,
        results: results.map(r => (r[0] === null ? '성공' : '실패')),
        savedMetaExists: !!savedMeta,
        savedUserTokensCount: savedUserTokens.length,
        savedUserTokens,
        metaKey,
        userKey,
      });

      // 추가 디버깅: Redis에 실제로 저장되었는지 확인
      const allKeys = await redis.keys('*');
      logger.info('🔍 Redis 전체 키 확인', {
        totalKeys: allKeys.length,
        keys: allKeys.slice(0, 10), // 처음 10개만 로그
      });
    } catch (error) {
      logger.error('❌ 토큰 저장 실패', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * 토큰 메타데이터 조회
   */
  static async getTokenMetadata(token: string): Promise<TokenMetadata | null> {
    try {
      const tokenHash = this.hashToken(token);
      const metadataJson = await redis.get(
        `${this.TOKEN_META_PREFIX}${tokenHash}`
      );

      if (!metadataJson) {
        return null;
      }

      return JSON.parse(metadataJson) as TokenMetadata;
    } catch (error) {
      logger.error('❌ 토큰 메타데이터 조회 실패', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * 사용자의 모든 활성 토큰 조회
   */
  static async getUserTokens(userId: string): Promise<TokenMetadata[]> {
    try {
      const tokenHashes = await redis.smembers(
        `${this.USER_TOKENS_PREFIX}${userId}`
      );

      if (tokenHashes.length === 0) {
        return [];
      }

      const pipeline = redis.pipeline();
      tokenHashes.forEach(hash => {
        pipeline.get(`${this.TOKEN_META_PREFIX}${hash}`);
      });

      const results = await pipeline.exec();
      const tokens: TokenMetadata[] = [];

      if (results) {
        results.forEach((result, index) => {
          if (result[0] === null && result[1]) {
            try {
              const metadata = JSON.parse(result[1] as string) as TokenMetadata;
              tokens.push(metadata);
            } catch {
              logger.warn('토큰 메타데이터 파싱 실패', {
                tokenHash: tokenHashes[index],
              });
            }
          }
        });
      }

      return tokens;
    } catch (error) {
      logger.error('❌ 사용자 토큰 조회 실패', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * 특정 토큰 제거 (개별 기기 로그아웃)
   */
  static async removeToken(token: string): Promise<boolean> {
    try {
      const tokenHash = this.hashToken(token);
      const metadata = await this.getTokenMetadata(token);

      if (!metadata) {
        return false;
      }

      const pipeline = redis.pipeline();

      // 토큰 메타데이터 삭제
      pipeline.del(`${this.TOKEN_META_PREFIX}${tokenHash}`);

      // 사용자 토큰 목록에서 제거
      pipeline.srem(`${this.USER_TOKENS_PREFIX}${metadata.userId}`, tokenHash);

      // 블랙리스트에 추가
      const ttl = this.getTokenTTL(token);
      if (ttl > 0) {
        pipeline.setex(`${this.BLACKLIST_PREFIX}${token}`, ttl, '1');
      }

      await pipeline.exec();

      logger.info('✅ 토큰 제거 완료', {
        userId: metadata.userId,
        tokenHash,
        device: metadata.device,
      });

      return true;
    } catch (error) {
      logger.error('❌ 토큰 제거 실패', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * 사용자의 모든 토큰 제거 (전체 로그아웃)
   */
  static async removeAllUserTokens(userId: string): Promise<number> {
    try {
      const tokens = await this.getUserTokens(userId);

      if (tokens.length === 0) {
        return 0;
      }

      const pipeline = redis.pipeline();
      let removedCount = 0;

      // 각 토큰을 블랙리스트에 추가하고 메타데이터 삭제
      for (const tokenMeta of tokens) {
        // 토큰 메타데이터에서 토큰 해시를 사용
        const tokenHash = tokenMeta.tokenHash;
        pipeline.del(`${this.TOKEN_META_PREFIX}${tokenHash}`);

        // 블랙리스트에 추가 (실제 토큰이 없으므로 만료 시간만큼)
        const expiresAt = new Date(tokenMeta.expiresAt);
        const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
        if (ttl > 0) {
          pipeline.setex(`${this.BLACKLIST_PREFIX}${tokenHash}`, ttl, '1');
        }

        removedCount++;
      }

      // 사용자 토큰 목록 삭제
      pipeline.del(`${this.USER_TOKENS_PREFIX}${userId}`);

      await pipeline.exec();

      logger.info('✅ 사용자 모든 토큰 제거 완료', {
        userId,
        removedCount,
      });

      return removedCount;
    } catch (error) {
      logger.error('❌ 사용자 모든 토큰 제거 실패', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  /**
   * 토큰이 유효한지 확인 (블랙리스트 포함)
   */
  static async isTokenValid(token: string): Promise<boolean> {
    try {
      // 블랙리스트 확인
      // 블랙리스트 확인 (토큰 해시 기준)
      const tokenHash = this.hashToken(token);
      const isBlacklisted = await redis.get(
        `${this.BLACKLIST_PREFIX}${tokenHash}`
      );
      if (isBlacklisted) {
        return false;
      }

      // 메타데이터 확인
      const metadata = await this.getTokenMetadata(token);
      if (!metadata) {
        return false;
      }

      // 만료 시간 확인
      const expiresAt = new Date(metadata.expiresAt);
      return expiresAt > new Date();
    } catch (error) {
      logger.error('❌ 토큰 유효성 확인 실패', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * 사용자별 활성 세션 수 조회
   */
  static async getUserActiveSessionCount(userId: string): Promise<number> {
    try {
      const tokens = await this.getUserTokens(userId);
      return tokens.length;
    } catch (error) {
      logger.error('❌ 사용자 활성 세션 수 조회 실패', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  /**
   * 만료된 토큰 정리 (정기적으로 실행)
   */
  static async cleanupExpiredTokens(): Promise<number> {
    try {
      // 모든 사용자 토큰 목록 조회
      const userKeys = await redis.keys(`${this.USER_TOKENS_PREFIX}*`);
      let cleanedCount = 0;

      for (const userKey of userKeys) {
        const userId = userKey.replace(this.USER_TOKENS_PREFIX, '');
        const tokens = await this.getUserTokens(userId);

        const pipeline = redis.pipeline();
        let hasExpired = false;

        for (const tokenMeta of tokens) {
          const expiresAt = new Date(tokenMeta.expiresAt);
          if (expiresAt <= new Date()) {
            // 토큰 메타데이터 삭제
            pipeline.del(`${this.TOKEN_META_PREFIX}${tokenMeta.tokenType}`);
            // 사용자 토큰 목록에서 제거
            pipeline.srem(userKey, tokenMeta.tokenType);
            hasExpired = true;
            cleanedCount++;
          }
        }

        if (hasExpired) {
          await pipeline.exec();
        }
      }

      logger.info('✅ 만료된 토큰 정리 완료', { cleanedCount });
      return cleanedCount;
    } catch (error) {
      logger.error('❌ 만료된 토큰 정리 실패', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  /**
   * 토큰 해시 생성
   */
  private static hashToken(token: string): string {
    // SHA-256 해시 사용으로 변경
    return createHash('sha256').update(token).digest('hex').substring(0, 16);
  }

  /**
   * 토큰 만료 시간 조회
   */
  private static getTokenExpiration(token: string): Date | null {
    try {
      const payload = this.extractPayloadFromToken(token) as { exp?: number };
      if (payload && payload.exp) {
        return new Date(payload.exp * 1000);
      }
      return null;
    } catch {
      logger.error('[TokenStorageService] 토큰 만료 시간 조회 실패');
      return null;
    }
  }

  /**
   * 토큰 TTL 조회
   */
  private static getTokenTTL(token: string): number {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) {
      return 0;
    }
    return Math.floor((expiration.getTime() - Date.now()) / 1000);
  }

  /**
   * JWT 토큰에서 페이로드 추출
   */
  static extractPayloadFromToken(token: string): unknown {
    try {
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      );
      return payload;
    } catch {
      logger.error('[TokenStorageService] 토큰 페이로드 추출 실패');
      return null;
    }
  }
}
