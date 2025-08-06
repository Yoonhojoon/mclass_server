import { PrismaClient } from '@prisma/client';
import { UserService } from '../user/user.service.js';
import logger from '../../config/logger.config.js';
import { User } from '@prisma/client';
import { UserError } from '../../common/exception/user/UserError.js';
import { AdminError } from '../../common/exception/admin/AdminError.js';

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
  async getUserRole(userId: string): Promise<{
    id: string;
    email: string;
    name: string | null;
    role: string;
    isAdmin: boolean;
    isSignUpCompleted: boolean;
  }> {
    try {
      const user = await this.userService.findById(userId);
      if (!user) {
        throw UserError.notFound(userId);
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isAdmin: user.isAdmin,
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
  ): Promise<{
    id: string;
    email: string;
    name: string | null;
    role: string;
    isAdmin: boolean;
    isSignUpCompleted: boolean;
  }> {
    try {
      // 1. 대상 사용자 확인
      const targetUser = await this.userService.findById(userId);
      if (!targetUser) {
        throw UserError.notFound(userId);
      }

      // 2. 초기 관리자 보호
      const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL;
      if (targetUser.email === initialAdminEmail) {
        throw AdminError.cannotModifyInitialAdmin();
      }

      // 3. 자기 자신 변경 방지
      if (userId === adminId) {
        throw AdminError.cannotModifySelf();
      }

      // 4. 마지막 관리자 보호
      if (targetUser.isAdmin && !roleData.isAdmin) {
        const adminCount = await this.getAdminCount();
        if (adminCount <= 1) {
          throw AdminError.minimumAdminRequired();
        }
      }

      // 5. 권한 변경
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          role: roleData.role,
          isAdmin: roleData.isAdmin,
        },
      });

      // 6. 감사 로그 기록
      await this.logRoleChange({
        changedBy: adminId,
        targetUserId: userId,
        oldRole: targetUser.role,
        newRole: roleData.role,
        oldIsAdmin: targetUser.isAdmin,
        newIsAdmin: roleData.isAdmin,
        reason: roleData.reason,
      });

      logger.info('✅ 사용자 권한 변경 완료', {
        targetUserId: userId,
        changedBy: adminId,
        oldRole: targetUser.role,
        newRole: roleData.role,
        oldIsAdmin: targetUser.isAdmin,
        newIsAdmin: roleData.isAdmin,
      });

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        isAdmin: updatedUser.isAdmin,
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
      // Add same safeguards as updateUserRole
      const targetUser = await this.userService.findById(userId);
      if (!targetUser) {
        throw UserError.notFound(userId);
      }

      // Protect initial admin
      const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL;
      if (targetUser.email === initialAdminEmail && !isAdmin) {
        throw AdminError.cannotModifyInitialAdmin();
      }

      // Prevent removing last admin
      if (targetUser.isAdmin && !isAdmin) {
        const adminCount = await this.getAdminCount();
        if (adminCount <= 1) {
          throw AdminError.minimumAdminRequired();
        }
      }

      // Update admin status
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { isAdmin },
      });

      logger.info('👑 관리자 권한 설정', { userId, isAdmin });

      return updatedUser;
    } catch (error) {
      logger.error('관리자 권한 설정 중 오류:', error);
      throw error;
    }
  }

  /**
   * 관리자 수 조회
   */
  async getAdminCount(): Promise<number> {
    return await this.prisma.user.count({
      where: { isAdmin: true },
    });
  }

  /**
   * 모든 사용자 목록 조회 (관리자용)
   */
  async getAllUsers(): Promise<
    Array<{
      id: string;
      email: string;
      name: string | null;
      role: string;
      isAdmin: boolean;
      isSignUpCompleted: boolean;
      provider: string;
      createdAt: Date;
    }>
  > {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isAdmin: true,
          isSignUpCompleted: true,
          provider: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return users.map(user => ({
        ...user,
        isAdmin: user.isAdmin,
      }));
    } catch (error) {
      logger.error('사용자 목록 조회 중 오류:', error);
      throw AdminError.userListRetrievalFailed();
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
  }): Promise<void> {
    try {
      // 실제 구현에서는 별도 테이블에 로그 저장
      logger.info('🔍 권한 변경 감사 로그', {
        ...data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('감사 로그 기록 중 오류:', error);
      throw AdminError.auditLogFailed('role_change');
    }
  }
}
