import { PrismaClient } from '@prisma/client';
import { UserService } from '../user/user.service.js';
import logger from '../../config/logger.config.js';
import { User } from '@prisma/client';
import { UserError } from '../../common/exception/user/UserError.js';

export interface UpdateRoleDto {
  role: 'USER' | 'ADMIN';
  isAdmin: boolean;
  reason?: string;
}

export class AdminService {
  private prisma: PrismaClient;
  private userService: UserService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.userService = new UserService(prisma);
  }

  /**
   * 사용자 권한 조회
   */
  async getUserRole(userId: string) {
    try {
      const user = await this.userService.findById(userId);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isAdmin: user.is_admin,
        isSignUpCompleted: user.isSignUpCompleted,
      };
    } catch (error) {
      logger.error('사용자 권한 조회 중 오류:', error);
      throw error;
    }
  }

  /**
   * 사용자 권한 변경
   */
  async updateUserRole(
    userId: string,
    adminId: string,
    roleData: UpdateRoleDto
  ) {
    try {
      // 1. 대상 사용자 확인
      const targetUser = await this.userService.findById(userId);
      if (!targetUser) {
        throw new Error('변경할 사용자를 찾을 수 없습니다.');
      }

      // 2. 초기 관리자 보호
      const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL;
      if (targetUser.email === initialAdminEmail) {
        throw new Error('초기 관리자 권한은 변경할 수 없습니다.');
      }

      // 3. 자기 자신 변경 방지
      if (userId === adminId) {
        throw new Error('자신의 권한은 변경할 수 없습니다.');
      }

      // 4. 마지막 관리자 보호
      if (targetUser.is_admin && !roleData.isAdmin) {
        const adminCount = await this.getAdminCount();
        if (adminCount <= 1) {
          throw new Error('최소 1명의 관리자가 필요합니다.');
        }
      }

      // 5. 권한 변경
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          role: roleData.role,
          is_admin: roleData.isAdmin,
        },
      });

      // 6. 감사 로그 기록
      await this.logRoleChange({
        changedBy: adminId,
        targetUserId: userId,
        oldRole: targetUser.role,
        newRole: roleData.role,
        oldIsAdmin: targetUser.is_admin,
        newIsAdmin: roleData.isAdmin,
        reason: roleData.reason,
      });

      logger.info('✅ 사용자 권한 변경 완료', {
        targetUserId: userId,
        changedBy: adminId,
        oldRole: targetUser.role,
        newRole: roleData.role,
        oldIsAdmin: targetUser.is_admin,
        newIsAdmin: roleData.isAdmin,
      });

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        isAdmin: updatedUser.is_admin,
        isSignUpCompleted: updatedUser.isSignUpCompleted,
      };
    } catch (error) {
      logger.error('사용자 권한 변경 중 오류:', error);
      throw error;
    }
  }

  /**
   * 사용자의 관리자 권한 설정
   */
  async setAdminStatus(userId: string, isAdmin: boolean): Promise<User> {
    try {
      logger.info('👑 관리자 권한 설정', { userId, isAdmin });

      const user = await this.userService.findById(userId);
      if (!user) {
        throw UserError.notFound();
      }

      const updatedUser = await this.userService.updateUser(userId, {
        isAdmin: isAdmin,
        role: isAdmin ? 'ADMIN' : 'USER',
      });

      logger.info('✅ 관리자 권한 설정 완료', {
        userId,
        isAdmin: updatedUser.is_admin,
        role: updatedUser.role,
      });

      return updatedUser;
    } catch (error) {
      logger.error('❌ 관리자 권한 설정 중 오류', {
        userId,
        isAdmin,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * 관리자 수 조회
   */
  async getAdminCount(): Promise<number> {
    return await this.prisma.user.count({
      where: { is_admin: true },
    });
  }

  /**
   * 모든 사용자 목록 조회 (관리자용)
   */
  async getAllUsers() {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          is_admin: true,
          isSignUpCompleted: true,
          provider: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return users.map(user => ({
        ...user,
        isAdmin: user.is_admin,
      }));
    } catch (error) {
      logger.error('사용자 목록 조회 중 오류:', error);
      throw error;
    }
  }

  /**
   * 권한 변경 감사 로그 기록
   */
  private async logRoleChange(data: {
    changedBy: string;
    targetUserId: string;
    oldRole: string;
    newRole: string;
    oldIsAdmin: boolean;
    newIsAdmin: boolean;
    reason?: string;
  }) {
    try {
      // 실제 구현에서는 별도 테이블에 로그 저장
      logger.info('🔍 권한 변경 감사 로그', {
        ...data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('감사 로그 기록 중 오류:', error);
    }
  }
}
