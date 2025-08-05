import { PrismaClient, Term, UserTermAgreement } from '@prisma/client';
import { TermError } from '../../common/exception/term/TermError';
import logger from '../../config/logger.config.js';

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
      const terms = await this.prisma.term.findMany({
        orderBy: {
          created_at: 'desc',
        },
      });

      logger.info('✅ 모든 약관 목록 조회 성공', {
        count: terms.length,
      });

      return terms;
    } catch (error) {
      throw TermError.databaseError('약관 목록 조회', error);
    }
  }

  /**
   * 특정 약관 조회
   */
  async getTermById(id: string): Promise<Term> {
    try {
      const term = await this.prisma.term.findUnique({
        where: { id },
      });

      if (!term) {
        throw TermError.notFound(id);
      }

      logger.info('✅ 약관 조회 성공', {
        termId: id,
        termType: term.type,
        version: term.version,
      });

      return term;
    } catch (error) {
      if (error instanceof TermError) {
        throw error;
      }
      throw TermError.databaseError('약관 조회', error);
    }
  }

  /**
   * 약관 유형별 조회
   */
  async getTermsByType(
    type: 'SERVICE' | 'PRIVACY' | 'ENROLLMENT'
  ): Promise<Term[]> {
    try {
      const terms = await this.prisma.term.findMany({
        where: { type },
        orderBy: {
          created_at: 'desc',
        },
      });

      if (terms.length === 0) {
        throw TermError.typeNotFound(type);
      }

      logger.info('✅ 약관 유형별 조회 성공', {
        type,
        count: terms.length,
      });

      return terms;
    } catch (error) {
      if (error instanceof TermError) {
        throw error;
      }
      throw TermError.databaseError('약관 유형별 조회', error);
    }
  }

  /**
   * 필수 약관 조회
   */
  async getRequiredTerms(): Promise<Term[]> {
    try {
      const terms = await this.prisma.term.findMany({
        where: { isRequired: true },
        orderBy: {
          created_at: 'desc',
        },
      });

      if (terms.length === 0) {
        throw TermError.requiredTermsNotFound();
      }

      logger.info('✅ 필수 약관 조회 성공', {
        count: terms.length,
      });

      return terms;
    } catch (error) {
      if (error instanceof TermError) {
        throw error;
      }
      throw TermError.databaseError('필수 약관 조회', error);
    }
  }

  /**
   * 최신 버전의 약관 조회
   */
  async getLatestTermsByType(
    type: 'SERVICE' | 'PRIVACY' | 'ENROLLMENT'
  ): Promise<Term> {
    try {
      const term = await this.prisma.term.findFirst({
        where: { type },
        orderBy: {
          created_at: 'desc',
        },
      });

      if (!term) {
        throw TermError.latestVersionNotFound(type);
      }

      logger.info('✅ 최신 약관 조회 성공', {
        type,
        termId: term.id,
        version: term.version,
      });

      return term;
    } catch (error) {
      if (error instanceof TermError) {
        throw error;
      }
      throw TermError.databaseError('최신 약관 조회', error);
    }
  }

  /**
   * 새 약관 생성
   */
  async createTerm(termData: {
    type: 'SERVICE' | 'PRIVACY' | 'ENROLLMENT';
    title: string;
    content: string;
    isRequired?: boolean;
    version: string;
  }): Promise<Term> {
    try {
      // 동일한 유형과 버전이 이미 존재하는지 확인
      const existingTerm = await this.prisma.term.findFirst({
        where: {
          type: termData.type,
          version: termData.version,
        },
      });

      if (existingTerm) {
        throw TermError.duplicateVersion(termData.version, termData.type);
      }

      const term = await this.prisma.term.create({
        data: termData,
      });

      logger.info('✅ 약관 생성 성공', {
        termId: term.id,
        type: term.type,
        version: term.version,
        isRequired: term.isRequired,
      });

      return term;
    } catch (error) {
      if (error instanceof TermError) {
        throw error;
      }
      throw TermError.databaseError('약관 생성', error);
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
      isRequired?: boolean;
      version?: string;
    }
  ): Promise<Term> {
    try {
      const existingTerm = await this.prisma.term.findUnique({
        where: { id },
      });

      if (!existingTerm) {
        throw TermError.notFound(id);
      }

      // 버전이 변경되는 경우 중복 확인
      if (updateData.version && updateData.version !== existingTerm.version) {
        const duplicateVersion = await this.prisma.term.findFirst({
          where: {
            type: existingTerm.type,
            version: updateData.version,
            id: { not: id },
          },
        });

        if (duplicateVersion) {
          throw TermError.duplicateVersion(
            updateData.version,
            existingTerm.type
          );
        }
      }

      const updatedTerm = await this.prisma.term.update({
        where: { id },
        data: updateData,
      });

      logger.info('✅ 약관 수정 성공', {
        termId: id,
        updatedFields: Object.keys(updateData),
        newVersion: updatedTerm.version,
      });

      return updatedTerm;
    } catch (error) {
      if (error instanceof TermError) {
        throw error;
      }
      throw TermError.databaseError('약관 수정', error);
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
        throw TermError.notFound(id);
      }

      // 동의 기록이 있으면 삭제 불가
      if (existingTerm.user_term_agreements.length > 0) {
        throw TermError.cannotDeleteWithAgreements();
      }

      await this.prisma.term.delete({
        where: { id },
      });

      logger.info('✅ 약관 삭제 성공', {
        termId: id,
        termType: existingTerm.type,
        version: existingTerm.version,
      });
    } catch (error) {
      if (error instanceof TermError) {
        throw error;
      }
      throw TermError.databaseError('약관 삭제', error);
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
        throw TermError.notFound(termId);
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
        throw TermError.alreadyAgreed(userId, termId);
      }

      const agreement = await this.prisma.userTermAgreement.create({
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

      logger.info('✅ 약관 동의 성공', {
        userId,
        termId,
        agreedAt: agreement.agreed_at,
      });

      return agreement;
    } catch (error) {
      if (error instanceof TermError) {
        throw error;
      }
      throw TermError.databaseError('약관 동의', error);
    }
  }

  /**
   * 사용자의 약관 동의 목록 조회
   */
  async getUserAgreements(userId: string): Promise<UserTermAgreement[]> {
    try {
      const agreements = await this.prisma.userTermAgreement.findMany({
        where: { user_id: userId },
        include: {
          term: true,
        },
        orderBy: {
          agreed_at: 'desc',
        },
      });

      logger.info('✅ 사용자 약관 동의 목록 조회 성공', {
        userId,
        count: agreements.length,
      });

      return agreements;
    } catch (error) {
      throw TermError.databaseError('사용자 약관 동의 목록 조회', error);
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
      throw TermError.databaseError('약관 동의 확인', error);
    }
  }

  /**
   * 사용자가 필수 약관에 모두 동의했는지 확인
   */
  async hasUserAgreedToAllRequired(userId: string): Promise<boolean> {
    try {
      const requiredTerms = await this.prisma.term.findMany({
        where: { isRequired: true },
      });

      if (requiredTerms.length === 0) {
        return true;
      }

      const userAgreements = await this.prisma.userTermAgreement.findMany({
        where: {
          user_id: userId,
          term: {
            isRequired: true,
          },
        },
      });

      return userAgreements.length === requiredTerms.length;
    } catch (error) {
      throw TermError.databaseError('필수 약관 동의 확인', error);
    }
  }
}
