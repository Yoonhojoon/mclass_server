import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuthRoutes } from '../../routes/auth.routes';
import jwt from 'jsonwebtoken';

// Mock external dependencies only
jest.mock('../../config/logger.config', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock passport
jest.mock('passport', () => ({
  authenticate: jest.fn(() => {
    return (req: any, res: any, next: any) => {
      // Mock successful authentication
      req.user = {
        id: 'mock-user-id',
        email: 'mock@example.com',
        name: 'Mock User',
        provider: 'GOOGLE',
      };
      next();
    };
  }),
  use: jest.fn(),
  initialize: jest.fn(() => (req: any, res: any, next: any) => next()),
  session: jest.fn(() => (req: any, res: any, next: any) => next()),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
}));

// Mock passport strategies
jest.mock('passport-google-oauth20', () => ({
  Strategy: jest.fn(),
}));

jest.mock('passport-kakao', () => ({
  Strategy: jest.fn(),
}));

jest.mock('passport-naver', () => ({
  Strategy: jest.fn(),
}));

describe('Auth E2E Tests', () => {
  let app: express.Application;
  let prisma: PrismaClient;
  let dbConnected = false;

  const testUser = {
    email: 'e2e-test@example.com',
    password: 'password123',
    name: 'E2E Test User',
    role: 'USER',
  };

  const testAdmin = {
    email: 'e2e-admin@example.com',
    password: 'admin123',
    name: 'E2E Admin User',
    role: 'ADMIN',
  };

  beforeAll(async () => {
    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/auth', createAuthRoutes(prisma));

    // Setup Prisma - 기존 .env 설정 사용
    prisma = new PrismaClient();

    // Test database connection
    try {
      await prisma.$connect();
      await prisma.userTermAgreement.deleteMany();
      await prisma.user.deleteMany();
      await prisma.term.deleteMany();
      dbConnected = true;
    } catch (error) {
      console.log('데이터베이스 연결 실패, E2E 테스트를 스킵합니다:', error);
      dbConnected = false;
    }
  });

  afterAll(async () => {
    if (dbConnected) {
      await prisma.$disconnect();
    }
  });

  beforeEach(async () => {
    if (!dbConnected) {
      return;
    }

    // Clean up before each test
    await prisma.userTermAgreement.deleteMany();
    await prisma.user.deleteMany();
    await prisma.term.deleteMany();

    // Create test terms
    await prisma.term.createMany({
      data: [
        {
          id: 'term-1',
          type: 'PRIVACY',
          title: '이용약관',
          content: '이용약관 내용',
          version: '1.0',
          isRequired: true,
        },
        {
          id: 'term-2',
          type: 'SERVICE',
          title: '개인정보처리방침',
          content: '개인정보처리방침 내용',
          version: '1.0',
          isRequired: true,
        },
      ],
    });
  });

  describe('회원가입 및 로그인 플로우', () => {
    it('✅ 전체 회원가입 및 로그인 플로우가 성공해야 함', async () => {
      if (!dbConnected) {
        console.log('데이터베이스 연결 없음, 테스트 스킵');
        return;
      }

      // 1. 회원가입
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(200);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.user.email).toBe(testUser.email);
      expect(registerResponse.body.data.user.isSignUpCompleted).toBe(false);

      const accessToken = registerResponse.body.data.accessToken;
      const refreshToken = registerResponse.body.data.refreshToken;

      // 2. 약관 동의 (회원가입 완료)
      const completeSignUpResponse = await request(app)
        .post('/api/auth/complete-signup')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          termIds: ['term-1', 'term-2'],
        })
        .expect(200);

      expect(completeSignUpResponse.body.success).toBe(true);
      expect(completeSignUpResponse.body.data.user.isSignUpCompleted).toBe(
        true
      );

      // 3. 로그인
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.user.email).toBe(testUser.email);
      expect(loginResponse.body.data.user.isSignUpCompleted).toBe(true);

      // 4. 토큰 갱신
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: refreshToken,
        })
        .expect(200);

      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.data.accessToken).toBeDefined();
      expect(refreshResponse.body.data.refreshToken).toBeDefined();

      // 5. 비밀번호 변경
      const changePasswordResponse = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: 'newpassword123',
        })
        .expect(200);

      expect(changePasswordResponse.body.success).toBe(true);

      // 6. 새 비밀번호로 로그인
      const newLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'newpassword123',
        })
        .expect(200);

      expect(newLoginResponse.body.success).toBe(true);

      // 7. 로그아웃
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);
    });
  });

  describe('에러 케이스 테스트', () => {
    it('❌ 이미 존재하는 이메일로 회원가입 시 실패해야 함', async () => {
      if (!dbConnected) {
        console.log('데이터베이스 연결 없음, 테스트 스킵');
        return;
      }

      // 첫 번째 회원가입
      await request(app).post('/api/auth/register').send(testUser).expect(200);

      // 두 번째 회원가입 (같은 이메일)
      const duplicateResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);

      expect(duplicateResponse.body.success).toBe(false);
      expect(duplicateResponse.body.error.code).toBe('EMAIL_EXISTS');
    });

    it('❌ 잘못된 비밀번호로 로그인 시 실패해야 함', async () => {
      if (!dbConnected) {
        console.log('데이터베이스 연결 없음, 테스트 스킵');
        return;
      }

      // 회원가입
      await request(app).post('/api/auth/register').send(testUser).expect(200);

      // 잘못된 비밀번호로 로그인
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(400);

      expect(loginResponse.body.success).toBe(false);
      expect(loginResponse.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('❌ 인증 없이 보호된 엔드포인트 접근 시 실패해야 함', async () => {
      if (!dbConnected) {
        console.log('데이터베이스 연결 없음, 테스트 스킵');
        return;
      }

      const response = await request(app)
        .post('/api/auth/complete-signup')
        .send({ termIds: ['term-1'] })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('❌ 회원가입 미완료 사용자가 비밀번호 변경 시 실패해야 함', async () => {
      if (!dbConnected) {
        console.log('데이터베이스 연결 없음, 테스트 스킵');
        return;
      }

      // 회원가입 (약관 동의 없음)
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(200);

      const accessToken = registerResponse.body.data.accessToken;

      // 비밀번호 변경 시도
      const changePasswordResponse = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: 'newpassword123',
        })
        .expect(403);

      expect(changePasswordResponse.body.success).toBe(false);
      expect(changePasswordResponse.body.error.code).toBe('SIGNUP_INCOMPLETE');
    });
  });

  describe('소셜 로그인 테스트', () => {
    it('✅ 소셜 로그인 플로우가 성공해야 함', async () => {
      if (!dbConnected) {
        console.log('데이터베이스 연결 없음, 테스트 스킵');
        return;
      }

      const socialProfile = {
        id: 'social-123',
        email: 'social@example.com',
        name: 'Social User',
        provider: 'GOOGLE',
      };

      const socialResponse = await request(app)
        .post('/api/auth/social')
        .send({ profile: socialProfile })
        .expect(200);

      expect(socialResponse.body.success).toBe(true);
      expect(socialResponse.body.data.user.email).toBe(socialProfile.email);
      expect(socialResponse.body.data.user.provider).toBe(
        socialProfile.provider
      );
      expect(socialResponse.body.data.user.isSignUpCompleted).toBe(false);
    });

    it('✅ 기존 소셜 사용자 로그인 시 성공해야 함', async () => {
      if (!dbConnected) {
        console.log('데이터베이스 연결 없음, 테스트 스킵');
        return;
      }

      const socialProfile = {
        id: 'social-456',
        email: 'existing-social@example.com',
        name: 'Existing Social User',
        provider: 'KAKAO',
      };

      // 첫 번째 소셜 로그인
      await request(app)
        .post('/api/auth/social')
        .send({ profile: socialProfile })
        .expect(200);

      // 두 번째 소셜 로그인 (같은 사용자)
      const secondResponse = await request(app)
        .post('/api/auth/social')
        .send({ profile: socialProfile })
        .expect(200);

      expect(secondResponse.body.success).toBe(true);
      expect(secondResponse.body.data.user.email).toBe(socialProfile.email);
    });
  });

  describe('토큰 관리 테스트', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      if (!dbConnected) {
        console.log('데이터베이스 연결 없음, 테스트 스킵');
        return;
      }

      // 회원가입 및 로그인
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(200);

      accessToken = registerResponse.body.data.accessToken;
      refreshToken = registerResponse.body.data.refreshToken;

      // 회원가입 완료
      await request(app)
        .post('/api/auth/complete-signup')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ termIds: ['term-1', 'term-2'] })
        .expect(200);
    });

    it('✅ 유효한 토큰으로 보호된 엔드포인트 접근 시 성공해야 함', async () => {
      if (!dbConnected) {
        console.log('데이터베이스 연결 없음, 테스트 스킵');
        return;
      }

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: 'newpassword123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('❌ 만료된 토큰으로 접근 시 실패해야 함', async () => {
      if (!dbConnected) {
        console.log('데이터베이스 연결 없음, 테스트 스킵');
        return;
      }

      // 만료된 토큰 생성 (실제로는 시간 기반이지만 테스트에서는 다른 방법 사용)
      const expiredToken = jwt.sign(
        { userId: testUser.email, exp: Math.floor(Date.now() / 1000) - 60 },
        process.env.JWT_SECRET || 'test-secret'
      );

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: 'newpassword123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('✅ 토큰 갱신이 성공해야 함', async () => {
      if (!dbConnected) {
        console.log('데이터베이스 연결 없음, 테스트 스킵');
        return;
      }

      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.data.accessToken).toBeDefined();
      expect(refreshResponse.body.data.refreshToken).toBeDefined();

      // 새 토큰으로 API 호출
      const newAccessToken = refreshResponse.body.data.accessToken;
      const changePasswordResponse = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: 'newpassword123',
        })
        .expect(200);

      expect(changePasswordResponse.body.success).toBe(true);
    });
  });

  describe('관리자 기능 테스트', () => {
    it('✅ 관리자 계정 생성 및 로그인이 성공해야 함', async () => {
      if (!dbConnected) {
        console.log('데이터베이스 연결 없음, 테스트 스킵');
        return;
      }

      // 관리자 회원가입
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testAdmin)
        .expect(200);

      expect(registerResponse.body.data.user.role).toBe('ADMIN');
      expect(registerResponse.body.data.user.isAdmin).toBe(true);

      // 관리자 로그인
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testAdmin.email,
          password: testAdmin.password,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.user.role).toBe('ADMIN');
    });
  });

  describe('데이터베이스 상태 검증', () => {
    it('✅ 회원가입 완료 후 데이터베이스에 올바른 데이터가 저장되어야 함', async () => {
      if (!dbConnected) {
        console.log('데이터베이스 연결 없음, 테스트 스킵');
        return;
      }

      // 회원가입
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(200);

      const userId = registerResponse.body.data.user.id;

      // 데이터베이스에서 사용자 조회
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { userTermAgreements: true },
      });

      expect(dbUser).toBeDefined();
      expect(dbUser!.email).toBe(testUser.email);
      expect(dbUser!.isSignUpCompleted).toBe(false);
      expect(dbUser!.userTermAgreements).toHaveLength(0);

      // 회원가입 완료
      const accessToken = registerResponse.body.data.accessToken;
      await request(app)
        .post('/api/auth/complete-signup')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ termIds: ['term-1', 'term-2'] })
        .expect(200);

      // 데이터베이스 상태 재확인
      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { userTermAgreements: true },
      });

      expect(updatedUser!.isSignUpCompleted).toBe(true);
      expect(updatedUser!.userTermAgreements).toHaveLength(2);
      expect(updatedUser!.userTermAgreements.map(ut => ut.termId)).toContain(
        'term-1'
      );
      expect(updatedUser!.userTermAgreements.map(ut => ut.termId)).toContain(
        'term-2'
      );
    });
  });
});
