import { Router } from 'express';
import * as provinceController from '../controllers/province.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

router.get('/', provinceController.getAll);
router.get('/:id', provinceController.getById);
router.post('/', auth, provinceController.create);
router.put('/:id', auth, provinceController.update);
router.delete('/:id', auth, provinceController.remove);

export default router;
