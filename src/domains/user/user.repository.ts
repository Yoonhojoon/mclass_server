import { PrismaClient, User } from '@prisma/client';
import { UserError } from '../../common/exception/user/UserError.js';
import { UserProfileResponse, UpdateUserDto } from './dto/index.js';

export class UserRepository {
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
   * 사용자 정보 수정
   */
  async updateUser(id: string, updateData: UpdateUserDto): Promise<User> {
    const existingUser = await this.findById(id);

    if (!existingUser) {
      throw UserError.notFound();
    }

    return await this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * 사용자 프로필 조회 (관련 데이터 포함)
   */
  async getUserProfile(id: string): Promise<UserProfileResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        email: true,
        name: true,
        isAdmin: true,
        provider: true,
        socialId: true,
        isSignUpCompleted: true,
        createdAt: true,
        mclasses: {
          include: {
            enrollments: {
              include: {
                user: {
                  select: {
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
}
