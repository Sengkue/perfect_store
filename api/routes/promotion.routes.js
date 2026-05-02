import { Router } from 'express';
import * as promotionController from '../controllers/promotion.controller.js';
import auth from '../middleware/auth.js';
import permissionCheck from '../middleware/permissionCheck.js';
import { promotionValidator } from '../utils/validators.js';

const router = Router();

router.get('/', promotionController.getAll);
router.get('/:id', promotionController.getById);
router.post('/', auth, permissionCheck('sales.create'), promotionValidator, promotionController.create);
router.put('/:id', auth, permissionCheck('sales.create'), promotionController.update);
router.delete('/:id', auth, permissionCheck('sales.delete'), promotionController.remove);
router.post('/validate', promotionController.validatePromo);

export default router;
