import { PrismaClient, Term, UserTermAgreement } from '@prisma/client';
import { TermError } from '../../common/exception/term/TermError.js';
import logger from '../../config/logger.config.js';
import {
  TermRepository,
  CreateTermData,
  UpdateTermData,
} from './term.repository.js';

export class TermService {
  private repository: TermRepository;

  constructor(prisma: PrismaClient) {
    this.repository = new TermRepository(prisma);
  }

  /**
   * 모든 약관 목록 조회
   */
  async getAllTerms(): Promise<Term[]> {
    try {
      const terms = await this.repository.findAll();

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
      const term = await this.repository.findById(id);

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
   * 새 약관 생성
   */
  async createTerm(termData: CreateTermData): Promise<Term> {
    try {
      // 동일한 유형과 버전이 이미 존재하는지 확인
      const existingTerm = await this.repository.findByTypeAndVersion(
        termData.type,
        termData.version
      );

      if (existingTerm) {
        throw TermError.duplicateVersion(termData.version, termData.type);
      }

      const term = await this.repository.create(termData);

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
  async updateTerm(id: string, updateData: UpdateTermData): Promise<Term> {
    try {
      const existingTerm = await this.repository.findById(id);

      if (!existingTerm) {
        throw TermError.notFound(id);
      }

      // 버전이 변경되는 경우 중복 확인
      if (updateData.version && updateData.version !== existingTerm.version) {
        const duplicateVersion =
          await this.repository.findByTypeAndVersionExcludeId(
            existingTerm.type,
            updateData.version,
            id
          );

        if (duplicateVersion) {
          throw TermError.duplicateVersion(
            updateData.version,
            existingTerm.type
          );
        }
      }

      const updatedTerm = await this.repository.update(id, updateData);

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
      const existingTerm = await this.repository.findWithAgreements(id);

      if (!existingTerm) {
        throw TermError.notFound(id);
      }

      // 동의 기록이 있으면 삭제 불가
      if (existingTerm.userTermAgreements.length > 0) {
        throw TermError.cannotDeleteWithAgreements();
      }

      await this.repository.delete(id);

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
      const term = await this.repository.findById(termId);

      if (!term) {
        throw TermError.notFound(termId);
      }

      // 이미 동의했는지 확인
      const existingAgreement = await this.repository.findUserAgreement(
        userId,
        termId
      );

      if (existingAgreement) {
        throw TermError.alreadyAgreed(userId, termId);
      }

      const agreement = await this.repository.createUserAgreement(
        userId,
        termId
      );

      logger.info('✅ 약관 동의 성공', {
        userId,
        termId,
        agreedAt: agreement.agreedAt,
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
      const agreements = await this.repository.findUserAgreements(userId);

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
      return await this.repository.hasUserAgreed(userId, termId);
    } catch (error) {
      throw TermError.databaseError('약관 동의 확인', error);
    }
  }

  /**
   * 사용자가 필수 약관에 모두 동의했는지 확인
   */
  async hasUserAgreedToAllRequired(userId: string): Promise<boolean> {
    try {
      const requiredTerms = await this.repository.findRequiredTerms();

      if (requiredTerms.length === 0) {
        return true;
      }

      const userAgreements =
        await this.repository.findUserRequiredAgreements(userId);

      return userAgreements.length === requiredTerms.length;
    } catch (error) {
      throw TermError.databaseError('필수 약관 동의 확인', error);
    }
  }
}
