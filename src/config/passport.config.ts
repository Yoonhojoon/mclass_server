import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as KakaoStrategy } from 'passport-kakao';
import { Strategy as NaverStrategy } from 'passport-naver';
import { AuthService } from '../domains/auth/auth.service.js';
import logger from './logger.config.js';
import { prisma } from './prisma.config.js';

const authService = new AuthService(prisma);

// OAuth 공통 처리 함수 (파싱된 데이터로 처리)
async function handleOAuthCallback(
  parsedData: {
    email: string;
    name: string;
    socialId: string;
  },
  provider: 'GOOGLE' | 'KAKAO' | 'NAVER',
  done: (error: Error | null, user?: unknown) => void
): Promise<void> {
  try {
    logger.info(`🔐 ${provider} OAuth 인증 시작`);
    logger.info(`✅ ${provider}에서 파싱된 정보:`, {
      email: parsedData.email,
      name: parsedData.name,
      socialId: parsedData.socialId,
    });

    const { email, name, socialId } = parsedData;

    if (!email) {
      logger.error(`❌ ${provider}에서 이메일 정보를 제공하지 않음`);
      return done(new Error(`Email not provided by ${provider}`));
    }

    // AuthService를 사용하여 소셜 로그인 처리
    logger.info('🔍 소셜 로그인 처리 중...');
    const result = await authService.handleSocialLogin(
      provider === 'GOOGLE'
        ? {
            email: email,
            name: name || undefined,
            provider: 'google' as const,
            sub: socialId,
          }
        : {
            email: email,
            name: name || undefined,
            provider: 'kakao' as const,
            kakaoId: socialId,
          }
    );

    logger.info('👤 최종 사용자 정보:', {
      id: result.user.userId,
      email: result.user.email,
      name: result.user.name,
      provider: provider,
    });

    return done(null, result.user);
  } catch (error) {
    logger.error(`❌ ${provider} OAuth 처리 중 오류 발생:`, error);
    return done(error as Error);
  }
}

// Google OAuth2.0 설정
passport.use(
  new (GoogleStrategy as any)(
    {
      clientID:
        process.env.GOOGLE_CLIENT_ID ||
        ((): never => {
          throw new Error('GOOGLE_CLIENT_ID 환경변수가 설정되지 않았습니다.');
        })(),
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET ||
        ((): never => {
          throw new Error(
            'GOOGLE_CLIENT_SECRET 환경변수가 설정되지 않았습니다.'
          );
        })(),
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:3000/auth/google/callback',
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: unknown,
      done: (error: Error | null, user?: unknown) => void
    ): Promise<void> => {
      // Google 프로필 파싱
      const parsedData = {
        email: (profile as any).emails?.[0]?.value,
        name: (profile as any).displayName,
        socialId: (profile as any).id,
      };

      await handleOAuthCallback(parsedData, 'GOOGLE', done);
    }
  )
);

// Kakao OAuth 설정
passport.use(
  new KakaoStrategy(
    {
      clientID:
        process.env.KAKAO_CLIENT_ID ||
        ((): never => {
          throw new Error('KAKAO_CLIENT_ID 환경변수가 설정되지 않았습니다.');
        })(),
      clientSecret:
        process.env.KAKAO_CLIENT_SECRET ||
        ((): never => {
          throw new Error(
            'KAKAO_CLIENT_SECRET 환경변수가 설정되지 않았습니다.'
          );
        })(),
      callbackURL:
        process.env.KAKAO_CALLBACK_URL ||
        'http://localhost:3000/auth/kakao/callback',
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: unknown,
      done: (error: Error | null, user?: unknown) => void
    ): Promise<void> => {
      // Kakao 프로필 파싱
      const parsedData = {
        email: (profile as any)._json?.kakao_account?.email,
        name: (profile as any)._json?.properties?.nickname,
        socialId: (profile as any).id.toString(),
      };

      await handleOAuthCallback(parsedData, 'KAKAO', done);
    }
  ) as any
);

// Naver OAuth 설정
passport.use(
  new NaverStrategy(
    {
      clientID:
        process.env.NAVER_CLIENT_ID ||
        ((): never => {
          throw new Error('NAVER_CLIENT_ID 환경변수가 설정되지 않았습니다.');
        })(),
      clientSecret:
        process.env.NAVER_CLIENT_SECRET ||
        ((): never => {
          throw new Error(
            'NAVER_CLIENT_SECRET 환경변수가 설정되지 않았습니다.'
          );
        })(),
      callbackURL:
        process.env.NAVER_CALLBACK_URL ||
        'http://localhost:3000/auth/naver/callback',
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: unknown,
      done: (error: Error | null, user?: unknown) => void
    ): Promise<void> => {
      // Naver 프로필 파싱
      const parsedData = {
        email: (profile as any)._json?.email,
        name: (profile as any)._json?.name,
        socialId: (profile as any).id,
      };

      await handleOAuthCallback(parsedData, 'NAVER', done);
    }
  ) as any
);

// 사용자 직렬화
passport.serializeUser((user: any, done): void => {
  done(null, user.id);
});

// 사용자 역직렬화
passport.deserializeUser(async (id: string, done): Promise<void> => {
  try {
    const user = await authService['userService'].findById(id);
    done(null, user);
  } catch (error) {
    done(error as Error);
  }
});

export default passport;
