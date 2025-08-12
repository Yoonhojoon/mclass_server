import { Request, Response } from 'express';
import { UserService } from './user.service.js';
import { UserError } from '../../common/exception/user/UserError.js';
import { UserSuccess } from '../../common/exception/user/UserSuccess.js';
import { ValidationError } from '../../common/exception/ValidationError.js';
import logger from '../../config/logger.config.js';
import { PrismaClient } from '@prisma/client';
import { UpdateUserDto, GetUserByEmailDto } from './user.schemas.js';

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
      const userId = req.user?.userId;

      if (!userId) {
        const error = ValidationError.unauthorized();
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      logger.info('👤 사용자 프로필 조회', { userId });

      const userProfile = await this.userService.getUserProfile(userId);

      return UserSuccess.profileGetSuccess(userProfile).send(res);
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

      logger.info('👤 사용자 조회 (ID)', { userId: id });

      const user = await this.userService.findById(id);

      if (!user) {
        const error = ValidationError.notFound('사용자를 찾을 수 없습니다.');
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      return UserSuccess.userDetailsFetchSuccess(user).send(res);
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
      const emailData: GetUserByEmailDto = { email: email as string };

      logger.info('👤 사용자 조회 (이메일)', { email });

      const user = await this.userService.findByEmail(emailData.email);

      if (!user) {
        const error = ValidationError.notFound('사용자를 찾을 수 없습니다.');
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      return UserSuccess.userDetailsFetchSuccess(user).send(res);
    } catch (error) {
      logger.error('❌ 사용자 조회 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const userError = UserError.notFound('사용자를 찾을 수 없습니다.');
      res.status(userError.statusCode).json(userError.toResponse());
    }
  }

  /**
   * 사용자 정보 업데이트
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const updateData: UpdateUserDto = req.body;

      if (!userId) {
        const error = ValidationError.unauthorized();
        res.status(error.statusCode).json(error.toResponse());
        return;
      }

      logger.info('✏️ 사용자 정보 업데이트', { userId });

      const updatedUser = await this.userService.updateUser(userId, updateData);

      return UserSuccess.profileUpdateSuccess('사용자 정보', updatedUser).send(
        res
      );
    } catch (error) {
      logger.error('❌ 사용자 정보 업데이트 오류', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof UserError) {
        res.status(error.statusCode).json(error.toResponse());
      } else {
        const userError = UserError.updateFailed(
          '사용자 정보 업데이트에 실패했습니다.'
        );
        res.status(userError.statusCode).json(userError.toResponse());
      }
    }
  }
}
