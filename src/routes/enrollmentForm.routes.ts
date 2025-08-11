import { Router } from 'express';
import { EnrollmentFormController } from '../domains/enrollmentForm/enrollmentForm.controller.js';
import { EnrollmentFormService } from '../domains/enrollmentForm/enrollmentForm.service.js';
import { EnrollmentFormRepository } from '../domains/enrollmentForm/enrollmentForm.repository.js';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();
const prisma = new PrismaClient();
const repository = new EnrollmentFormRepository(prisma);
const service = new EnrollmentFormService(repository);
const controller = new EnrollmentFormController(service);

// 공개 라우트 (인증 불필요)

/**
 * @swagger
 * /api/mclasses/{id}/enrollment-form:
 *   get:
 *     summary: MClass 지원서 양식 조회
 *     description: 특정 MClass의 지원서 양식을 조회합니다.
 *     tags: [EnrollmentForm]
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
 *         description: 지원서 양식 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/EnrollmentForm'
 *       404:
 *         description: 지원서 양식을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/mclasses/:id/enrollment-form',
  controller.getEnrollmentForm.bind(controller)
);

// 관리자 전용 라우트 (인증 필요)

/**
 * @swagger
 * /api/mclasses/{id}/enrollment-form:
 *   post:
 *     summary: MClass 지원서 양식 생성
 *     description: 특정 MClass의 지원서 양식을 생성합니다. (관리자만 가능)
 *     tags: [EnrollmentForm]
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
 *             $ref: '#/components/schemas/CreateEnrollmentFormRequest'
 *           examples:
 *             기본_지원서:
 *               summary: 기본 지원서 양식
 *               value:
 *                 title: "M클래스 참가신청"
 *                 description: "M클래스 참가를 위한 지원서입니다."
 *                 questions:
 *                   - id: "name"
 *                     type: "text"
 *                     label: "이름"
 *                     required: true
 *                     placeholder: "이름을 입력해주세요"
 *                   - id: "email"
 *                     type: "email"
 *                     label: "이메일"
 *                     required: true
 *                     placeholder: "이메일을 입력해주세요"
 *                   - id: "phone"
 *                     type: "phone"
 *                     label: "휴대폰"
 *                     required: true
 *                     placeholder: "010-0000-0000"
 *                   - id: "gender"
 *                     type: "radio"
 *                     label: "성별"
 *                     required: true
 *                     options: ["남", "여"]
 *                   - id: "motivation"
 *                     type: "textarea"
 *                     label: "신청 동기"
 *                     required: true
 *                     placeholder: "신청 동기를 자유롭게 작성해주세요"
 *                   - id: "agreeTerms"
 *                     type: "checkbox"
 *                     label: "개인정보 제공 및 활용 동의"
 *                     required: true
 *     responses:
 *       201:
 *         description: 지원서 양식 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/EnrollmentForm'
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
 *         description: 이미 존재하는 지원서 양식
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/mclasses/:id/enrollment-form',
  authenticateToken,
  controller.createEnrollmentForm.bind(controller)
);

/**
 * @swagger
 * /api/mclasses/{id}/enrollment-form:
 *   patch:
 *     summary: MClass 지원서 양식 수정
 *     description: 특정 MClass의 지원서 양식을 수정합니다. (관리자만 가능)
 *     tags: [EnrollmentForm]
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
 *             $ref: '#/components/schemas/UpdateEnrollmentFormRequest'
 *     responses:
 *       200:
 *         description: 지원서 양식 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/EnrollmentForm'
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
 *         description: 지원서 양식을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  '/mclasses/:id/enrollment-form',
  authenticateToken,
  controller.updateEnrollmentForm.bind(controller)
);

/**
 * @swagger
 * /api/mclasses/{id}/enrollment-form:
 *   delete:
 *     summary: MClass 지원서 양식 삭제
 *     description: 특정 MClass의 지원서 양식을 삭제합니다. (관리자만 가능)
 *     tags: [EnrollmentForm]
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
 *         description: 지원서 양식 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: 'null'
 *                   nullable: true
 *                   example: null
 *                 message:
 *                   type: string
 *                   example: '지원서 양식이 성공적으로 삭제되었습니다'
 *                 code:
 *                   type: string
 *                   example: 'SUCCESS'
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
 *         description: 지원서 양식을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  '/mclasses/:id/enrollment-form',
  authenticateToken,
  controller.deleteEnrollmentForm.bind(controller)
);

export default router;
