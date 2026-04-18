import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/userProfile.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

// Base route: /api/users/:userId/profile (so we mount nested)
router.get('/:userId/profile', auth, getProfile);
router.put('/:userId/profile', auth, updateProfile);

export default router;
