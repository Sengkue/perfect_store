import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import auth from '../middleware/auth.js';
import roleCheck from '../middleware/roleCheck.js';

const router = Router();

// All user management routes require admin role
router.get('/',                  auth, roleCheck('admin'), userController.getAll);
router.get('/:id',               auth, roleCheck('admin'), userController.getById);
router.post('/',                 auth, roleCheck('admin'), userController.create);
router.put('/:id',               auth, roleCheck('admin'), userController.update);
router.put('/:id/reset-password',auth, roleCheck('admin'), userController.resetPassword);
router.delete('/:id',            auth, roleCheck('admin'), userController.remove);

export default router;
