import { Router } from 'express';
import { register, login, logout, getCurrentUser } from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

// Rotte pubbliche
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Rotte protette
router.get('/me', authenticate, getCurrentUser);

export { router as authRouter }; 