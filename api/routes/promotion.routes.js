import { Router } from 'express';
import * as promotionController from '../controllers/promotion.controller.js';
import auth from '../middleware/auth.js';
import roleCheck from '../middleware/roleCheck.js';
import { promotionValidator } from '../utils/validators.js';

const router = Router();

router.get('/', promotionController.getAll);
router.get('/:id', promotionController.getById);
router.post('/', auth, roleCheck('admin', 'manager'), promotionValidator, promotionController.create);
router.put('/:id', auth, roleCheck('admin', 'manager'), promotionController.update);
router.delete('/:id', auth, roleCheck('admin'), promotionController.remove);
router.post('/validate', promotionController.validatePromo);

export default router;
