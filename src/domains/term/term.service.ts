import { PrismaClient, Term, UserTermAgreement } from '@prisma/client';
import { BaseError } from '../../common/exception/BaseError';
import { TermError } from '../../common/exception/term/TermError';

export class TermService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 모든 약관 목록 조회
   */
  async getAllTerms(): Promise<Term[]> {
    try {
      return await this.prisma.term.findMany({
        orderBy: {
          created_at: 'desc',
        },
      });
    } catch (error) {
      throw new TermError('약관 목록 조회에 실패했습니다.', error);
    }
  }

  /**
   * 특정 약관 조회
   */
  async getTermById(id: string): Promise<Term | null> {
    try {
      return await this.prisma.term.findUnique({
        where: { id },
      });
    } catch (error) {
      throw new TermError('약관 조회에 실패했습니다.', error);
    }
  }

  /**
   * 약관 유형별 조회
   */
  async getTermsByType(
    type: 'SERVICE' | 'PRIVACY' | 'ENROLLMENT'
  ): Promise<Term[]> {
    try {
      return await this.prisma.term.findMany({
        where: { type },
        orderBy: {
          created_at: 'desc',
        },
      });
    } catch (error) {
      throw new TermError('약관 유형별 조회에 실패했습니다.', error);
    }
  }

  /**
   * 필수 약관 조회
   */
  async getRequiredTerms(): Promise<Term[]> {
    try {
      return await this.prisma.term.findMany({
        where: { is_required: true },
        orderBy: {
          created_at: 'desc',
        },
      });
    } catch (error) {
      throw new TermError('필수 약관 조회에 실패했습니다.', error);
    }
  }

  /**
   * 최신 버전의 약관 조회
   */
  async getLatestTermsByType(
    type: 'SERVICE' | 'PRIVACY' | 'ENROLLMENT'
  ): Promise<Term | null> {
    try {
      return await this.prisma.term.findFirst({
        where: { type },
        orderBy: {
          created_at: 'desc',
        },
      });
    } catch (error) {
      throw new TermError('최신 약관 조회에 실패했습니다.', error);
    }
  }

  /**
   * 새 약관 생성
   */
  async createTerm(termData: {
    type: 'SERVICE' | 'PRIVACY' | 'ENROLLMENT';
    title: string;
    content: string;
    is_required?: boolean;
    version: string;
  }): Promise<Term> {
    try {
      return await this.prisma.term.create({
        data: termData,
      });
    } catch (error) {
      throw new TermError('약관 생성에 실패했습니다.', error);
    }
  }

  /**
   * 약관 수정
   */
  async updateTerm(
    id: string,
    updateData: {
      title?: string;
      content?: string;
      is_required?: boolean;
      version?: string;
    }
  ): Promise<Term> {
    try {
      const existingTerm = await this.prisma.term.findUnique({
        where: { id },
      });

      if (!existingTerm) {
        throw new TermError('존재하지 않는 약관입니다.');
      }

      return await this.prisma.term.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      throw new TermError('약관 수정에 실패했습니다.', error);
    }
  }

  /**
   * 약관 삭제
   */
  async deleteTerm(id: string): Promise<void> {
    try {
      const existingTerm = await this.prisma.term.findUnique({
        where: { id },
        include: {
          user_term_agreements: true,
        },
      });

      if (!existingTerm) {
        throw new TermError('존재하지 않는 약관입니다.');
      }

      // 동의 기록이 있으면 삭제 불가
      if (existingTerm.user_term_agreements.length > 0) {
        throw new TermError(
          '사용자 동의 기록이 있는 약관은 삭제할 수 없습니다.'
        );
      }

      await this.prisma.term.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      throw new TermError('약관 삭제에 실패했습니다.', error);
    }
  }

  /**
   * 사용자 약관 동의
   */
  async agreeToTerm(
    userId: string,
    termId: string
  ): Promise<UserTermAgreement> {
    try {
      // 약관이 존재하는지 확인
      const term = await this.prisma.term.findUnique({
        where: { id: termId },
      });

      if (!term) {
        throw new TermError('존재하지 않는 약관입니다.');
      }

      // 이미 동의했는지 확인
      const existingAgreement = await this.prisma.userTermAgreement.findUnique({
        where: {
          user_id_term_id: {
            user_id: userId,
            term_id: termId,
          },
        },
      });

      if (existingAgreement) {
        throw new TermError('이미 동의한 약관입니다.');
      }

      return await this.prisma.userTermAgreement.create({
        data: {
          user_id: userId,
          term_id: termId,
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
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      throw new TermError('약관 동의에 실패했습니다.', error);
    }
  }

  /**
   * 사용자의 약관 동의 목록 조회
   */
  async getUserAgreements(userId: string): Promise<UserTermAgreement[]> {
    try {
      return await this.prisma.userTermAgreement.findMany({
        where: { user_id: userId },
        include: {
          term: true,
        },
        orderBy: {
          agreed_at: 'desc',
        },
      });
    } catch (error) {
      throw new TermError('사용자 약관 동의 목록 조회에 실패했습니다.', error);
    }
  }

  /**
   * 사용자가 특정 약관에 동의했는지 확인
   */
  async hasUserAgreed(userId: string, termId: string): Promise<boolean> {
    try {
      const agreement = await this.prisma.userTermAgreement.findUnique({
        where: {
          user_id_term_id: {
            user_id: userId,
            term_id: termId,
          },
        },
      });

      return !!agreement;
    } catch (error) {
      throw new TermError('약관 동의 확인에 실패했습니다.', error);
    }
  }

  /**
   * 사용자가 필수 약관에 모두 동의했는지 확인
   */
  async hasUserAgreedToAllRequired(userId: string): Promise<boolean> {
    try {
      const requiredTerms = await this.prisma.term.findMany({
        where: { is_required: true },
      });

      if (requiredTerms.length === 0) {
        return true;
      }

      const userAgreements = await this.prisma.userTermAgreement.findMany({
        where: {
          user_id: userId,
          term: {
            is_required: true,
          },
        },
      });

      return userAgreements.length === requiredTerms.length;
    } catch (error) {
      throw new TermError('필수 약관 동의 확인에 실패했습니다.', error);
    }
  }
}
