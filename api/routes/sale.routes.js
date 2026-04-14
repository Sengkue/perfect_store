import { Router } from 'express';
import * as saleController from '../controllers/sale.controller.js';
import auth from '../middleware/auth.js';
import roleCheck from '../middleware/roleCheck.js';
import { saleValidator } from '../utils/validators.js';

const router = Router();

router.get('/', auth, saleController.getAll);
router.get('/report/summary', auth, roleCheck('admin', 'manager'), saleController.getSalesReport);
router.get('/:id', auth, saleController.getById);
router.post('/', auth, saleValidator, saleController.create);
router.put('/:id/status', auth, saleController.updateStatus);
router.delete('/:id', auth, roleCheck('admin'), saleController.remove);

export default router;
