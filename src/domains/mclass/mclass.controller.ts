import { Request, Response, NextFunction } from 'express';
import { MClassService } from './mclass.service.js';
import { MClassSuccess } from '../../common/exception/mclass/MClassSuccess.js';
import { MClassError } from '../../common/exception/mclass/MClassError.js';
import { CreateMClassDtoSchema } from './dto/CreateMClassDto.js';
import { UpdateMClassDtoSchema } from './dto/UpdateMClassDto.js';
import { ListQueryDtoSchema } from './dto/ListQueryDto.js';
import { ZodError } from 'zod';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class MClassController {
  constructor(private service: MClassService) {}

  /**
   * MClass 목록 조회
   * GET /api/mclasses
   */
  async getMClasses(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      // 쿼리 파라미터 파싱 및 검증
      const query = ListQueryDtoSchema.parse(req.query);

      // 사용자 권한 확인 (UNLISTED 조회 권한)
      const isAdmin = req.user?.role === 'ADMIN' || false;

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
   */
  async createMClass(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      // RBAC 확인: ADMIN 권한 필요
      if (!req.user?.role || req.user.role !== 'ADMIN') {
        throw MClassError.forbidden();
      }

      // 요청 데이터 파싱 및 검증
      const data = CreateMClassDtoSchema.parse(req.body);

      // 서비스 호출
      const mclass = await this.service.create(req.user.userId, data);

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
   */
  async updateMClass(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      // RBAC 확인: ADMIN 권한 필요
      if (!req.user?.role || req.user.role !== 'ADMIN') {
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
   */
  async deleteMClass(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      // RBAC 확인: ADMIN 권한 필요
      if (!req.user?.role || req.user.role !== 'ADMIN') {
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
