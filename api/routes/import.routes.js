import { Router } from 'express';
import * as importController from '../controllers/import.controller.js';
import auth from '../middleware/auth.js';
import roleCheck from '../middleware/roleCheck.js';
import { importValidator } from '../utils/validators.js';

const router = Router();

router.get('/', auth, importController.getAll);
router.get('/:id', auth, importController.getById);
router.post('/', auth, importValidator, importController.create);
router.put('/:id', auth, roleCheck('admin', 'manager'), importController.update);
router.put('/:id/status', auth, roleCheck('admin', 'manager'), importController.updateStatus);
router.delete('/:id', auth, roleCheck('admin'), importController.remove);

export default router;
