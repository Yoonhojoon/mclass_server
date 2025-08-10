import { MClassRepository } from './mclass.repository.js';
import { CreateMClassDto } from './dto/CreateMClassDto.js';
import { UpdateMClassDto } from './dto/UpdateMClassDto.js';
import { ListQueryDto } from './dto/ListQueryDto.js';
import { MClassError } from '../../common/exception/mclass/MClassError.js';
import { MClassResponse } from './dto/MClassResponse.js';

export type MClassPhase = 'UPCOMING' | 'RECRUITING' | 'IN_PROGRESS' | 'ENDED';

export interface MClassWithPhase extends MClassResponse {
  phase: MClassPhase;
}

export class MClassService {
  constructor(private repository: MClassRepository) {}

  /**
   * Phase 계산 로직
   */
  private calculatePhase(mclass: any): MClassPhase {
    const now = new Date();
    const {
      recruitStartAt,
      recruitEndAt,
      startAt,
      endAt,
      visibility,
      capacity,
      approvedCount,
    } = mclass;

    // UPCOMING: 모집 시작 전
    if (recruitStartAt && now < recruitStartAt) {
      return 'UPCOMING';
    }

    // RECRUITING: 모집 중
    if (
      recruitStartAt &&
      recruitEndAt &&
      now >= recruitStartAt &&
      now < recruitEndAt &&
      visibility === 'PUBLIC' &&
      (capacity === null || approvedCount < capacity)
    ) {
      return 'RECRUITING';
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
   * MClass 데이터에 phase 추가
   */
  private addPhaseToMClass(mclass: any): MClassWithPhase {
    const phase = this.calculatePhase(mclass);
    return {
      ...mclass,
      phase,
    };
  }

  /**
   * MClass 목록 조회
   */
  async list(query: ListQueryDto, isAdmin: boolean = false) {
    const result = await this.repository.findWithFilters(query, isAdmin);

    // 각 MClass에 phase 추가
    const itemsWithPhase = result.items.map(mclass =>
      this.addPhaseToMClass(mclass)
    );

    // phase 필터링 (서비스 레벨에서 처리)
    let filteredItems = itemsWithPhase;
    if (query.phase) {
      filteredItems = itemsWithPhase.filter(item => item.phase === query.phase);
    }

    return {
      items: filteredItems,
      total: result.total,
      page: result.page,
      size: result.size,
      totalPages: result.totalPages,
    };
  }

  /**
   * MClass 단일 조회
   */
  async getById(id: string): Promise<MClassWithPhase> {
    const mclass = await this.repository.findById(id);
    if (!mclass) {
      throw MClassError.notFound(id);
    }

    return this.addPhaseToMClass(mclass);
  }

  /**
   * MClass 생성
   */
  async create(
    adminId: string,
    data: CreateMClassDto
  ): Promise<MClassWithPhase> {
    // 제목 중복 체크
    const existingMClass = await this.repository.findByTitle(data.title);
    if (existingMClass) {
      throw MClassError.duplicateTitle(data.title);
    }

    const mclass = await this.repository.create(data, adminId);
    return this.addPhaseToMClass(mclass);
  }

  /**
   * MClass 수정
   */
  async update(id: string, data: UpdateMClassDto): Promise<MClassWithPhase> {
    // MClass 존재 확인
    const existingMClass = await this.repository.findById(id);
    if (!existingMClass) {
      throw MClassError.notFound(id);
    }

    // 제목 변경 시 중복 체크
    if (data.title && data.title !== existingMClass.title) {
      const duplicateMClass = await this.repository.findByTitle(data.title);
      if (duplicateMClass) {
        throw MClassError.duplicateTitle(data.title);
      }
    }

    // 모집 중인 클래스 수정 제한 체크
    const currentPhase = this.calculatePhase(existingMClass);
    if (currentPhase === 'RECRUITING') {
      throw MClassError.cannotModifyRecruiting(id);
    }

    const mclass = await this.repository.update(id, data);
    return this.addPhaseToMClass(mclass);
  }

  /**
   * MClass 삭제
   */
  async delete(id: string): Promise<void> {
    // MClass 존재 확인
    const existingMClass = await this.repository.findById(id);
    if (!existingMClass) {
      throw MClassError.notFound(id);
    }

    // 진행 중인 클래스 삭제 제한 체크
    const currentPhase = this.calculatePhase(existingMClass);
    if (currentPhase === 'IN_PROGRESS') {
      throw MClassError.cannotDeleteInProgress(id);
    }

    await this.repository.delete(id);
  }

  /**
   * 승인된 인원 수 조회 (실시간)
   */
  async getApprovedCount(mclassId: string): Promise<number> {
    return this.repository.getApprovedCount(mclassId);
  }

  /**
   * 대기열 인원 수 조회
   */
  async getWaitlistedCount(mclassId: string): Promise<number> {
    return this.repository.getWaitlistedCount(mclassId);
  }

  /**
   * MClass 통계 정보 조회
   */
  async getStatistics(mclassId: string) {
    const [approvedCount, waitlistedCount] = await Promise.all([
      this.getApprovedCount(mclassId),
      this.getWaitlistedCount(mclassId),
    ]);

    return {
      approvedCount,
      waitlistedCount,
    };
  }
}
