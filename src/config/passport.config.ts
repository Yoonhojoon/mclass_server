import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as KakaoStrategy } from 'passport-kakao';
import { Strategy as NaverStrategy } from 'passport-naver';
import { UserService } from '../domains/user/user.service.js';
// TokenService는 현재 사용되지 않으므로 주석 처리
// import { TokenService } from '../domains/token/token.service.js';
import logger from './logger.config.js';

const userService = new UserService();

// OAuth 공통 처리 함수 (파싱된 데이터로 처리)
async function handleOAuthCallback(
  parsedData: {
    email: string;
    name: string;
    socialId: string;
  },
  provider: 'GOOGLE' | 'KAKAO' | 'NAVER',
  done: (error: Error | null, user?: any) => void
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

    // 기존 사용자 확인
    logger.info('🔍 기존 사용자 확인 중...');
    let user = await userService.findByEmail(email);

    if (!user) {
      logger.info('🆕 새 사용자 생성 중...');
      // 새 사용자 생성
      user = await userService.createSocialUser({
        email: email,
        name: name,
        provider: provider,
        socialId: socialId,
      });
      logger.info('✅ 새 사용자 생성 완료:', user.id);
    } else if (user.provider === 'LOCAL') {
      logger.info('🔗 기존 로컬 사용자를 소셜 로그인으로 연결 중...');
      // 기존 로컬 사용자를 소셜 로그인으로 연결
      user = await userService.updateUserProvider(user.id, provider, socialId);
      logger.info('✅ 사용자 소셜 정보 업데이트 완료');
    } else {
      logger.info('✅ 기존 소셜 사용자 확인됨');
    }

    logger.info('👤 최종 사용자 정보:', {
      id: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
    });

    return done(null, user);
  } catch (error) {
    logger.error(`❌ ${provider} OAuth 처리 중 오류 발생:`, error);
    return done(error as Error);
  }
}

// Google OAuth2.0 설정
passport.use(
  new GoogleStrategy(
    {
      clientID:
        process.env.GOOGLE_CLIENT_ID ||
        (() => {
          throw new Error('GOOGLE_CLIENT_ID 환경변수가 설정되지 않았습니다.');
        })(),
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET ||
        (() => {
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
      profile: any,
      done: (error: Error | null, user?: any) => void
    ) => {
      // Google 프로필 파싱
      const parsedData = {
        email: profile.emails?.[0]?.value,
        name: profile.displayName,
        socialId: profile.id,
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
        (() => {
          throw new Error('KAKAO_CLIENT_ID 환경변수가 설정되지 않았습니다.');
        })(),
      clientSecret:
        process.env.KAKAO_CLIENT_SECRET ||
        (() => {
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
      profile: any,
      done: (error: Error | null, user?: any) => void
    ) => {
      // Kakao 프로필 파싱
      const parsedData = {
        email: profile._json?.kakao_account?.email,
        name: profile._json?.properties?.nickname,
        socialId: profile.id.toString(),
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
        (() => {
          throw new Error('NAVER_CLIENT_ID 환경변수가 설정되지 않았습니다.');
        })(),
      clientSecret:
        process.env.NAVER_CLIENT_SECRET ||
        (() => {
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
      profile: any,
      done: (error: Error | null, user?: any) => void
    ) => {
      // Naver 프로필 파싱
      const parsedData = {
        email: profile._json?.email,
        name: profile._json?.name,
        socialId: profile.id,
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
    const user = await userService.findById(id);
    done(null, user);
  } catch (error) {
    done(error as Error);
  }
});

export default passport;
