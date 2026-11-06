import { Router } from 'express';
import { login, register, logout, getProfile, forgotPassword, resetPassword, changePassword, refresh } from '../controllers/authController.js';
import { loginValidator, registerValidator } from '../validators/authValidators.js';
import { validate } from '../middlewares/validate.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();
router.post('/login', loginValidator, validate, login);
router.post('/register', registerValidator, validate, register);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', protect, getProfile);
router.post('/change-password', protect, changePassword);
export default router;
