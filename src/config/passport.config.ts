import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as KakaoStrategy } from 'passport-kakao';
import { Strategy as NaverStrategy } from 'passport-naver';
import { UserService } from '../domains/user/user.service.js';
// TokenService는 현재 사용되지 않으므로 주석 처리
// import { TokenService } from '../domains/token/token.service.js';
import logger from './logger.config.js';

const userService = new UserService();

// Google OAuth2.0 설정
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:3000/auth/google/callback',
    },
    async (accessToken: any, refreshToken: any, profile: any, done: any) => {
      try {
        logger.info('🔐 Google OAuth 인증 시작');
        logger.debug('📧 받은 프로필 정보:', {
          id: profile.id,
          displayName: profile.displayName,
          emails: profile.emails?.map((e: any) => e.value),
        });

        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const socialId = profile.id;

        if (!email) {
          logger.error('❌ Google에서 이메일 정보를 제공하지 않음');
          return done(new Error('Email not provided by Google'));
        }

        logger.info('✅ Google에서 이메일 정보 수신:', email);

        // 기존 사용자 확인
        logger.info('🔍 기존 사용자 확인 중...');
        let user = await userService.findByEmail(email);

        if (!user) {
          logger.info('🆕 새 사용자 생성 중...');
          // 새 사용자 생성
          user = await userService.createSocialUser({
            email,
            name,
            provider: 'GOOGLE',
            social_id: socialId,
          });
          logger.info('✅ 새 사용자 생성 완료:', user.id);
        } else if (user.provider === 'LOCAL') {
          logger.info('🔗 기존 로컬 사용자를 소셜 로그인으로 연결 중...');
          // 기존 로컬 사용자를 소셜 로그인으로 연결
          user = await userService.updateUserProvider(
            user.id,
            'GOOGLE',
            socialId
          );
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
        logger.error('❌ Google OAuth 처리 중 오류 발생:', error);
        return done(error);
      }
    }
  )
);

// Kakao OAuth 설정
passport.use(
  new KakaoStrategy(
    {
      clientID: process.env.KAKAO_CLIENT_ID || '',
      clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
      callbackURL:
        process.env.KAKAO_CALLBACK_URL ||
        'http://localhost:3000/auth/kakao/callback',
    },
    async (accessToken: any, refreshToken: any, profile: any, done: any) => {
      try {
        logger.info('🔐 Kakao OAuth 인증 시작');
        logger.debug('📧 받은 프로필 정보:', {
          id: profile.id,
          nickname: profile._json?.properties?.nickname,
          email: profile._json?.kakao_account?.email,
        });

        const email = profile._json?.kakao_account?.email;
        const name = profile._json?.properties?.nickname;
        const socialId = profile.id.toString();

        if (!email) {
          logger.error('❌ Kakao에서 이메일 정보를 제공하지 않음');
          return done(new Error('Email not provided by Kakao'));
        }

        logger.info('✅ Kakao에서 이메일 정보 수신:', email);

        // 기존 사용자 확인
        logger.info('🔍 기존 사용자 확인 중...');
        let user = await userService.findByEmail(email);

        if (!user) {
          logger.info('🆕 새 사용자 생성 중...');
          // 새 사용자 생성
          user = await userService.createSocialUser({
            email,
            name,
            provider: 'KAKAO',
            social_id: socialId,
          });
          logger.info('✅ 새 사용자 생성 완료:', user.id);
        } else if (user.provider === 'LOCAL') {
          logger.info('🔗 기존 로컬 사용자를 소셜 로그인으로 연결 중...');
          // 기존 로컬 사용자를 소셜 로그인으로 연결
          user = await userService.updateUserProvider(
            user.id,
            'KAKAO',
            socialId
          );
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
        logger.error('❌ Kakao OAuth 처리 중 오류 발생:', error);
        return done(error);
      }
    }
  )
);

// Naver OAuth 설정
passport.use(
  new NaverStrategy(
    {
      clientID: process.env.NAVER_CLIENT_ID || '',
      clientSecret: process.env.NAVER_CLIENT_SECRET || '',
      callbackURL:
        process.env.NAVER_CALLBACK_URL ||
        'http://localhost:3000/auth/naver/callback',
    },
    async (accessToken: any, refreshToken: any, profile: any, done: any) => {
      try {
        logger.info('🔐 Naver OAuth 인증 시작');
        logger.debug('📧 받은 프로필 정보:', {
          id: profile.id,
          name: profile._json?.name,
          email: profile._json?.email,
        });

        const email = profile._json?.email;
        const name = profile._json?.name;
        const socialId = profile.id;

        if (!email) {
          logger.error('❌ Naver에서 이메일 정보를 제공하지 않음');
          return done(new Error('Email not provided by Naver'));
        }

        logger.info('✅ Naver에서 이메일 정보 수신:', email);

        // 기존 사용자 확인
        logger.info('🔍 기존 사용자 확인 중...');
        let user = await userService.findByEmail(email);

        if (!user) {
          logger.info('🆕 새 사용자 생성 중...');
          // 새 사용자 생성
          user = await userService.createSocialUser({
            email,
            name,
            provider: 'NAVER',
            social_id: socialId,
          });
          logger.info('✅ 새 사용자 생성 완료:', user.id);
        } else if (user.provider === 'LOCAL') {
          logger.info('🔗 기존 로컬 사용자를 소셜 로그인으로 연결 중...');
          // 기존 로컬 사용자를 소셜 로그인으로 연결
          user = await userService.updateUserProvider(
            user.id,
            'NAVER',
            socialId
          );
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
        logger.error('❌ Naver OAuth 처리 중 오류 발생:', error);
        return done(error);
      }
    }
  )
);

// 사용자 직렬화
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// 사용자 역직렬화
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await userService.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
