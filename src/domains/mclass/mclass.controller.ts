import { Request, Response, NextFunction } from 'express';
import { MClassService } from './mclass.service.js';
import { MClassSuccess } from '../../common/exception/mclass/MClassSuccess.js';
import { MClassError } from '../../common/exception/mclass/MClassError.js';
import { CreateMClassDtoSchema } from './dto/CreateMClassDto.js';
import { UpdateMClassDtoSchema } from './dto/UpdateMClassDto.js';
import { ListQueryDtoSchema } from './dto/ListQueryDto.js';
import { ZodError } from 'zod';

export class MClassController {
  constructor(private service: MClassService) {}

  /**
   * MClass 목록 조회
   * GET /api/mclasses
   * @swagger
   * /api/mclasses:
   *   get:
   *     summary: MClass 목록 조회
   *     description: 필터링, 정렬, 페이지네이션을 지원하는 MClass 목록을 조회합니다.
   *     tags: [MClass]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: phase
   *         schema:
   *           type: string
   *           enum: [UPCOMING, RECRUITING, IN_PROGRESS, ENDED]
   *         description: 클래스 단계 필터
   *       - in: query
   *         name: selectionType
   *         schema:
   *           type: string
   *           enum: [FIRST_COME, REVIEW]
   *         description: 선발 방식 필터
   *       - in: query
   *         name: visibility
   *         schema:
   *           type: string
   *           enum: [PUBLIC, UNLISTED]
   *           default: PUBLIC
   *         description: 공개 여부 필터 (관리자만 UNLISTED 조회 가능)
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: 페이지 번호
   *       - in: query
   *         name: size
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: 페이지 크기 (최대 100)
   *       - in: query
   *         name: sort
   *         schema:
   *           type: string
   *           enum: [startAt, recruitStartAt, createdAt]
   *           default: startAt
   *         description: 정렬 기준
   *       - in: query
   *         name: order
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: asc
   *         description: 정렬 순서
   *     responses:
   *       200:
   *         description: MClass 목록 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MClassListResponse'
   *       400:
   *         description: 잘못된 요청
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: 인증 실패
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getMClasses(req: Request, res: Response, next: NextFunction) {
    try {
      // 쿼리 파라미터 파싱 및 검증
      const query = ListQueryDtoSchema.parse(req.query);

      // 사용자 권한 확인 (UNLISTED 조회 권한)
      const isAdmin = req.user?.isAdmin || false;

      // 서비스 호출
      const result = await this.service.list(query, isAdmin);

      // 응답 전송
      const response = MClassSuccess.list(result.items, {
        page: result.page,
        size: result.size,
        total: result.total,
        totalPages: result.totalPages,
      });

      response.send(res);
    } catch (error) {
      if (error instanceof ZodError) {
        next(MClassError.validation((error as ZodError).issues));
      } else {
        next(error);
      }
    }
  }

  /**
   * MClass 단일 조회
   * GET /api/mclasses/:id
   * @swagger
   * /api/mclasses/{id}:
   *   get:
   *     summary: MClass 단일 조회
   *     description: 특정 MClass의 상세 정보를 조회합니다.
   *     tags: [MClass]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: MClass ID
   *     responses:
   *       200:
   *         description: MClass 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/MClass'
   *       404:
   *         description: MClass를 찾을 수 없음
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getMClass(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // 서비스 호출
      const mclass = await this.service.getById(id);

      // 응답 전송
      const response = MClassSuccess.retrieved(mclass);
      response.send(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * MClass 생성
   * POST /api/mclasses
   * @swagger
   * /api/mclasses:
   *   post:
   *     summary: MClass 생성
   *     description: 새로운 MClass를 생성합니다. (관리자만 가능)
   *     tags: [MClass]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateMClassRequest'
   *           examples:
   *             기본_클래스:
   *               summary: 기본 클래스 생성
   *               value:
   *                 title: "JavaScript 기초 강의"
   *                 description: "JavaScript의 기본 문법을 배우는 클래스입니다."
   *                 startAt: "2025-01-15T10:00:00.000Z"
   *                 endAt: "2025-01-15T12:00:00.000Z"
   *                 selectionType: "FIRST_COME"
   *                 capacity: 20
   *                 isOnline: true
   *             모집_기간_있는_클래스:
   *               summary: 모집 기간이 있는 클래스
   *               value:
   *                 title: "React 심화 과정"
   *                 description: "React의 고급 기능을 다루는 클래스입니다."
   *                 recruitStartAt: "2024-12-01T00:00:00.000Z"
   *                 recruitEndAt: "2024-12-31T23:59:59.000Z"
   *                 startAt: "2025-02-01T14:00:00.000Z"
   *                 endAt: "2025-02-01T16:00:00.000Z"
   *                 selectionType: "REVIEW"
   *                 capacity: 15
   *                 allowWaitlist: true
   *                 waitlistCapacity: 5
   *                 isOnline: false
   *                 location: "서울시 강남구 테헤란로 123"
   *                 fee: 50000
   *     responses:
   *       201:
   *         description: MClass 생성 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/MClass'
   *                 meta:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       format: uuid
   *       400:
   *         description: 잘못된 요청
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: 인증 실패
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: 권한 없음 (관리자만 가능)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: 제목 중복
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async createMClass(req: Request, res: Response, next: NextFunction) {
    try {
      // RBAC 확인: ADMIN 권한 필요
      if (!req.user?.isAdmin) {
        throw MClassError.forbidden();
      }

      // 요청 데이터 파싱 및 검증
      const data = CreateMClassDtoSchema.parse(req.body);

      // 서비스 호출
      const mclass = await this.service.create(req.user.id, data);

      // 응답 전송
      const response = MClassSuccess.created(mclass.id, mclass);
      response.send(res);
    } catch (error) {
      if (error instanceof ZodError) {
        next(MClassError.validation((error as ZodError).issues));
      } else {
        next(error);
      }
    }
  }

  /**
   * MClass 수정
   * PATCH /api/mclasses/:id
   * @swagger
   * /api/mclasses/{id}:
   *   patch:
   *     summary: MClass 수정
   *     description: 기존 MClass를 수정합니다. (관리자만 가능)
   *     tags: [MClass]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: MClass ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateMClassRequest'
   *     responses:
   *       200:
   *         description: MClass 수정 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/MClass'
   *                 meta:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       format: uuid
   *       400:
   *         description: 잘못된 요청
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: 인증 실패
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: 권한 없음 (관리자만 가능)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: MClass를 찾을 수 없음
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: 제목 중복
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async updateMClass(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // RBAC 확인: ADMIN 권한 필요
      if (!req.user?.isAdmin) {
        throw MClassError.forbidden();
      }

      // 요청 데이터 파싱 및 검증
      const data = UpdateMClassDtoSchema.parse(req.body);

      // 서비스 호출
      const mclass = await this.service.update(id, data);

      // 응답 전송
      const response = MClassSuccess.updated(id, mclass);
      response.send(res);
    } catch (error) {
      if (error instanceof ZodError) {
        next(MClassError.validation((error as ZodError).issues));
      } else {
        next(error);
      }
    }
  }

  /**
   * MClass 삭제
   * DELETE /api/mclasses/:id
   * @swagger
   * /api/mclasses/{id}:
   *   delete:
   *     summary: MClass 삭제
   *     description: MClass를 삭제합니다. (관리자만 가능)
   *     tags: [MClass]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: MClass ID
   *     responses:
   *       200:
   *         description: MClass 삭제 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 meta:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       format: uuid
   *       401:
   *         description: 인증 실패
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: 권한 없음 (관리자만 가능)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: MClass를 찾을 수 없음
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async deleteMClass(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // RBAC 확인: ADMIN 권한 필요
      if (!req.user?.isAdmin) {
        throw MClassError.forbidden();
      }

      // 서비스 호출
      await this.service.delete(id);

      // 응답 전송
      const response = MClassSuccess.deleted(id);
      response.send(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * MClass 통계 조회
   * GET /api/mclasses/:id/statistics
   * @swagger
   * /api/mclasses/{id}/statistics:
   *   get:
   *     summary: MClass 통계 조회
   *     description: MClass의 승인된 인원 수와 대기열 인원 수를 조회합니다.
   *     tags: [MClass]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: MClass ID
   *     responses:
   *       200:
   *         description: 통계 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/MClassStatistics'
   *       404:
   *         description: MClass를 찾을 수 없음
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getMClassStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // 서비스 호출
      const statistics = await this.service.getStatistics(id);

      // 응답 전송
      const response = MClassSuccess.retrieved(statistics);
      response.send(res);
    } catch (error) {
      next(error);
    }
  }
}
