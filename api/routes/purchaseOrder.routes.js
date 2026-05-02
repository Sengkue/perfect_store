import { Router } from 'express';
import { getAll, getById, create, update, updateStatus, remove } from '../controllers/purchaseOrder.controller.js';
import auth from '../middleware/auth.js';
import permissionCheck from '../middleware/permissionCheck.js';

const router = Router();

router.use(auth);

router.get('/', permissionCheck('purchase_orders.view'), getAll);
router.get('/:id', permissionCheck('purchase_orders.view'), getById);
router.post('/', permissionCheck('purchase_orders.create'), create);
router.put('/:id', permissionCheck('purchase_orders.create'), update);
router.put('/:id/status', permissionCheck('purchase_orders.approve'), updateStatus);
router.delete('/:id', permissionCheck('purchase_orders.approve'), remove);

export default router;
