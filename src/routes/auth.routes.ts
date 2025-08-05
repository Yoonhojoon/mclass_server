import { Router } from 'express';
import { AuthController } from '../domains/auth/auth.controller.js';
import {
  authenticateToken,
  requireSignUpCompleted,
  AuthenticatedRequest,
} from '../middleware/auth.middleware.js';
import passport from '../config/passport.config.js';

const router = Router();
const authController = new AuthController();

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginDto:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: 사용자 이메일
 *         password:
 *           type: string
 *           description: 사용자 비밀번호
 *     RegisterDto:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: 사용자 이메일
 *         password:
 *           type: string
 *           description: 사용자 비밀번호
 *         name:
 *           type: string
 *           description: 사용자 이름
 *         role:
 *           type: string
 *           enum: [USER, ADMIN]
 *           description: 사용자 역할
 *     SocialLoginDto:
 *       type: object
 *       required:
 *         - profile
 *       properties:
 *         profile:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: 소셜 로그인 ID
 *             email:
 *               type: string
 *               format: email
 *               description: 사용자 이메일
 *             name:
 *               type: string
 *               description: 사용자 이름
 *             provider:
 *               type: string
 *               enum: [KAKAO, GOOGLE, NAVER]
 *               description: 소셜 로그인 제공자
 *     CompleteSignUpDto:
 *       type: object
 *       required:
 *         - termIds
 *       properties:
 *         termIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: 동의할 약관 ID 목록
 *     AuthResponse:
 *       $ref: '#/components/schemas/AuthLoginResponse'
 *     AuthLogoutResponse:
 *       $ref: '#/components/schemas/AuthLogoutResponse'
 *     AuthErrorResponse:
 *       $ref: '#/components/schemas/AuthError'
 */

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: 인증 관련 API
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 사용자 로그인
 *     description: 이메일과 비밀번호로 로그인합니다.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginDto'
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', (req, res) => authController.login(req, res));

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 사용자 회원가입
 *     description: 새로운 사용자를 등록합니다.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterDto'
 *     responses:
 *       200:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 *       409:
 *         description: 이미 존재하는 사용자
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', (req, res) => authController.register(req, res));

/**
 * @swagger
 * /api/auth/social:
 *   post:
 *     summary: 소셜 로그인
 *     description: 소셜 로그인을 처리합니다.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SocialLoginDto'
 *     responses:
 *       200:
 *         description: 소셜 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 *       401:
 *         description: 소셜 로그인 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/social', (req, res) => authController.socialLogin(req, res));

/**
 * @swagger
 * /api/auth/complete-signup:
 *   post:
 *     summary: 약관 동의 완료 (회원가입 완료)
 *     description: 약관 동의를 완료하여 회원가입을 마무리합니다.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompleteSignUpDto'
 *     responses:
 *       200:
 *         description: 회원가입 완료 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/complete-signup', authenticateToken, (req, res) =>
  authController.completeSignUp(req as AuthenticatedRequest, res)
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: 로그아웃
 *     description: 사용자를 로그아웃합니다.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthLogoutResponse'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/logout', authenticateToken, (req, res) =>
  authController.logout(req, res)
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: 토큰 갱신
 *     description: Refresh Token을 사용하여 새로운 Access Token을 발급받습니다.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh Token
 *     responses:
 *       200:
 *         description: 토큰 갱신 성공
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
 *                     accessToken:
 *                       type: string
 *                       description: 새로운 Access Token
 *                     refreshToken:
 *                       type: string
 *                       description: 새로운 Refresh Token
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 *       401:
 *         description: 토큰 만료 또는 유효하지 않음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/refresh', (req, res) => authController.refreshToken(req, res));

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: 비밀번호 변경
 *     description: 현재 비밀번호를 확인하고 새 비밀번호로 변경합니다.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: 현재 비밀번호
 *               newPassword:
 *                 type: string
 *                 description: 새 비밀번호
 *     responses:
 *       200:
 *         description: 비밀번호 변경 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put(
  '/change-password',
  authenticateToken,
  requireSignUpCompleted,
  (req, res) => authController.changePassword(req as AuthenticatedRequest, res)
);

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Google OAuth 로그인
 *     description: Google OAuth를 통해 로그인합니다.
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Google OAuth 페이지로 리다이렉트
 */
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth 콜백
 *     description: Google OAuth 인증 후 콜백을 처리합니다.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Google OAuth 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // 성공적으로 인증된 경우 처리
    res.json({
      success: true,
      message: 'Google OAuth 로그인 성공',
      user: req.user,
    });
  }
);

export default router;
