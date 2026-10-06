import { Router } from 'express';
import { authController } from '../controllers/authController';
import { tenantContextMiddleware } from '../middleware/tenantContext';
import { validateBody } from '../app';
import { z } from 'zod';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', tenantContextMiddleware, validateBody(loginSchema), (req, res, next) => {
  authController.login(req, res, next);
});

router.post('/refresh', (req, res, next) => {
  authController.refresh(req, res, next);
});

router.post('/logout', (req, res) => {
  authController.logout(req, res);
});

export default router;
