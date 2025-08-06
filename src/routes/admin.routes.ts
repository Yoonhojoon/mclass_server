import { Router, Request, Response } from 'express';
import { AdminController } from '../domains/admin/admin.controller.js';
import { AdminService } from '../domains/admin/admin.service.js';
import { PrismaClient } from '@prisma/client';
import {
  authenticateToken,
  requireAdmin,
} from '../middleware/auth.middleware.js';

const router = Router();
const prisma = new PrismaClient();
const adminService = new AdminService(prisma);
const adminController = new AdminController(adminService);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   get:
 *     summary: 사용자 권한 조회
 *     description: 특정 사용자의 권한 정보를 조회합니다.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 사용자 권한 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserRole'
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
router.get(
  '/users/:id/role',
  authenticateToken,
  requireAdmin,
  (req: Request, res: Response) =>
    adminController.getUserRole(
      req as unknown as Request & {
        user?: { id: string; email: string; role: string; isAdmin?: boolean };
      },
      res
    )
);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   patch:
 *     summary: 사용자 권한 변경
 *     description: 특정 사용자의 권한을 변경합니다. (관리자만 가능)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 변경할 사용자 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRoleRequest'
 *     responses:
 *       200:
 *         description: 권한 변경 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/UserRole'
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음 또는 변경 불가
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
router.patch(
  '/users/:id/role',
  authenticateToken,
  requireAdmin,
  (req: Request, res: Response) =>
    adminController.updateUserRole(
      req as unknown as Request & {
        user?: { id: string; email: string; role: string; isAdmin?: boolean };
      },
      res
    )
);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: 모든 사용자 목록 조회
 *     description: 시스템의 모든 사용자 목록을 조회합니다. (관리자만 가능)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserRole'
 *                 count:
 *                   type: integer
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음
 */
router.get(
  '/users',
  authenticateToken,
  requireAdmin,
  (req: Request, res: Response) =>
    adminController.getAllUsers(
      req as unknown as Request & {
        user?: { id: string; email: string; role: string; isAdmin?: boolean };
      },
      res
    )
);

/**
 * @swagger
 * /api/admin/admin-count:
 *   get:
 *     summary: 관리자 수 조회
 *     description: 시스템의 관리자 수를 조회합니다. (관리자만 가능)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 관리자 수 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     adminCount:
 *                       type: integer
 *                       description: 관리자 수
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음
 */
router.get(
  '/admin-count',
  authenticateToken,
  requireAdmin,
  (req: Request, res: Response) =>
    adminController.getAdminCount(
      req as unknown as Request & {
        user?: { id: string; email: string; role: string; isAdmin?: boolean };
      },
      res
    )
);

export default router;
