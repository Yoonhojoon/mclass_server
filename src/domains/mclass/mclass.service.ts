import { MClassRepository } from './mclass.repository.js';
import { CreateMClassRequest } from '../../schemas/mclass/index.js';
import {
  UpdateMClassRequest,
  MClassListQuery,
} from '../../schemas/mclass/index.js';
import { MClassError } from '../../common/exception/mclass/MClassError.js';
import logger from '../../config/logger.config.js';

export type MClassPhase = 'UPCOMING' | 'RECRUITING' | 'IN_PROGRESS' | 'ENDED';

export interface MClassWithPhase {
  id: string;
  title: string;
  description: string;
  selectionType: string;
  capacity: number | null;
  allowWaitlist: boolean;
  waitlistCapacity: number | null;
  visibility: string;
  recruitStartAt: string | null;
  recruitEndAt: string | null;
  startAt: string;
  endAt: string;
  isOnline: boolean;
  location: string | null;
  fee: number | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  phase: MClassPhase;
}

export class MClassService {
  constructor(private repository: MClassRepository) {}

  /**
   * Phase 계산 로직 (실시간 approvedCount 사용)
   */
  private async calculatePhase(mclass: any): Promise<MClassPhase> {
    const now = new Date();
    const {
      recruitStartAt,
      recruitEndAt,
      startAt,
      endAt,
      visibility,
      capacity,
    } = mclass;

    // UPCOMING: 모집 시작 전
    if (recruitStartAt && now < recruitStartAt) {
      return 'UPCOMING';
    }

    // RECRUITING: 모집 중 (실시간 approvedCount 계산)
    if (
      recruitStartAt &&
      recruitEndAt &&
      now >= recruitStartAt &&
      now < recruitEndAt &&
      visibility === 'PUBLIC'
    ) {
      const approvedCount = await this.repository.getApprovedCount(mclass.id);
      if (capacity === null || approvedCount < capacity) {
        return 'RECRUITING';
      }
    }

    // IN_PROGRESS: 진행 중
    if (now >= startAt && now < endAt) {
      return 'IN_PROGRESS';
    }

    // ENDED: 종료됨
    if (now >= endAt) {
      return 'ENDED';
    }

    // 기본값: UPCOMING
    return 'UPCOMING';
  }

  /**
   * MClass 데이터에 phase 추가 및 Date를 문자열로 변환
   */
  private async addPhaseToMClass(mclass: any): Promise<MClassWithPhase> {
    const phase = await this.calculatePhase(mclass);
    return {
      ...mclass,
      phase,
      recruitStartAt: mclass.recruitStartAt?.toISOString() || null,
      recruitEndAt: mclass.recruitEndAt?.toISOString() || null,
      startAt: mclass.startAt.toISOString(),
      endAt: mclass.endAt.toISOString(),
      createdAt: mclass.createdAt.toISOString(),
      updatedAt: mclass.updatedAt.toISOString(),
    };
  }

  /**
   * MClass 목록 조회
   */
  async list(
    query: MClassListQuery,
    isAdmin: boolean = false
  ): Promise<{
    items: MClassWithPhase[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
  }> {
    logger.info(
      `[MClassService] MClass 목록 조회 시작: ${JSON.stringify(query)}, 관리자: ${isAdmin}`
    );

    try {
      const result = await this.repository.findWithFilters(query, isAdmin);

      // 각 MClass에 phase 추가 (비동기 처리)
      const itemsWithPhase = await Promise.all(
        result.items.map(mclass => this.addPhaseToMClass(mclass))
      );

      // phase 필터링 (서비스 레벨에서 처리)
      let filteredItems = itemsWithPhase;
      if (query.phase) {
        filteredItems = itemsWithPhase.filter(
          item => item.phase === query.phase
        );
      }

      const response = {
        items: filteredItems,
        total: result.total,
        page: result.page,
        size: result.size,
        totalPages: result.totalPages,
      };

      logger.info(
        `[MClassService] MClass 목록 조회 성공: 총 ${result.total}개, 페이지 ${result.page}/${result.totalPages}`
      );
      return response;
    } catch (error) {
      logger.error(`[MClassService] MClass 목록 조회 실패`, {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * MClass 단일 조회
   */
  async getById(id: string): Promise<MClassWithPhase> {
    logger.info(`[MClassService] MClass 단일 조회 시작: ${id}`);

    try {
      const mclass = await this.repository.findById(id);
      if (!mclass) {
        logger.warn(`[MClassService] MClass를 찾을 수 없음: ${id}`);
        throw MClassError.notFound(id);
      }

      const result = await this.addPhaseToMClass(mclass);
      logger.info(
        `[MClassService] MClass 단일 조회 성공: ${id}, Phase: ${result.phase}`
      );
      return result;
    } catch (error) {
      logger.error(`[MClassService] MClass 단일 조회 실패: ${id}`, {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * MClass 생성
   */
  async create(
    adminId: string,
    data: CreateMClassRequest
  ): Promise<MClassWithPhase> {
    logger.info(
      `[MClassService] MClass 생성 시작: 제목 "${data.title}", 관리자 ID ${adminId}`
    );

    try {
      // 제목 중복 체크
      const existingMClass = await this.repository.findByTitle(data.title);
      if (existingMClass) {
        logger.warn(
          `[MClassService] 중복된 제목으로 MClass 생성 시도: "${data.title}", 관리자 ID ${adminId}`
        );
        throw MClassError.duplicateTitle(data.title);
      }

      const mclass = await this.repository.create(data, adminId);
      const result = await this.addPhaseToMClass(mclass);
      logger.info(
        `[MClassService] MClass 생성 성공: ID ${result.id}, 제목 "${data.title}", 관리자 ID ${adminId}`
      );
      return result;
    } catch (error) {
      logger.error(
        `[MClassService] MClass 생성 실패: 제목 "${data.title}", 관리자 ID ${adminId}`,
        { error: error instanceof Error ? error.message : error }
      );
      throw error;
    }
  }

  /**
   * MClass 수정
   */
  async update(
    id: string,
    data: UpdateMClassRequest
  ): Promise<MClassWithPhase> {
    logger.info(`[MClassService] MClass 수정 시작: ${id}`);

    try {
      // MClass 존재 확인
      const existingMClass = await this.repository.findById(id);
      if (!existingMClass) {
        logger.warn(`[MClassService] 수정할 MClass를 찾을 수 없음: ${id}`);
        throw MClassError.notFound(id);
      }

      // 제목 변경 시 중복 체크
      if (data.title && data.title !== existingMClass.title) {
        const duplicateMClass = await this.repository.findByTitle(data.title);
        if (duplicateMClass) {
          logger.warn(
            `[MClassService] 중복된 제목으로 MClass 수정 시도: "${data.title}", MClass ID ${id}`
          );
          throw MClassError.duplicateTitle(data.title);
        }
      }

      // 모집 중인 클래스 수정 제한 체크
      const currentPhase = await this.calculatePhase(existingMClass);
      if (currentPhase === 'RECRUITING') {
        logger.warn(
          `[MClassService] 모집 중인 MClass 수정 시도: ${id}, Phase: ${currentPhase}`
        );
        throw MClassError.cannotModifyRecruiting(id);
      }

      const mclass = await this.repository.update(id, data);
      const result = await this.addPhaseToMClass(mclass);
      logger.info(
        `[MClassService] MClass 수정 성공: ${id}, Phase: ${result.phase}`
      );
      return result;
    } catch (error) {
      logger.error(`[MClassService] MClass 수정 실패: ${id}`, {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * MClass 삭제
   */
  async delete(id: string): Promise<void> {
    logger.info(`[MClassService] MClass 삭제 시작: ${id}`);

    try {
      // MClass 존재 확인
      const existingMClass = await this.repository.findById(id);
      if (!existingMClass) {
        logger.warn(`[MClassService] 삭제할 MClass를 찾을 수 없음: ${id}`);
        throw MClassError.notFound(id);
      }

      // 진행 중인 클래스 삭제 제한 체크
      const currentPhase = await this.calculatePhase(existingMClass);
      if (currentPhase === 'IN_PROGRESS') {
        logger.warn(
          `[MClassService] 진행 중인 MClass 삭제 시도: ${id}, Phase: ${currentPhase}`
        );
        throw MClassError.cannotDeleteInProgress(id);
      }

      await this.repository.delete(id);
      logger.info(`[MClassService] MClass 삭제 성공: ${id}`);
    } catch (error) {
      logger.error(`[MClassService] MClass 삭제 실패: ${id}`, {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * 승인된 인원 수 조회 (실시간)
   */
  async getApprovedCount(mclassId: string): Promise<number> {
    logger.debug(`[MClassService] 승인된 인원 수 조회: ${mclassId}`);

    try {
      const count = await this.repository.getApprovedCount(mclassId);
      logger.debug(
        `[MClassService] 승인된 인원 수 조회 성공: ${mclassId}, 인원 수: ${count}`
      );
      return count;
    } catch (error) {
      logger.error(`[MClassService] 승인된 인원 수 조회 실패: ${mclassId}`, {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * 대기열 인원 수 조회
   */
  async getWaitlistedCount(mclassId: string): Promise<number> {
    logger.debug(`[MClassService] 대기열 인원 수 조회: ${mclassId}`);

    try {
      const count = await this.repository.getWaitlistedCount(mclassId);
      logger.debug(
        `[MClassService] 대기열 인원 수 조회 성공: ${mclassId}, 인원 수: ${count}`
      );
      return count;
    } catch (error) {
      logger.error(`[MClassService] 대기열 인원 수 조회 실패: ${mclassId}`, {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * MClass 통계 정보 조회
   */
  async getStatistics(mclassId: string): Promise<{
    approvedCount: number;
    waitlistedCount: number;
  }> {
    logger.info(`[MClassService] MClass 통계 정보 조회 시작: ${mclassId}`);

    try {
      const [approvedCount, waitlistedCount] = await Promise.all([
        this.getApprovedCount(mclassId),
        this.getWaitlistedCount(mclassId),
      ]);

      const result = {
        approvedCount,
        waitlistedCount,
      };

      logger.info(
        `[MClassService] MClass 통계 정보 조회 성공: ${mclassId}, 승인: ${approvedCount}, 대기: ${waitlistedCount}`
      );
      return result;
    } catch (error) {
      logger.error(`[MClassService] MClass 통계 정보 조회 실패: ${mclassId}`, {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }
}
