import { PrismaClient, User } from '@prisma/client';
import { UpdateUserDto } from './user.schemas.js';
import { UserProfileResponse } from './dto/index.js';
import { UserRepository } from './user.repository.js';
import logger from '../../config/logger.config.js';

export class UserService {
  private userRepository: UserRepository;

  constructor(prisma: PrismaClient) {
    this.userRepository = new UserRepository(prisma);
  }

  /**
   * 이메일로 사용자 찾기
   */
  async findByEmail(email: string): Promise<User | null> {
    logger.info(`[UserService] 이메일로 사용자 찾기: ${email}`);

    try {
      const user = await this.userRepository.findByEmail(email);
      if (user) {
        logger.info(`[UserService] 이메일로 사용자 찾기 성공: ${email}`);
      } else {
        logger.info(`[UserService] 이메일로 사용자를 찾을 수 없음: ${email}`);
      }
      return user;
    } catch (error) {
      logger.error(`[UserService] 이메일로 사용자 찾기 실패: ${email}`, {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * ID로 사용자 찾기
   */
  async findById(id: string): Promise<User | null> {
    logger.info(`[UserService] ID로 사용자 찾기: ${id}`);

    try {
      const user = await this.userRepository.findById(id);
      if (user) {
        logger.info(`[UserService] ID로 사용자 찾기 성공: ${id}`);
      } else {
        logger.info(`[UserService] ID로 사용자를 찾을 수 없음: ${id}`);
      }
      return user;
    } catch (error) {
      logger.error(`[UserService] ID로 사용자 찾기 실패: ${id}`, {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * 사용자 정보 수정
   */
  async updateUser(id: string, updateData: UpdateUserDto): Promise<User> {
    logger.info(`[UserService] 사용자 정보 수정 시작: ${id}`);

    try {
      const user = await this.userRepository.updateUser(id, updateData);
      logger.info(`[UserService] 사용자 정보 수정 성공: ${id}`);
      return user;
    } catch (error) {
      logger.error(`[UserService] 사용자 정보 수정 실패: ${id}`, {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * 사용자 프로필 조회
   */
  async getUserProfile(id: string): Promise<UserProfileResponse> {
    logger.info(`[UserService] 사용자 프로필 조회 시작: ${id}`);

    try {
      const profile = await this.userRepository.getUserProfile(id);
      logger.info(`[UserService] 사용자 프로필 조회 성공: ${id}`);
      return profile;
    } catch (error) {
      logger.error(`[UserService] 사용자 프로필 조회 실패: ${id}`, {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * 사용자 역할 업데이트 (관리자 전용)
   */
  async updateUserRole(id: string, role: 'USER' | 'ADMIN'): Promise<User> {
    logger.info(
      `[UserService] 사용자 역할 업데이트 시작: ${id}, 새 역할: ${role}`
    );

    try {
      const user = await this.userRepository.updateUserRole(id, role);
      logger.info(
        `[UserService] 사용자 역할 업데이트 성공: ${id}, 새 역할: ${role}`
      );
      return user;
    } catch (error) {
      logger.error(`[UserService] 사용자 역할 업데이트 실패: ${id}`, {
        error: error instanceof Error ? error.message : error,
        newRole: role,
      });
      throw error;
    }
  }
}
