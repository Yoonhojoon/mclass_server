import { PrismaClient, MClass, Prisma } from '@prisma/client';
import { CreateMClassDto } from './dto/CreateMClassDto.js';
import { UpdateMClassDto } from './dto/UpdateMClassDto.js';
import { ListQueryDto } from './dto/ListQueryDto.js';

export class MClassRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 필터링된 MClass 목록 조회
   */
  async findWithFilters(query: ListQueryDto, isAdmin: boolean = false) {
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
  async create(data: CreateMClassDto, adminId: string): Promise<MClass> {
    const mclassData: Prisma.MClassCreateInput = {
      title: data.title,
      description: data.description,
      selectionType: data.selectionType,
      capacity: data.capacity,
      allowWaitlist: data.allowWaitlist,
      waitlistCapacity: data.waitlistCapacity,
      visibility: data.visibility,
      recruitStartAt: new Date(data.recruitStartAt),
      recruitEndAt: new Date(data.recruitEndAt),
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt),
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
  async update(id: string, data: UpdateMClassDto): Promise<MClass> {
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
    if (data.recruitStartAt !== undefined)
      updateData.recruitStartAt = new Date(data.recruitStartAt);
    if (data.recruitEndAt !== undefined)
      updateData.recruitEndAt = new Date(data.recruitEndAt);
    if (data.startAt !== undefined) updateData.startAt = new Date(data.startAt);
    if (data.endAt !== undefined) updateData.endAt = new Date(data.endAt);
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
