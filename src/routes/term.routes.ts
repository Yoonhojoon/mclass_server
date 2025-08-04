import { Router } from 'express';
import { TermController } from '../domains/term/term.controller';
import { TermService } from '../domains/term/term.service';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();
const termService = new TermService(prisma);
const termController = new TermController(termService);

// 약관 관리 라우트
router.get('/terms', (req, res) => termController.getAllTerms(req, res));
router.get('/terms/:id', (req, res) => termController.getTermById(req, res));

// 관리자 전용 라우트 (인증 및 관리자 권한 필요)
router.post('/terms', authenticateToken, requireAdmin, (req, res) =>
  termController.createTerm(req, res)
);
router.put('/terms/:id', authenticateToken, requireAdmin, (req, res) =>
  termController.updateTerm(req, res)
);
router.delete('/terms/:id', authenticateToken, requireAdmin, (req, res) =>
  termController.deleteTerm(req, res)
);

// 사용자 약관 동의 라우트 (인증 필요)
router.post('/users/agreements', authenticateToken, (req, res) =>
  termController.agreeToTerm(req, res)
);
router.get('/users/agreements', authenticateToken, (req, res) =>
  termController.getUserAgreements(req, res)
);

export default router;
