import { Router } from 'express';
import { TermController } from '../domains/term/term.controller';
import { TermService } from '../domains/term/term.service';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { validateId } from '../middleware/validation.middleware';

/**
 * @swagger
 * tags:
 *   name: Terms
 *   description: 약관 관리 API
 */

const router = Router();
const prisma = new PrismaClient();
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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Term'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/terms', (req, res) => termController.getAllTerms(req, res));

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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Term'
 *       400:
 *         description: 잘못된 ID 형식
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 약관을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/terms/:id', validateId, (req, res) =>
  termController.getTermById(req, res)
);

/**
 * @swagger
 * /api/terms/type/{type}:
 *   get:
 *     summary: 약관 유형별 조회
 *     description: 특정 유형의 모든 약관을 조회합니다.
 *     tags: [Terms]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [SERVICE, PRIVACY, ENROLLMENT]
 *         description: 약관 유형
 *     responses:
 *       200:
 *         description: 약관 유형별 조회 성공
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
 *                     $ref: '#/components/schemas/Term'
 *       404:
 *         description: 해당 유형의 약관을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/terms/type/:type', (req, res) =>
  termController.getTermsByType(req, res)
);

/**
 * @swagger
 * /api/terms/required:
 *   get:
 *     summary: 필수 약관 조회
 *     description: 필수 동의가 필요한 모든 약관을 조회합니다.
 *     tags: [Terms]
 *     responses:
 *       200:
 *         description: 필수 약관 조회 성공
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
 *                     $ref: '#/components/schemas/Term'
 *       404:
 *         description: 필수 약관을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/terms/required', (req, res) =>
  termController.getRequiredTerms(req, res)
);

/**
 * @swagger
 * /api/terms/latest/{type}:
 *   get:
 *     summary: 최신 버전 약관 조회
 *     description: 특정 유형의 최신 버전 약관을 조회합니다.
 *     tags: [Terms]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [SERVICE, PRIVACY, ENROLLMENT]
 *         description: 약관 유형
 *     responses:
 *       200:
 *         description: 최신 버전 약관 조회 성공
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
 *       404:
 *         description: 최신 버전 약관을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/terms/latest/:type', (req, res) =>
  termController.getLatestTermsByType(req, res)
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
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: 권한 부족
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/terms', authenticateToken, requireAdmin, (req, res) =>
  termController.createTerm(req, res)
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
 *               is_required:
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
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: 권한 부족
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 약관을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/terms/:id', authenticateToken, requireAdmin, (req, res) =>
  termController.updateTerm(req, res)
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
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: 권한 부족
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 약관을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/terms/:id', authenticateToken, requireAdmin, (req, res) =>
  termController.deleteTerm(req, res)
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
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 약관을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: 이미 동의한 약관
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/users/agreements', authenticateToken, (req, res) =>
  termController.agreeToTerm(req, res)
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
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/users/agreements', authenticateToken, (req, res) =>
  termController.getUserAgreements(req, res)
);

export default router;
