import { Router } from 'express';
import * as returnController from '../controllers/return.controller.js';
import auth from '../middleware/auth.js';
import permissionCheck from '../middleware/permissionCheck.js';

const router = Router();

router.get('/', auth, permissionCheck('returns.view'), returnController.getAll);
router.get('/:id', auth, permissionCheck('returns.view'), returnController.getById);
router.post('/', auth, permissionCheck('returns.create'), returnController.create);
router.put('/:id/status', auth, permissionCheck('returns.create'), returnController.updateStatus);
router.delete('/:id', auth, permissionCheck('returns.create'), returnController.remove);

export default router;
