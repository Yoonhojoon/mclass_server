import express from 'express';
import { UserController } from '../domains/user/user.controller.js';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware.js';

/**
 * 사용자 라우트 팩토리 함수
 * 의존성 주입을 통해 테스트 가능하고 유연한 구조 제공
 */
export const createUserRoutes = (prisma: PrismaClient): express.Router => {
  const router = express.Router();
  const userController = new UserController(prisma);

  /**
   * @swagger
   * /api/users/profile:
   *   get:
   *     summary: 내 프로필 조회
   *     description: 현재 로그인한 사용자의 프로필 정보를 조회합니다.
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 성공적으로 프로필 정보를 반환
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       401:
   *         description: 인증되지 않은 요청
   *       404:
   *         description: 사용자를 찾을 수 없음
   */
  router.get(
    '/profile',
    authenticateToken,
    userController.getUserProfile.bind(userController)
  );

  /**
   * @swagger
   * /api/users/{id}:
   *   get:
   *     summary: 특정 사용자 조회
   *     description: ID로 특정 사용자 정보를 조회합니다.
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: 사용자 ID
   *     responses:
   *       200:
   *         description: 성공적으로 사용자 정보를 반환
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       404:
   *         description: 사용자를 찾을 수 없음
   */
  router.get('/:id', userController.getUserById.bind(userController));

  /**
   * @swagger
   * /api/users/search:
   *   get:
   *     summary: 이메일로 사용자 조회
   *     description: 이메일로 사용자 정보를 조회합니다.
   *     tags: [Users]
   *     parameters:
   *       - in: query
   *         name: email
   *         required: true
   *         schema:
   *           type: string
   *           format: email
   *         description: 사용자 이메일
   *     responses:
   *       200:
   *         description: 성공적으로 사용자 정보를 반환
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       404:
   *         description: 사용자를 찾을 수 없음
   */
  router.get('/search', userController.getUserByEmail.bind(userController));

  /**
   * @swagger
   * /api/users/profile:
   *   put:
   *     summary: 사용자 정보 수정
   *     description: 현재 로그인한 사용자의 정보를 수정합니다.
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: 사용자 이름
   *               role:
   *                 type: string
   *                 enum: [USER, ADMIN]
   *                 description: 사용자 역할
   *     responses:
   *       200:
   *         description: 성공적으로 사용자 정보가 수정됨
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       401:
   *         description: 인증되지 않은 요청
   *       404:
   *         description: 사용자를 찾을 수 없음
   */
  router.put(
    '/profile',
    authenticateToken,
    userController.updateUser.bind(userController)
  );

  return router;
};

// 기본 export는 기존 호환성을 위해 유지
export default createUserRoutes;
