import { PrismaClient, User } from '@prisma/client';
import { UpdateUserDto } from './user.schemas.js';
import { UserProfileResponse } from './dto/index.js';
import { UserRepository } from './user.repository.js';

export class UserService {
  private userRepository: UserRepository;

  constructor(prisma: PrismaClient) {
    this.userRepository = new UserRepository(prisma);
  }

  /**
   * 이메일로 사용자 찾기
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }

  /**
   * ID로 사용자 찾기
   */
  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findById(id);
  }

  /**
   * 사용자 정보 수정
   */
  async updateUser(id: string, updateData: UpdateUserDto): Promise<User> {
    return await this.userRepository.updateUser(id, updateData);
  }

  /**
   * 사용자 프로필 조회
   */
  async getUserProfile(id: string): Promise<UserProfileResponse> {
    return await this.userRepository.getUserProfile(id);
  }
}
