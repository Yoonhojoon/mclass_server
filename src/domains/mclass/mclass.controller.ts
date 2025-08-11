import { Request, Response, NextFunction } from 'express';
import { MClassService } from './mclass.service.js';
import { MClassSuccess } from '../../common/exception/mclass/MClassSuccess.js';
import { MClassError } from '../../common/exception/mclass/MClassError.js';
import { CreateMClassDtoSchema } from './dto/CreateMClassDto.js';
import { UpdateMClassDtoSchema } from './dto/UpdateMClassDto.js';
import { ListQueryDtoSchema } from './dto/ListQueryDto.js';
import { ZodError } from 'zod';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import logger from '../../config/logger.config.js';

export class MClassController {
  constructor(private service: MClassService) {}

  /**
   * MClass 목록 조회
   * GET /api/mclass
   */
  async getMClasses(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    const userId = req.user?.userId;
    const isAdmin = req.user?.isAdmin || false;
    logger.info(
      `[MClassController] MClass 목록 조회 요청: 사용자 ID ${userId}, 관리자: ${isAdmin}`
    );

    try {
      // 쿼리 파라미터 파싱 및 검증
      const query = ListQueryDtoSchema.parse(req.query);

      // 서비스 호출 (인증된 사용자의 관리자 권한 확인)
      const result = await this.service.list(query, isAdmin);

      // 응답 전송
      const response = MClassSuccess.list(result.items, {
        page: result.page,
        size: result.size,
        total: result.total,
        totalPages: result.totalPages,
      });

      logger.info(
        `[MClassController] MClass 목록 조회 성공: 사용자 ID ${userId}, 총 ${result.total}개, 페이지 ${result.page}/${result.totalPages}`
      );
      response.send(res);
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn(
          `[MClassController] MClass 목록 조회 검증 실패: 사용자 ID ${userId}`,
          { error: error.issues }
        );
        next(MClassError.validation((error as ZodError).issues));
      } else {
        logger.error(
          `[MClassController] MClass 목록 조회 실패: 사용자 ID ${userId}`,
          { error: error instanceof Error ? error.message : error }
        );
        next(error);
      }
    }
  }

  /**
   * MClass 단일 조회
   * GET /api/mclass/:id
   * @swagger
   * /api/mclass/{id}:
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
    const { id } = req.params;
    logger.info(`[MClassController] MClass 단일 조회 요청: ${id}`);

    try {
      // 서비스 호출
      const mclass = await this.service.getById(id);

      // 응답 전송
      const response = MClassSuccess.retrieved(mclass);
      logger.info(
        `[MClassController] MClass 단일 조회 성공: ${id}, Phase: ${mclass.phase}`
      );
      response.send(res);
    } catch (error) {
      logger.error(`[MClassController] MClass 단일 조회 실패: ${id}`, {
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * MClass 생성
   * POST /api/mclass
   */
  async createMClass(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    const userId = req.user?.userId;
    logger.info(`[MClassController] MClass 생성 요청: 사용자 ID ${userId}`);

    try {
      // 요청 데이터 파싱 및 검증
      const data = CreateMClassDtoSchema.parse(req.body);

      // 서비스 호출 (미들웨어에서 권한 확인됨)
      const mclass = await this.service.create(req.user!.userId, data);

      // 응답 전송
      const response = MClassSuccess.created(mclass.id, mclass);
      logger.info(
        `[MClassController] MClass 생성 성공: ID ${mclass.id}, 제목 "${data.title}", 사용자 ID ${userId}`
      );
      response.send(res);
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn(
          `[MClassController] MClass 생성 검증 실패: 사용자 ID ${userId}`,
          { error: error.issues }
        );
        next(MClassError.validation((error as ZodError).issues));
      } else {
        logger.error(
          `[MClassController] MClass 생성 실패: 사용자 ID ${userId}`,
          { error: error instanceof Error ? error.message : error }
        );
        next(error);
      }
    }
  }

  /**
   * MClass 수정
   * PATCH /api/mclass/:id
   */
  async updateMClass(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    const { id } = req.params;
    const userId = req.user?.userId;
    logger.info(
      `[MClassController] MClass 수정 요청: ${id}, 사용자 ID ${userId}`
    );

    try {
      // 요청 데이터 파싱 및 검증
      const data = UpdateMClassDtoSchema.parse(req.body);

      // 서비스 호출
      const mclass = await this.service.update(id, data);

      // 응답 전송
      const response = MClassSuccess.updated(id, mclass);
      logger.info(
        `[MClassController] MClass 수정 성공: ${id}, Phase: ${mclass.phase}, 사용자 ID ${userId}`
      );
      response.send(res);
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn(
          `[MClassController] MClass 수정 검증 실패: ${id}, 사용자 ID ${userId}`,
          { error: error.issues }
        );
        next(MClassError.validation((error as ZodError).issues));
      } else {
        logger.error(
          `[MClassController] MClass 수정 실패: ${id}, 사용자 ID ${userId}`,
          { error: error instanceof Error ? error.message : error }
        );
        next(error);
      }
    }
  }

  /**
   * MClass 삭제
   * DELETE /api/mclass/:id
   */
  async deleteMClass(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    const { id } = req.params;
    const userId = req.user?.userId;
    logger.info(
      `[MClassController] MClass 삭제 요청: ${id}, 사용자 ID ${userId}`
    );

    try {
      // 서비스 호출
      await this.service.delete(id);

      // 응답 전송
      const response = MClassSuccess.deleted(id);
      logger.info(
        `[MClassController] MClass 삭제 성공: ${id}, 사용자 ID ${userId}`
      );
      response.send(res);
    } catch (error) {
      logger.error(
        `[MClassController] MClass 삭제 실패: ${id}, 사용자 ID ${userId}`,
        { error: error instanceof Error ? error.message : error }
      );
      next(error);
    }
  }

  /**
   * MClass 통계 조회
   * GET /api/mclass/:id/statistics
   */
  async getMClassStatistics(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    logger.info(`[MClassController] MClass 통계 조회 요청: ${id}`);

    try {
      // 서비스 호출
      const statistics = await this.service.getStatistics(id);

      // 응답 전송
      const response = MClassSuccess.retrieved(statistics);
      logger.info(
        `[MClassController] MClass 통계 조회 성공: ${id}, 승인: ${statistics.approvedCount}, 대기: ${statistics.waitlistedCount}`
      );
      response.send(res);
    } catch (error) {
      logger.error(`[MClassController] MClass 통계 조회 실패: ${id}`, {
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }
}
