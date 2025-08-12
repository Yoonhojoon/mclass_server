import { Router, Request, Response } from 'express';
import { TermController } from '../domains/term/term.controller.js';
import { TermService } from '../domains/term/term.service.js';
import { PrismaClient } from '@prisma/client';
import {
  authenticateToken,
  requireAdmin,
} from '../middleware/auth.middleware.js';
import {
  validateBody,
  validateParams,
} from '../middleware/validate.middleware.js';
import {
  createTermSchema,
  updateTermSchema,
  agreeToTermSchema,
  termIdParamSchema,
} from '../schemas/term/index.js';

/**
 * @swagger
 * tags:
 *   name: Terms
 *   description: 약관 관리 API
 */

/**
 * 약관 라우트 팩토리 함수
 * 의존성 주입을 통해 테스트 가능하고 유연한 구조 제공
 */
export const createTermRoutes = (prisma: PrismaClient): Router => {
  const router = Router();
  const termService = new TermService(prisma);
  const termController = new TermController(termService);

  /**
   * @swagger
   * /api/terms:
   *   get:
   *     summary: 모든 약관 목록 조회
   *     description: 시스템에 등록된 모든 약관 목록을 조회합니다.
   *     tags: [Terms]
   *     responses:
   *       200:
   *         description: 약관 목록 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TermListResponse'
   *       500:
   *         description: 서버 오류
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get('/terms', (req: Request, res: Response): void => {
    termController.getAllTerms(req, res);
  });

  /**
   * @swagger
   * /api/terms/{id}:
   *   get:
   *     summary: 특정 약관 조회
   *     description: ID로 특정 약관을 조회합니다.
   *     tags: [Terms]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 약관 ID
   *     responses:
   *       200:
   *         description: 약관 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TermResponse'
   *       400:
   *         description: 잘못된 ID 형식
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               error:
   *                 code: 'VALIDATION_ERROR'
   *                 message: '잘못된 ID 형식입니다.'
   *       404:
   *         description: 약관을 찾을 수 없음 (TERM_NOT_FOUND)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TermError'
   *             example:
   *               success: false
   *               error:
   *                 code: 'TERM_NOT_FOUND'
   *                 message: '약관을 찾을 수 없습니다.'
   *       500:
   *         description: 서버 오류
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               error:
   *                 code: 'INTERNAL_SERVER_ERROR'
   *                 message: '서버 내부 오류가 발생했습니다.'
   */
  router.get('/terms/:id', validateParams(termIdParamSchema), (req, res) =>
    termController.getTermById(req, res)
  );

  /**
   * @swagger
   * /api/terms:
   *   post:
   *     summary: 약관 생성 (관리자 전용)
   *     description: 새로운 약관을 생성합니다. 관리자 권한이 필요합니다.
   *     tags: [Terms]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - type
   *               - title
   *               - content
   *               - version
   *             properties:
   *               type:
   *                 type: string
   *                 enum: [SERVICE, PRIVACY, ENROLLMENT]
   *                 description: 약관 유형
   *               title:
   *                 type: string
   *                 description: 약관 제목
   *               content:
   *                 type: string
   *                 description: 약관 내용
   *               is_required:
   *                 type: boolean
   *                 default: false
   *                 description: 필수 동의 여부
   *               version:
   *                 type: string
   *                 description: 약관 버전
   *     responses:
   *       201:
   *         description: 약관 생성 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Term'
   *       400:
   *         description: 잘못된 요청 데이터
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               success: false
   *               error:
   *                 code: 'VALIDATION_ERROR'
   *                 message: '필수 필드가 누락되었습니다.'
   *       401:
   *         description: 인증 실패
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               success: false
   *               error:
   *                 code: 'UNAUTHORIZED'
   *                 message: '인증이 필요합니다.'
   *       403:
   *         description: 권한 부족
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               success: false
   *               error:
   *                 code: 'FORBIDDEN'
   *                 message: '관리자 권한이 필요합니다.'
   *       500:
   *         description: 서버 오류
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               success: false
   *               error:
   *                 code: 'INTERNAL_SERVER_ERROR'
   *                 message: '서버 내부 오류가 발생했습니다.'
   */
  router.post(
    '/terms',
    authenticateToken,
    requireAdmin,
    validateBody(createTermSchema),
    (req: Request, res: Response) =>
      termController.createTerm(
        req as unknown as Request & {
          user?: { id: string; email: string; role: string; isAdmin?: boolean };
        },
        res
      )
  );

  /**
   * @swagger
   * /api/terms/{id}:
   *   put:
   *     summary: 약관 수정 (관리자 전용)
   *     description: 기존 약관을 수정합니다. 관리자 권한이 필요합니다.
   *     tags: [Terms]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 약관 ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *                 description: 약관 제목
   *               content:
   *                 type: string
   *                 description: 약관 내용
   *               isRequired:
   *                 type: boolean
   *                 description: 필수 동의 여부
   *               version:
   *                 type: string
   *                 description: 약관 버전
   *     responses:
   *       200:
   *         description: 약관 수정 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Term'
   *       400:
   *         description: 잘못된 요청 데이터
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               success: false
   *               error:
   *                 code: 'VALIDATION_ERROR'
   *                 message: '수정할 데이터가 올바르지 않습니다.'
   *       401:
   *         description: 인증 실패
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               success: false
   *               error:
   *                 code: 'UNAUTHORIZED'
   *                 message: '인증이 필요합니다.'
   *       403:
   *         description: 권한 부족
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               success: false
   *               error:
   *                 code: 'FORBIDDEN'
   *                 message: '관리자 권한이 필요합니다.'
   *       404:
   *         description: 약관을 찾을 수 없음
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               success: false
   *               error:
   *                 code: 'TERM_NOT_FOUND'
   *                 message: '수정할 약관을 찾을 수 없습니다.'
   *       500:
   *         description: 서버 오류
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               success: false
   *               error:
   *                 code: 'INTERNAL_SERVER_ERROR'
   *                 message: '서버 내부 오류가 발생했습니다.'
   */
  router.put(
    '/terms/:id',
    authenticateToken,
    requireAdmin,
    validateParams(termIdParamSchema),
    validateBody(updateTermSchema),
    (req: Request, res: Response) =>
      termController.updateTerm(
        req as unknown as Request & {
          user?: { id: string; email: string; role: string; isAdmin?: boolean };
        },
        res
      )
  );

  /**
   * @swagger
   * /api/terms/{id}:
   *   delete:
   *     summary: 약관 삭제 (관리자 전용)
   *     description: 약관을 삭제합니다. 관리자 권한이 필요합니다.
   *     tags: [Terms]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 약관 ID
   *     responses:
   *       200:
   *         description: 약관 삭제 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: 약관이 성공적으로 삭제되었습니다.
   *       400:
   *         description: 잘못된 ID 형식
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               success: false
   *               error:
   *                 code: 'VALIDATION_ERROR'
   *                 message: '잘못된 약관 ID 형식입니다.'
   *       401:
   *         description: 인증 실패
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               success: false
   *               error:
   *                 code: 'UNAUTHORIZED'
   *                 message: '인증이 필요합니다.'
   *       403:
   *         description: 권한 부족
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               success: false
   *               error:
   *                 code: 'FORBIDDEN'
   *                 message: '관리자 권한이 필요합니다.'
   *       404:
   *         description: 약관을 찾을 수 없음
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               success: false
   *               error:
   *                 code: 'TERM_NOT_FOUND'
   *                 message: '삭제할 약관을 찾을 수 없습니다.'
   *       500:
   *         description: 서버 오류
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               success: false
   *               error:
   *                 code: 'INTERNAL_SERVER_ERROR'
   *                 message: '서버 내부 오류가 발생했습니다.'
   */
  router.delete(
    '/terms/:id',
    authenticateToken,
    requireAdmin,
    validateParams(termIdParamSchema),
    (req: Request, res: Response) =>
      termController.deleteTerm(
        req as unknown as Request & {
          user?: { id: string; email: string; role: string; isAdmin?: boolean };
        },
        res
      )
  );

  /**
   * @swagger
   * /api/users/agreements:
   *   post:
   *     summary: 약관 동의
   *     description: 사용자가 특정 약관에 동의합니다. 인증이 필요합니다.
   *     tags: [Terms]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - termId
   *             properties:
   *               termId:
   *                 type: string
   *                 format: uuid
   *                 description: 동의할 약관 ID
   *     responses:
   *       201:
   *         description: 약관 동의 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/UserTermAgreement'
   *       400:
   *         description: 잘못된 요청 데이터
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               success: false
   *               error:
   *                 code: 'VALIDATION_ERROR'
   *                 message: '약관 ID가 올바르지 않습니다.'
   *       401:
   *         description: 인증 실패
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               success: false
   *               error:
   *                 code: 'UNAUTHORIZED'
   *                 message: '인증이 필요합니다.'
   *       404:
   *         description: 약관을 찾을 수 없음
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               success: false
   *               error:
   *                 code: 'TERM_NOT_FOUND'
   *                 message: '동의할 약관을 찾을 수 없습니다.'
   *       409:
   *         description: 이미 동의한 약관
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               success: false
   *               error:
   *                 code: 'ALREADY_AGREED'
   *                 message: '이미 동의한 약관입니다.'
   *       500:
   *         description: 서버 오류
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               success: false
   *               error:
   *                 code: 'INTERNAL_SERVER_ERROR'
   *                 message: '서버 내부 오류가 발생했습니다.'
   */
  router.post(
    '/users/agreements',
    authenticateToken,
    validateBody(agreeToTermSchema),
    (req: Request, res: Response) =>
      termController.agreeToTerm(
        req as unknown as Request & {
          user?: { id: string; email: string; role: string; isAdmin?: boolean };
        },
        res
      )
  );

  /**
   * @swagger
   * /api/users/agreements:
   *   get:
   *     summary: 사용자 약관 동의 목록 조회
   *     description: 현재 사용자가 동의한 모든 약관 목록을 조회합니다. 인증이 필요합니다.
   *     tags: [Terms]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 약관 동의 목록 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/UserTermAgreement'
   *       401:
   *         description: 인증 실패
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               success: false
   *               error:
   *                 code: 'UNAUTHORIZED'
   *                 message: '인증이 필요합니다.'
   *       500:
   *         description: 서버 오류
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               success: false
   *               error:
   *                 code: 'INTERNAL_SERVER_ERROR'
   *                 message: '서버 내부 오류가 발생했습니다.'
   */
  router.get(
    '/users/agreements',
    authenticateToken,
    (req: Request, res: Response) =>
      termController.getUserAgreements(
        req as unknown as Request & {
          user?: { id: string; email: string; role: string; isAdmin?: boolean };
        },
        res
      )
  );

  return router;
};

// 기본 export는 기존 호환성을 위해 유지
export default createTermRoutes;
