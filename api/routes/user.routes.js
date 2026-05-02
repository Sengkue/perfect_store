import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import auth from '../middleware/auth.js';
import permissionCheck from '../middleware/permissionCheck.js';

const router = Router();

// All user management routes require users permission
router.get('/',                  auth, permissionCheck('users.view'), userController.getAll);
router.get('/:id',               auth, permissionCheck('users.view'), userController.getById);
router.post('/',                 auth, permissionCheck('users.manage'), userController.create);
router.put('/:id',               auth, permissionCheck('users.manage'), userController.update);
router.put('/:id/reset-password',auth, permissionCheck('users.manage'), userController.resetPassword);
router.delete('/:id',            auth, permissionCheck('users.manage'), userController.remove);

export default router;
