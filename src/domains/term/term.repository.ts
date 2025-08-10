import { PrismaClient, Term, UserTermAgreement } from '@prisma/client';

export interface CreateTermData {
  type: 'SERVICE' | 'PRIVACY' | 'ENROLLMENT';
  title: string;
  content: string;
  isRequired?: boolean;
  version: string;
}

export interface UpdateTermData {
  title?: string;
  content?: string;
  isRequired?: boolean;
  version?: string;
}

export class TermRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Prisma 인스턴스 접근자
   */
  getPrisma(): PrismaClient {
    return this.prisma;
  }

  /**
   * 모든 약관 목록 조회
   */
  async findAll(): Promise<Term[]> {
    return await this.prisma.term.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * ID로 약관 조회
   */
  async findById(id: string): Promise<Term | null> {
    return await this.prisma.term.findUnique({
      where: { id },
    });
  }

  /**
   * 유형과 버전으로 약관 조회
   */
  async findByTypeAndVersion(
    type: 'SERVICE' | 'PRIVACY' | 'ENROLLMENT',
    version: string
  ): Promise<Term | null> {
    return await this.prisma.term.findFirst({
      where: {
        type,
        version,
      },
    });
  }

  /**
   * 유형과 버전으로 약관 조회 (ID 제외)
   */
  async findByTypeAndVersionExcludeId(
    type: 'SERVICE' | 'PRIVACY' | 'ENROLLMENT',
    version: string,
    excludeId: string
  ): Promise<Term | null> {
    return await this.prisma.term.findFirst({
      where: {
        type,
        version,
        id: { not: excludeId },
      },
    });
  }

  /**
   * 필수 약관 목록 조회
   */
  async findRequiredTerms(): Promise<Term[]> {
    return await this.prisma.term.findMany({
      where: { isRequired: true },
    });
  }

  /**
   * 새 약관 생성
   */
  async create(termData: CreateTermData): Promise<Term> {
    return await this.prisma.term.create({
      data: termData,
    });
  }

  /**
   * 약관 수정
   */
  async update(id: string, updateData: UpdateTermData): Promise<Term> {
    return await this.prisma.term.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * 약관 삭제
   */
  async delete(id: string): Promise<void> {
    await this.prisma.term.delete({
      where: { id },
    });
  }

  /**
   * 약관과 관련된 동의 기록 조회
   */
  async findWithAgreements(
    id: string
  ): Promise<(Term & { userTermAgreements: UserTermAgreement[] }) | null> {
    return await this.prisma.term.findUnique({
      where: { id },
      include: {
        userTermAgreements: true,
      },
    });
  }

  /**
   * 사용자 약관 동의 생성
   */
  async createUserAgreement(
    userId: string,
    termId: string
  ): Promise<
    UserTermAgreement & {
      user: { id: string; name: string | null; email: string };
      term: Term;
    }
  > {
    return await this.prisma.userTermAgreement.create({
      data: {
        userId,
        termId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        term: true,
      },
    });
  }

  /**
   * 사용자 약관 동의 조회
   */
  async findUserAgreement(
    userId: string,
    termId: string
  ): Promise<UserTermAgreement | null> {
    return await this.prisma.userTermAgreement.findFirst({
      where: {
        userId,
        termId,
      },
    });
  }

  /**
   * 사용자의 모든 약관 동의 목록 조회
   */
  async findUserAgreements(
    userId: string
  ): Promise<(UserTermAgreement & { term: Term })[]> {
    return await this.prisma.userTermAgreement.findMany({
      where: { userId },
      include: {
        term: true,
      },
      orderBy: {
        agreedAt: 'desc',
      },
    });
  }

  /**
   * 사용자의 필수 약관 동의 목록 조회
   */
  async findUserRequiredAgreements(
    userId: string
  ): Promise<UserTermAgreement[]> {
    return await this.prisma.userTermAgreement.findMany({
      where: {
        userId,
        term: {
          isRequired: true,
        },
      },
    });
  }

  /**
   * 사용자가 특정 약관에 동의했는지 확인
   */
  async hasUserAgreed(userId: string, termId: string): Promise<boolean> {
    const agreement = await this.prisma.userTermAgreement.findFirst({
      where: {
        userId,
        termId,
      },
    });

    return !!agreement;
  }
}
