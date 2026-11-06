import { Router } from 'express';
import { registerOptions, registerVerify, loginOptions, loginVerify, listCredentials, deleteCredential } from '../controllers/webauthnController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();
router.get('/register-options', protect, registerOptions);
router.post('/register', protect, registerVerify);
router.get('/login-options', loginOptions);
router.post('/login', loginVerify);
router.get('/credentials', protect, listCredentials);
router.delete('/credentials/:id', protect, deleteCredential);
export default router;
