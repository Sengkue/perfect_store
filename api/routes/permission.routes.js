import { Router } from 'express';
import { 
  getAllPermissions, 
  getRolePermissions, 
  updateRolePermissions,
  getUserPermissions,
  updateUserPermissions
} from '../controllers/permission.controller.js';
import auth from '../middleware/auth.js';
import permissionCheck from '../middleware/permissionCheck.js';

const router = Router();

router.use(auth);
router.use(permissionCheck('permissions.manage'));

router.get('/', getAllPermissions);

router.get('/role/:role', getRolePermissions);
router.put('/role/:role', updateRolePermissions);

router.get('/user/:userId', getUserPermissions);
router.put('/user/:userId', updateUserPermissions);

export default router;
