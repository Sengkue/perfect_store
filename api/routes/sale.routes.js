import { Router } from 'express';
import * as saleController from '../controllers/sale.controller.js';
import auth from '../middleware/auth.js';
import permissionCheck from '../middleware/permissionCheck.js';
import { saleValidator } from '../utils/validators.js';

const router = Router();

router.get('/', auth, permissionCheck('sales.view'), saleController.getAll);
router.get('/report/summary', auth, permissionCheck('sales.report'), saleController.getSalesReport);
router.get('/:id', auth, permissionCheck('sales.view'), saleController.getById);
router.post('/', auth, permissionCheck('sales.create'), saleValidator, saleController.create);
router.put('/:id/status', auth, permissionCheck('sales.view'), saleController.updateStatus);
router.delete('/:id', auth, permissionCheck('sales.delete'), saleController.remove);

export default router;
