import { Router } from 'express';
import { 
  getAllPermissions, 
  getRolePermissions, 
  updateRolePermissions,
  getUserPermissions,
  updateUserPermissions
} from '../controllers/permission.controller.js';
import auth from '../middleware/auth.js';
import roleCheck from '../middleware/roleCheck.js';

const router = Router();

router.use(auth);
router.use(roleCheck('admin')); // Assuming only admin manage permissions

router.get('/', getAllPermissions);

router.get('/role/:role', getRolePermissions);
router.put('/role/:role', updateRolePermissions);

router.get('/user/:userId', getUserPermissions);
router.put('/user/:userId', updateUserPermissions);

export default router;
