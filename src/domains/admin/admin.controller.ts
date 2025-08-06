import { Response } from 'express';
import { AdminService, UpdateRoleDto } from './admin.service.js';
import { ValidationError } from '../../common/exception/ValidationError.js';
import logger from '../../config/logger.config.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * 사용자 권한 조회
   */
  async getUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userRole = await this.adminService.getUserRole(id);

      logger.info('✅ 사용자 권한 조회 성공', {
        userId: id,
        role: userRole.role,
        isAdmin: userRole.isAdmin,
      });

      res.json({
        success: true,
        data: userRole,
      });
    } catch (error) {
      logger.error('사용자 권한 조회 중 오류:', error);
      const validationError =
        ValidationError.notFound('사용자를 찾을 수 없습니다.');
      res.status(validationError.statusCode).json(validationError.toResponse());
    }
  }

  /**
   * 사용자 권한 변경
   */
  async updateUserRole(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user?.userId;
      const { role, isAdmin, reason } = req.body as UpdateRoleDto;

      if (!adminId) {
        const error = ValidationError.unauthorized();
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      // 입력 검증
      if (!role || typeof isAdmin !== 'boolean') {
        const error = ValidationError.badRequest(
          'role과 isAdmin은 필수입니다.'
        );
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      const updatedUser = await this.adminService.updateUserRole(id, adminId, {
        role,
        isAdmin,
        reason,
      });

      logger.info('✅ 사용자 권한 변경 성공', {
        targetUserId: id,
        changedBy: adminId,
        newRole: role,
        newIsAdmin: isAdmin,
      });

      res.json({
        success: true,
        message: '사용자 권한이 성공적으로 변경되었습니다.',
        data: updatedUser,
      });
    } catch (error) {
      logger.error('사용자 권한 변경 중 오류:', error);

      if (error instanceof Error) {
        const validationError = ValidationError.badRequest(error.message);
        res
          .status(validationError.statusCode)
          .json(validationError.toResponse());
      } else {
        const validationError = ValidationError.internalServerError();
        res
          .status(validationError.statusCode)
          .json(validationError.toResponse());
      }
    }
  }

  /**
   * 모든 사용자 목록 조회 (관리자용)
   */
  async getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const users = await this.adminService.getAllUsers();

      logger.info('✅ 모든 사용자 목록 조회 성공', {
        count: users.length,
      });

      res.json({
        success: true,
        data: users,
        count: users.length,
      });
    } catch (error) {
      logger.error('사용자 목록 조회 중 오류:', error);
      const validationError = ValidationError.internalServerError();
      res.status(validationError.statusCode).json(validationError.toResponse());
    }
  }

  /**
   * 관리자 수 조회
   */
  async getAdminCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminCount = await this.adminService.getAdminCount();

      logger.info('✅ 관리자 수 조회 성공', {
        adminCount,
      });

      res.json({
        success: true,
        data: { adminCount },
      });
    } catch (error) {
      logger.error('관리자 수 조회 중 오류:', error);
      const validationError = ValidationError.internalServerError();
      res.status(validationError.statusCode).json(validationError.toResponse());
    }
  }
}
