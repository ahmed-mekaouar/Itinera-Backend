import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, register, getMe, refresh } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateLogin, validateRegister } from '../middleware/validation.middleware';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});

router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/refresh', refresh);
router.get('/me', authenticate, getMe);

export default router;
