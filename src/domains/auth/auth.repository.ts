import { PrismaClient, User } from '@prisma/client';
import { UserError } from '../../common/exception/user/UserError.js';
import bcrypt from 'bcrypt';

export interface CreateUserData {
  email: string;
  password: string;
  name?: string;
  role?: 'USER' | 'ADMIN';
  provider?: 'LOCAL' | 'KAKAO' | 'GOOGLE' | 'NAVER';
  socialId?: string;
  isSignUpCompleted?: boolean;
}

export interface CreateSocialUserData {
  email: string;
  name?: string;
  provider: 'KAKAO' | 'GOOGLE' | 'NAVER';
  socialId: string;
  isSignUpCompleted?: boolean;
}

export class AuthRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Prisma 인스턴스 접근자 (다른 서비스에서 필요할 때)
   */
  getPrisma(): PrismaClient {
    return this.prisma;
  }

  /**
   * 이메일로 사용자 찾기
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * ID로 사용자 찾기
   */
  async findById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * 소셜 ID로 사용자 찾기
   */
  async findBySocialId(
    socialId: string,
    provider: string
  ): Promise<User | null> {
    return await this.prisma.user.findFirst({
      where: {
        socialId: socialId,
        provider: provider as 'KAKAO' | 'GOOGLE' | 'NAVER',
      },
    });
  }

  /**
   * 새 사용자 생성
   */
  async createUser(userData: CreateUserData): Promise<User> {
    const existingUser = await this.findByEmail(userData.email);

    if (existingUser) {
      throw UserError.alreadyExists(userData.email);
    }

    // 비밀번호 해시화 (LOCAL 로그인인 경우만)
    const hashedPassword = userData.password
      ? await bcrypt.hash(userData.password, 10)
      : null;

    return await this.prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role || 'USER',
        provider: userData.provider || 'LOCAL',
        socialId: userData.socialId,
        isSignUpCompleted: userData.isSignUpCompleted || false,
      },
    });
  }

  /**
   * 소셜 로그인 사용자 생성
   */
  async createSocialUser(socialData: CreateSocialUserData): Promise<User> {
    return await this.prisma.user.create({
      data: {
        email: socialData.email,
        name: socialData.name,
        provider: socialData.provider,
        socialId: socialData.socialId,
        isSignUpCompleted: socialData.isSignUpCompleted || false,
      },
    });
  }

  /**
   * 비밀번호 업데이트
   */
  async updatePassword(id: string, hashedPassword: string): Promise<User> {
    return await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  /**
   * 회원가입 완료 상태 업데이트
   */
  async updateSignUpStatus(
    userId: string,
    isSignUpCompleted: boolean
  ): Promise<User> {
    return await this.prisma.user.update({
      where: { id: userId },
      data: { isSignUpCompleted },
    });
  }

  /**
   * 사용자 소셜 정보 업데이트
   */
  async updateUserProvider(
    userId: string,
    provider: 'KAKAO' | 'GOOGLE' | 'NAVER',
    socialId: string
  ): Promise<User> {
    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        provider: provider,
        socialId: socialId,
      },
    });
  }

  /**
   * 약관 ID 목록 검증
   */
  async validateTermIds(termIds: string[]): Promise<string[]> {
    try {
      const validTerms = await this.prisma.term.findMany({
        where: {
          id: {
            in: termIds,
          },
        },
        select: {
          id: true,
        },
      });

      return validTerms.map(term => term.id);
    } catch {
      throw UserError.notFound('약관 ID 검증 중 오류가 발생했습니다.');
    }
  }

  /**
   * 비밀번호 검증
   */
  async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * 비밀번호 해시화
   */
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }
}
