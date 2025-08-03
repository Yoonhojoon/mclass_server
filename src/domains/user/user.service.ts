import { User, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.config.js';
import { UserError } from '../../common/exception/user/UserError.js';
import bcrypt from 'bcrypt';

export interface CreateUserDto {
  email: string;
  password?: string;
  name?: string;
  role?: 'USER' | 'ADMIN';
  provider?: 'LOCAL' | 'KAKAO' | 'GOOGLE' | 'NAVER';
  social_id?: string;
  isSignUpCompleted?: boolean;
}

export interface UpdateUserDto {
  name?: string;
  role?: 'USER' | 'ADMIN';
  is_admin?: boolean;
}

export class UserService {
  private prisma: typeof prisma;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * 사용자 생성
   */
  async createUser(userData: CreateUserDto): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      throw UserError.alreadyExists(userData.email);
    }

    // 소셜 로그인이 아닌 경우 비밀번호 필수
    if (userData.provider === 'LOCAL' && !userData.password) {
      throw UserError.invalidPassword();
    }

    // 비밀번호 해시화 (LOCAL 로그인인 경우만)
    const hashedPassword = userData.password ? await bcrypt.hash(userData.password, 10) : null;

    return await this.prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role || 'USER',
        provider: userData.provider || 'LOCAL',
        social_id: userData.social_id,
        isSignUpCompleted: userData.isSignUpCompleted || false,
      }
    });
  }

  /**
   * 이메일로 사용자 찾기
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email }
    });
  }

  /**
   * ID로 사용자 찾기
   */
  async findById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id }
    });
  }



  /**
   * 사용자 인증 (LOCAL 로그인)
   */
  async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);

    if (!user) {
      throw UserError.notFound();
    }

    if (user.provider !== 'LOCAL') {
      throw UserError.invalidProvider();
    }

    if (!user.password) {
      throw UserError.invalidPassword();
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw UserError.passwordMismatch();
    }

    return user;
  }

  /**
   * 사용자 정보 수정
   */
  async updateUser(id: string, updateData: UpdateUserDto): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw UserError.notFound();
    }

    return await this.prisma.user.update({
      where: { id },
      data: updateData
    });
  }

  /**
   * 비밀번호 변경
   */
  async changePassword(id: string, newPassword: string): Promise<boolean> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw UserError.notFound();
    }

    if (existingUser.provider !== 'LOCAL') {
      throw UserError.invalidProvider();
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    return true;
  }

  /**
   * 모든 사용자 조회
   */
  async findAllUsers(): Promise<User[]> {
    return await this.prisma.user.findMany({
      orderBy: { created_at: 'desc' }
    });
  }

  /**
   * 사용자 비활성화
   */
  async deactivateUser(id: string): Promise<boolean> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw UserError.notFound();
    }

    await this.prisma.user.update({
      where: { id },
      data: { is_admin: false }
    });

    return true;
  }

  /**
   * 사용자 활성화
   */
  async activateUser(id: string): Promise<boolean> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw UserError.notFound();
    }

    await this.prisma.user.update({
      where: { id },
      data: { is_admin: true }
    });

    return true;
  }

  /**
   * 사용자 프로필 조회
   */
  async getUserProfile(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        mclasses: {
          include: {
            enrollments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        enrollments: {
          include: {
            mclass: {
              include: {
                creator: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            form: true,
          },
        },
      },
    });

    if (!user) {
      throw UserError.notFound();
    }

    return user;
  }

  /**
   * 사용자 데이터 검증
   */
  async validateUser(userData: CreateUserDto): Promise<void> {
    if (!userData.email) {
      throw UserError.invalidEmail();
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw UserError.invalidEmail();
    }

    // LOCAL 로그인인 경우 비밀번호 필수
    if (userData.provider === 'LOCAL' && !userData.password) {
      throw UserError.invalidPassword();
    }

    // 비밀번호 길이 검증 (LOCAL 로그인인 경우)
    if (userData.password && userData.password.length < 6) {
      throw UserError.invalidPassword();
    }
  }

  /**
   * 소셜 로그인 사용자 생성 또는 업데이트
   */
  async createOrUpdateSocialUser(socialData: {
    email: string;
    name?: string;
    provider: 'KAKAO' | 'GOOGLE' | 'NAVER';
    social_id: string;
  }): Promise<User> {
    // 기존 사용자 확인
    let user = await this.findByEmail(socialData.email);

    if (user) {
      // 기존 사용자가 있으면 소셜 정보 업데이트
      return await this.updateUserProvider(user.id, socialData.provider, socialData.social_id);
    } else {
      // 새 사용자 생성
      return await this.createSocialUser(socialData);
    }
  }

  /**
   * 소셜 ID로 사용자 찾기 (provider 포함)
   */
  async findBySocialId(socialId: string, provider: string): Promise<User | null> {
    return await this.prisma.user.findFirst({
      where: {
        social_id: socialId,
        provider: provider as 'LOCAL' | 'KAKAO' | 'GOOGLE' | 'NAVER'
      }
    });
  }

  /**
   * 소셜 로그인 사용자 생성 (준회원 상태)
   */
  async createSocialUser(socialData: {
    email: string;
    name?: string;
    provider: 'KAKAO' | 'GOOGLE' | 'NAVER';
    social_id: string;
    isSignUpCompleted?: boolean;
  }): Promise<User> {
    return await this.createUser({
      email: socialData.email,
      name: socialData.name,
      provider: socialData.provider,
      social_id: socialData.social_id,
      isSignUpCompleted: socialData.isSignUpCompleted || false
    });
  }

  /**
   * 사용자 소셜 로그인 정보 업데이트
   */
  async updateUserProvider(userId: string, provider: 'KAKAO' | 'GOOGLE' | 'NAVER', socialId: string): Promise<User> {
    const existingUser = await this.findById(userId);

    if (!existingUser) {
      throw UserError.notFound();
    }

    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        provider,
        social_id: socialId,
      },
    });
  }

  /**
   * 회원가입 완료 상태 업데이트
   */
  async updateSignUpStatus(userId: string, isSignUpCompleted: boolean): Promise<User> {
    const existingUser = await this.findById(userId);

    if (!existingUser) {
      throw UserError.notFound();
    }

    return await this.prisma.user.update({
      where: { id: userId },
      data: { isSignUpCompleted }
    });
  }

  /**
   * 약관 동의 처리
   */
  async agreeToTerm(userId: string, termId: string): Promise<void> {
    // 약관 동의는 TermService에서 처리하므로 여기서는 UserService와 연결
    const { TermService } = await import('../term/term.service.js');
    const termService = new TermService(prisma);
    await termService.agreeToTerm(userId, termId);
  }
} 