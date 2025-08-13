import { PrismaClient, MClass, Prisma } from '@prisma/client';
import { CreateMClassRequest } from '../../schemas/mclass/index.js';
import {
  UpdateMClassRequest,
  MClassListQuery,
} from '../../schemas/mclass/index.js';

export class MClassRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 날짜 유효성 검증 헬퍼 메서드
   */
  private validateDate(dateValue: any, fieldName: string): Date {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      throw new Error(
        `${fieldName}에 유효하지 않은 날짜가 입력되었습니다: ${dateValue}`
      );
    }
    return date;
  }

  /**
   * 날짜 범위 유효성 검증 헬퍼 메서드
   */
  private validateDateRange(
    startDate: Date,
    endDate: Date,
    startFieldName: string,
    endFieldName: string
  ): void {
    if (startDate >= endDate) {
      throw new Error(
        `${startFieldName}은 ${endFieldName}보다 이전이어야 합니다.`
      );
    }
  }

  /**
   * 필터링된 MClass 목록 조회
   */
  async findWithFilters(
    query: MClassListQuery,
    isAdmin: boolean = false
  ): Promise<{
    items: MClass[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
  }> {
    const { page, size, sort, order, visibility, selectionType } = query;
    const skip = (page - 1) * size;

    // 기본 WHERE 조건
    const where: Prisma.MClassWhereInput = {};

    // visibility 필터링 (관리자가 아니면 PUBLIC만)
    if (!isAdmin) {
      where.visibility = 'PUBLIC';
    } else if (visibility) {
      where.visibility = visibility;
    }

    // selectionType 필터링
    if (selectionType) {
      where.selectionType = selectionType;
    }

    // 정렬 조건
    const orderBy: Prisma.MClassOrderByWithRelationInput = {};
    orderBy[sort] = order;

    // 쿼리 실행
    const [items, total] = await Promise.all([
      this.prisma.mClass.findMany({
        where,
        orderBy,
        skip,
        take: size,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.mClass.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * ID로 MClass 조회
   */
  async findById(id: string): Promise<MClass | null> {
    return this.prisma.mClass.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * 제목으로 MClass 조회 (중복 체크용)
   */
  async findByTitle(title: string): Promise<MClass | null> {
    return this.prisma.mClass.findFirst({
      where: { title },
    });
  }

  /**
   * MClass 생성
   */
  async create(data: CreateMClassRequest, adminId: string): Promise<MClass> {
    // 날짜 유효성 검증
    const recruitStartAt = this.validateDate(
      data.recruitStartAt,
      '모집 시작일'
    );
    const recruitEndAt = this.validateDate(data.recruitEndAt, '모집 종료일');
    const startAt = this.validateDate(data.startAt, '행사 시작일');
    const endAt = this.validateDate(data.endAt, '행사 종료일');

    // 날짜 범위 유효성 검증
    this.validateDateRange(
      recruitStartAt,
      recruitEndAt,
      '모집 시작일',
      '모집 종료일'
    );
    this.validateDateRange(startAt, endAt, '행사 시작일', '행사 종료일');
    this.validateDateRange(recruitEndAt, startAt, '모집 종료일', '행사 시작일');

    const mclassData: Prisma.MClassCreateInput = {
      title: data.title,
      description: data.description,
      selectionType: data.selectionType,
      capacity: data.capacity,
      allowWaitlist: data.allowWaitlist,
      waitlistCapacity: data.waitlistCapacity,
      visibility: data.visibility,
      recruitStartAt,
      recruitEndAt,
      startAt,
      endAt,
      isOnline: data.isOnline,
      location: data.location,
      fee: data.fee,
      creator: {
        connect: { id: adminId },
      },
    };

    return this.prisma.mClass.create({
      data: mclassData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * MClass 수정
   */
  async update(id: string, data: UpdateMClassRequest): Promise<MClass> {
    const updateData: Prisma.MClassUpdateInput = {};

    // 각 필드별로 업데이트 데이터 구성
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.selectionType !== undefined)
      updateData.selectionType = data.selectionType;
    if (data.capacity !== undefined) updateData.capacity = data.capacity;
    if (data.allowWaitlist !== undefined)
      updateData.allowWaitlist = data.allowWaitlist;
    if (data.waitlistCapacity !== undefined)
      updateData.waitlistCapacity = data.waitlistCapacity;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;

    // 날짜 필드들 처리
    let recruitStartAt: Date | undefined;
    let recruitEndAt: Date | undefined;
    let startAt: Date | undefined;
    let endAt: Date | undefined;

    if (data.recruitStartAt !== undefined) {
      recruitStartAt = this.validateDate(data.recruitStartAt, '모집 시작일');
      updateData.recruitStartAt = recruitStartAt;
    }
    if (data.recruitEndAt !== undefined) {
      recruitEndAt = this.validateDate(data.recruitEndAt, '모집 종료일');
      updateData.recruitEndAt = recruitEndAt;
    }
    if (data.startAt !== undefined) {
      startAt = this.validateDate(data.startAt, '행사 시작일');
      updateData.startAt = startAt;
    }
    if (data.endAt !== undefined) {
      endAt = this.validateDate(data.endAt, '행사 종료일');
      updateData.endAt = endAt;
    }

    // 기존 데이터 조회하여 날짜 범위 검증
    if (recruitStartAt || recruitEndAt || startAt || endAt) {
      const existingMClass = await this.findById(id);
      if (!existingMClass) {
        throw new Error('수정할 MClass를 찾을 수 없습니다.');
      }

      const finalRecruitStartAt =
        recruitStartAt || existingMClass.recruitStartAt;
      const finalRecruitEndAt = recruitEndAt || existingMClass.recruitEndAt;
      const finalStartAt = startAt || existingMClass.startAt;
      const finalEndAt = endAt || existingMClass.endAt;

      // 날짜 범위 유효성 검증
      this.validateDateRange(
        finalRecruitStartAt,
        finalRecruitEndAt,
        '모집 시작일',
        '모집 종료일'
      );
      this.validateDateRange(
        finalStartAt,
        finalEndAt,
        '행사 시작일',
        '행사 종료일'
      );
      this.validateDateRange(
        finalRecruitEndAt,
        finalStartAt,
        '모집 종료일',
        '행사 시작일'
      );
    }

    if (data.isOnline !== undefined) updateData.isOnline = data.isOnline;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.fee !== undefined) updateData.fee = data.fee;

    return this.prisma.mClass.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * MClass 삭제 (소프트 삭제 또는 하드 삭제)
   */
  async delete(id: string): Promise<MClass> {
    // 현재는 하드 삭제로 구현
    // 필요시 소프트 삭제로 변경 가능
    return this.prisma.mClass.delete({
      where: { id },
    });
  }

  /**
   * 승인된 인원 수 조회 (실시간 계산)
   */
  async getApprovedCount(mclassId: string): Promise<number> {
    return this.prisma.enrollment.count({
      where: {
        mclassId,
        status: 'APPROVED',
      },
    });
  }

  /**
   * 대기열 인원 수 조회
   */
  async getWaitlistedCount(mclassId: string): Promise<number> {
    return this.prisma.enrollment.count({
      where: {
        mclassId,
        status: 'WAITLISTED',
      },
    });
  }
}
