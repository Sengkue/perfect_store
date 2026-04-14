import { Router } from 'express';
import * as districtController from '../controllers/district.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

router.get('/', districtController.getAll);
router.get('/:id', districtController.getById);
router.post('/', auth, districtController.create);
router.put('/:id', auth, districtController.update);
router.delete('/:id', auth, districtController.remove);

export default router;
