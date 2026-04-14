import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import auth from '../middleware/auth.js';
import { loginValidator, registerValidator } from '../utils/validators.js';

const router = Router();

router.post('/login', loginValidator, authController.login);
router.post('/register', registerValidator, authController.register);
router.get('/me', auth, authController.getProfile);
router.put('/change-password', auth, authController.changePassword);

export default router;
