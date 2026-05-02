import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';
import auth from '../middleware/auth.js';
import permissionCheck from '../middleware/permissionCheck.js';

const router = Router();

router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);
router.post('/', auth, permissionCheck('categories.manage'), categoryController.create);
router.put('/:id', auth, permissionCheck('categories.manage'), categoryController.update);
router.delete('/:id', auth, permissionCheck('categories.manage'), categoryController.remove);

export default router;
