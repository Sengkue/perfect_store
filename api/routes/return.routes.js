import { Router } from 'express';
import * as returnController from '../controllers/return.controller.js';
import auth from '../middleware/auth.js';
import roleCheck from '../middleware/roleCheck.js';

const router = Router();

router.get('/', auth, returnController.getAll);
router.get('/:id', auth, returnController.getById);
router.post('/', auth, returnController.create);
router.put('/:id/status', auth, roleCheck('admin', 'manager'), returnController.updateStatus);
router.delete('/:id', auth, roleCheck('admin'), returnController.remove);

export default router;
