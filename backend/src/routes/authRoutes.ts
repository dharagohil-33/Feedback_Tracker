import { Router } from 'express';
import { registerUser, loginUser, logoutUser, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', requireAuth, logoutUser);
router.get('/me', requireAuth, getMe);

export default router;
