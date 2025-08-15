import { Request, Response } from 'express';
import { AdminService } from './admin.service.js';
import { ValidationError } from '../../common/exception/ValidationError.js';
import logger from '../../config/logger.config.js';
import { EmailService } from '../../services/email/email.service.js';
// UpdateRoleDto 타입 정의
type UpdateRoleDto = {
  role: 'USER' | 'ADMIN';
  isAdmin: boolean;
  reason?: string;
};

export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly emailService?: EmailService
  ) {}

  /**
   * 사용자 권한 조회
   */
  async getUserRole(req: Request, res: Response): Promise<void> {
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
  async updateUserRole(req: Request, res: Response): Promise<void> {
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
  async getAllUsers(req: Request, res: Response): Promise<void> {
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
  async getAdminCount(req: Request, res: Response): Promise<void> {
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

  /**
   * 이메일 테스트 발송
   */
  async testEmail(req: Request, res: Response): Promise<void> {
    try {
      if (!this.emailService) {
        const error = ValidationError.internalServerError(
          '이메일 서비스가 초기화되지 않았습니다.'
        );
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      const { to, template = 'enrollment-status' } = req.body;

      if (!to) {
        const error =
          ValidationError.badRequest('수신자 이메일 주소가 필요합니다.');
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      // 테스트 데이터
      const testData = {
        mclassTitle: '테스트 클래스',
        userName: '테스트 사용자',
        enrollmentDate: new Date().toLocaleDateString('ko-KR'),
        reason: '테스트 이메일 발송',
      };

      logger.info('📧 이메일 테스트 발송 시작', {
        to,
        template,
        testData,
      });

      await this.emailService.sendTemplateEmail({
        to,
        template,
        data: testData,
        subject: '[테스트] MClass 이메일 발송 테스트',
      });

      logger.info('✅ 이메일 테스트 발송 완료', { to });

      res.json({
        success: true,
        message: '테스트 이메일이 성공적으로 발송되었습니다.',
        data: {
          to,
          template,
          sentAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('이메일 테스트 발송 중 오류:', error);

      const errorMessage =
        error instanceof Error ? error.message : '알 수 없는 오류';
      const validationError = ValidationError.internalServerError(
        `이메일 발송 실패: ${errorMessage}`
      );
      res.status(validationError.statusCode).json(validationError.toResponse());
    }
  }
}
