import { Router } from 'express';
import * as importController from '../controllers/import.controller.js';
import auth from '../middleware/auth.js';
import permissionCheck from '../middleware/permissionCheck.js';
import { importValidator } from '../utils/validators.js';

const router = Router();

router.get('/', auth, permissionCheck('imports.view'), importController.getAll);
router.get('/:id', auth, permissionCheck('imports.view'), importController.getById);
router.post('/', auth, permissionCheck('imports.create'), importValidator, importController.create);
router.put('/:id', auth, permissionCheck('imports.create'), importController.update);
router.put('/:id/status', auth, permissionCheck('imports.complete'), importController.updateStatus);
router.delete('/:id', auth, permissionCheck('imports.complete'), importController.remove);

export default router;
