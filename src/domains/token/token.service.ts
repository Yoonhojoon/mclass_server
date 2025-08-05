import jwt from 'jsonwebtoken';
import { jwtConfig } from '../../config/jwt.config.js';
import { TokenError } from '../../common/exception/token/TokenError.js';
import { redis } from '../../config/redis.config.js';

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
    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });
  }

  /**
   * 리프레시 토큰 생성
   */
  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.refreshExpiresIn,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });
  }

  /**
   * 액세스 토큰 검증
   */
  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, jwtConfig.secret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      }) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw TokenError.expiredToken('액세스 토큰이 만료되었습니다');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw TokenError.invalidToken('유효하지 않은 액세스 토큰입니다');
      } else {
        throw TokenError.tokenVerificationFailed('토큰 검증에 실패했습니다');
      }
    }
  }

  /**
   * 리프레시 토큰 검증
   */
  static verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, jwtConfig.secret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      }) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw TokenError.expiredToken('리프레시 토큰이 만료되었습니다');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw TokenError.invalidToken('유효하지 않은 리프레시 토큰입니다');
      } else {
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
        signUpCompleted: payload.signUpCompleted,
        provider: payload.provider,
      };

      const newAccessToken = this.generateAccessToken(newTokenPayload);
      const newRefreshToken = this.generateRefreshToken(newTokenPayload);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw TokenError.expiredToken('리프레시 토큰이 만료되었습니다');
    }
  }

  /**
   * 토큰 블랙리스트 추가 (로그아웃용)
   */
  static async invalidateToken(token: string): Promise<void> {
    try {
      // 토큰의 만료 시간을 계산하여 그 시간까지 블랙리스트에 저장
      const decoded = jwt.decode(token) as JWTDecodedPayload | null;
      if (decoded && decoded.exp) {
        const expirationTime = decoded.exp - Math.floor(Date.now() / 1000);
        if (expirationTime > 0) {
          await redis.setex(`blacklist:${token}`, expirationTime, '1');
        }
      }
    } catch (error) {
      console.error('Failed to invalidate token:', error);
    }
  }

  /**
   * 토큰이 블랙리스트에 있는지 확인
   */
  static async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const result = await redis.get(`blacklist:${token}`);
      return result === '1';
    } catch (error) {
      console.error('Failed to check token blacklist:', error);
      return false;
    }
  }

  /**
   * 토큰 검증 (블랙리스트 확인 포함)
   */
  static async verifyAccessTokenWithBlacklist(
    token: string
  ): Promise<TokenPayload> {
    // 먼저 블랙리스트 확인
    const isBlacklisted = await this.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw TokenError.invalidToken('토큰이 무효화되었습니다');
    }

    // 기존 검증 로직
    return this.verifyAccessToken(token);
  }
}
