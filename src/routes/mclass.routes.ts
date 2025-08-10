import { Router } from 'express';
import { MClassController } from '../domains/mclass/mclass.controller.js';
import { MClassService } from '../domains/mclass/mclass.service.js';
import { MClassRepository } from '../domains/mclass/mclass.repository.js';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
const prisma = new PrismaClient();
const repository = new MClassRepository(prisma);
const service = new MClassService(repository);
const controller = new MClassController(service);

// 공개 라우트 (인증 불필요)
router.get('/mclasses', controller.getMClasses.bind(controller));
router.get('/mclasses/:id', controller.getMClass.bind(controller));
router.get(
  '/mclasses/:id/statistics',
  controller.getMClassStatistics.bind(controller)
);

// 관리자 전용 라우트 (인증 필요)
router.post(
  '/mclasses',
  authMiddleware,
  controller.createMClass.bind(controller)
);
router.patch(
  '/mclasses/:id',
  authMiddleware,
  controller.updateMClass.bind(controller)
);
router.delete(
  '/mclasses/:id',
  authMiddleware,
  controller.deleteMClass.bind(controller)
);

export default router;
