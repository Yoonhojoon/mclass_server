import express, { Request, Response } from 'express';

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 모든 사용자 조회
 *     description: 시스템에 등록된 모든 사용자 목록을 반환합니다.
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: 성공적으로 사용자 목록을 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', (req: Request, res: Response) => {
  // 임시 사용자 데이터
  const users = [
    { id: 1, name: '홍길동', email: 'hong@example.com' },
    { id: 2, name: '김철수', email: 'kim@example.com' },
  ];

  res.json(users);
});

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
 *           type: integer
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);

  // 임시 사용자 데이터
  const user = { id: userId, name: '홍길동', email: 'hong@example.com' };

  if (userId > 10) {
    return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
  }

  return res.json(user);
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 새 사용자 생성
 *     description: 새로운 사용자를 시스템에 등록합니다.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 description: 사용자 이름
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 사용자 이메일
 *     responses:
 *       201:
 *         description: 성공적으로 사용자가 생성됨
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: 잘못된 요청 데이터
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', (req: Request, res: Response) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: '이름과 이메일은 필수입니다.' });
  }

  // 새 사용자 생성 (실제로는 데이터베이스에 저장)
  const newUser = {
    id: Math.floor(Math.random() * 1000),
    name,
    email,
  };

  return res.status(201).json(newUser);
});

export default router;
