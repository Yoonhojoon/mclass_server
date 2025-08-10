import { Request, Response } from 'express';
import { UserService } from './user.service.js';
import { UserError } from '../../common/exception/user/UserError.js';
import { ValidationError } from '../../common/exception/ValidationError.js';
import logger from '../../config/logger.config.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { PrismaClient } from '@prisma/client';

export class UserController {
  private userService: UserService;

  constructor(prisma: PrismaClient) {
    this.userService = new UserService(prisma);
  }

  /**
   * 사용자 프로필 조회
   */
  async getUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as AuthenticatedRequest).user?.userId;

      if (!userId) {
        const error = ValidationError.unauthorized();
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      logger.info('👤 사용자 프로필 조회', { userId });

      const userProfile = await this.userService.getUserProfile(userId);

      res.json({
        success: true,
        data: userProfile,
      });
    } catch (error) {
      logger.error('❌ 사용자 프로필 조회 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof UserError) {
        res.status(error.statusCode).json(error.toResponse());
      } else {
        const userError = UserError.notFound(
          '사용자 프로필을 찾을 수 없습니다.'
        );
        res.status(userError.statusCode).json(userError.toResponse());
      }
    }
  }

  /**
   * 특정 사용자 조회 (ID로)
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        const error = ValidationError.badRequest('사용자 ID가 필요합니다.');
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      logger.info('👤 사용자 조회 (ID)', { userId: id });

      const user = await this.userService.findById(id);

      if (!user) {
        const error = ValidationError.notFound('사용자를 찾을 수 없습니다.');
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      logger.error('❌ 사용자 조회 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const userError = UserError.notFound('사용자를 찾을 수 없습니다.');
      res.status(userError.statusCode).json(userError.toResponse());
    }
  }

  /**
   * 이메일로 사용자 조회
   */
  async getUserByEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.query;

      if (!email || typeof email !== 'string') {
        const error = ValidationError.badRequest('이메일이 필요합니다.');
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      logger.info('👤 사용자 조회 (이메일)', { email });

      const user = await this.userService.findByEmail(email);

      if (!user) {
        const error = ValidationError.notFound('사용자를 찾을 수 없습니다.');
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      logger.error('❌ 사용자 조회 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const userError = UserError.notFound('사용자를 찾을 수 없습니다.');
      res.status(userError.statusCode).json(userError.toResponse());
    }
  }

  /**
   * 사용자 정보 수정
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as AuthenticatedRequest).user?.userId;
      const { name, role } = req.body;

      if (!userId) {
        const error = ValidationError.unauthorized();
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      logger.info('✏️ 사용자 정보 수정', { userId, name, role });

      const updatedUser = await this.userService.updateUser(userId, {
        name,
        role,
      });

      res.json({
        success: true,
        message: '사용자 정보가 성공적으로 수정되었습니다.',
        data: updatedUser,
      });
    } catch (error) {
      logger.error('❌ 사용자 정보 수정 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof UserError) {
        res.status(error.statusCode).json(error.toResponse());
      } else {
        const userError = UserError.updateFailed(
          '사용자 정보 수정 중 오류가 발생했습니다.'
        );
        res.status(userError.statusCode).json(userError.toResponse());
      }
    }
  }
}
