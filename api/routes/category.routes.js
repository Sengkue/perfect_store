import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);
router.post('/', auth, categoryController.create);
router.put('/:id', auth, categoryController.update);
router.delete('/:id', auth, categoryController.remove);

export default router;
