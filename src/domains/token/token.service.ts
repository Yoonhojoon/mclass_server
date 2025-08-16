import jwt from 'jsonwebtoken';
import { jwtConfig } from '../../config/jwt.config.js';
import { TokenError } from '../../common/exception/token/TokenError.js';
import logger from '../../config/logger.config.js';
import { TokenStorageService } from '../../services/redis/token-storage.service.js';

// JWT 관련 타입 정의
interface JWTDecodedPayload {
  userId: string;
  email: string;
  role: string;
  isAdmin: boolean;
  signUpCompleted: boolean;
  provider?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  aud?: string;
  [key: string]: unknown;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  isAdmin: boolean;
  signUpCompleted: boolean;
  provider?: string;
}

export class TokenService {
  /**
   * 액세스 토큰 생성
   */
  static generateAccessToken(payload: TokenPayload): string {
    logger.debug(
      `[TokenService] 액세스 토큰 생성: 사용자 ID ${payload.userId}`
    );
    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn as any,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });
  }

  /**
   * 액세스 토큰 생성 및 Redis 저장
   */
  static async generateAndStoreAccessToken(
    payload: TokenPayload,
    metadata: {
      device?: string;
      ip?: string;
      userAgent?: string;
    }
  ): Promise<string> {
    const token = this.generateAccessToken(payload);

    await TokenStorageService.storeToken(payload.userId, token, {
      ...metadata,
      tokenType: 'access',
    });

    return token;
  }

  /**
   * 리프레시 토큰 생성
   */
  static generateRefreshToken(payload: TokenPayload): string {
    logger.debug(
      `[TokenService] 리프레시 토큰 생성: 사용자 ID ${payload.userId}`
    );
    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.refreshExpiresIn as any,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });
  }

  /**
   * 리프레시 토큰 생성 및 Redis 저장
   */
  static async generateAndStoreRefreshToken(
    payload: TokenPayload,
    metadata: {
      device?: string;
      ip?: string;
      userAgent?: string;
    }
  ): Promise<string> {
    const token = this.generateRefreshToken(payload);

    await TokenStorageService.storeToken(payload.userId, token, {
      ...metadata,
      tokenType: 'refresh',
    });

    return token;
  }

  /**
   * 액세스 토큰 검증
   */
  static verifyAccessToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, jwtConfig.secret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      }) as TokenPayload;

      logger.debug(
        `[TokenService] 액세스 토큰 검증 성공: 사용자 ID ${payload.userId}`
      );
      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn(`[TokenService] 액세스 토큰 만료`);
        throw TokenError.expiredToken('액세스 토큰이 만료되었습니다');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn(`[TokenService] 유효하지 않은 액세스 토큰`);
        throw TokenError.invalidToken('유효하지 않은 액세스 토큰입니다');
      } else {
        logger.error(`[TokenService] 토큰 검증 실패`, {
          error: error instanceof Error ? error.message : error,
        });
        throw TokenError.tokenVerificationFailed('토큰 검증에 실패했습니다');
      }
    }
  }

  /**
   * 액세스 토큰 검증 (Redis 저장소 확인 포함)
   */
  static async verifyAccessTokenWithStorage(
    token: string
  ): Promise<TokenPayload> {
    // 먼저 Redis 저장소에서 토큰 유효성 확인
    const isValid = await TokenStorageService.isTokenValid(token);
    if (!isValid) {
      logger.warn(`[TokenService] Redis에서 토큰 무효 확인`);
      throw TokenError.invalidToken('토큰이 무효화되었습니다');
    }

    // JWT 검증
    return this.verifyAccessToken(token);
  }

  /**
   * 리프레시 토큰 검증
   */
  static verifyRefreshToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, jwtConfig.secret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      }) as TokenPayload;

      logger.debug(
        `[TokenService] 리프레시 토큰 검증 성공: 사용자 ID ${payload.userId}`
      );
      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn(`[TokenService] 리프레시 토큰 만료`);
        throw TokenError.expiredToken('리프레시 토큰이 만료되었습니다');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn(`[TokenService] 유효하지 않은 리프레시 토큰`);
        throw TokenError.invalidToken('유효하지 않은 리프레시 토큰입니다');
      } else {
        logger.error(`[TokenService] 리프레시 토큰 검증 실패`, {
          error: error instanceof Error ? error.message : error,
        });
        throw TokenError.tokenVerificationFailed('토큰 검증에 실패했습니다');
      }
    }
  }

  /**
   * 토큰 유효성 검사 (만료 여부 포함)
   */
  static isTokenValid(token: string): boolean {
    try {
      jwt.verify(token, jwtConfig.secret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 토큰 만료 시간 확인
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as JWTDecodedPayload | null;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * 토큰에서 페이로드 추출 (검증 없이)
   */
  static decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch {
      return null;
    }
  }

  /**
   * 토큰 타입 확인 (액세스/리프레시)
   */
  static getTokenType(token: string): 'access' | 'refresh' | 'unknown' {
    try {
      const decoded = jwt.decode(token) as JWTDecodedPayload | null;
      if (decoded && decoded.exp) {
        const expiration = new Date(decoded.exp * 1000);
        const now = new Date();
        const timeDiff = expiration.getTime() - now.getTime();

        // 리프레시 토큰은 더 긴 만료 시간을 가짐 (7일 vs 24시간)
        if (timeDiff > 24 * 60 * 60 * 1000) {
          // 24시간 이상
          return 'refresh';
        } else {
          return 'access';
        }
      }
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * 토큰 갱신 (리프레시 토큰으로 새로운 액세스/리프레시 토큰 생성)
   */
  static refreshTokens(refreshToken: string): {
    accessToken: string;
    refreshToken: string;
  } {
    try {
      const payload = this.verifyRefreshToken(refreshToken);

      const newTokenPayload: TokenPayload = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        isAdmin: payload.isAdmin,
        signUpCompleted: payload.signUpCompleted,
        provider: payload.provider,
      };

      const newAccessToken = this.generateAccessToken(newTokenPayload);
      const newRefreshToken = this.generateRefreshToken(newTokenPayload);

      logger.info(`[TokenService] 토큰 갱신 성공: 사용자 ID ${payload.userId}`);
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      logger.error(`[TokenService] 토큰 갱신 실패`, {
        error: error instanceof Error ? error.message : error,
      });
      // 이미 TokenError인 경우 재전파, 그렇지 않으면 일반적인 검증 실패로 처리
      if (error instanceof TokenError) {
        throw error;
      }
      throw TokenError.tokenVerificationFailed('토큰 갱신에 실패했습니다');
    }
  }

  /**
   * 토큰 블랙리스트 추가 (로그아웃용)
   */
  static async invalidateToken(token: string): Promise<void> {
    try {
      // TokenStorageService를 사용하여 토큰 제거
      await TokenStorageService.removeToken(token);
      logger.info(`[TokenService] 토큰 무효화 완료`);
    } catch (error) {
      logger.error(`[TokenService] 토큰 무효화 실패`, {
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  /**
   * 토큰이 블랙리스트에 있는지 확인
   */
  static async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      // TokenStorageService를 사용하여 토큰 유효성 확인
      const isValid = await TokenStorageService.isTokenValid(token);
      return !isValid;
    } catch (error) {
      logger.error(`[TokenService] 토큰 블랙리스트 확인 실패`, {
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }

  /**
   * 토큰 검증 (블랙리스트 확인 포함)
   */
  static async verifyAccessTokenWithBlacklist(
    token: string
  ): Promise<TokenPayload> {
    // TokenStorageService를 사용하여 토큰 검증
    return this.verifyAccessTokenWithStorage(token);
  }
}
