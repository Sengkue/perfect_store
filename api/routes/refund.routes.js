import { Router } from 'express';
import * as refundController from '../controllers/refund.controller.js';
import auth from '../middleware/auth.js';
import permissionCheck from '../middleware/permissionCheck.js';

const router = Router();

router.get('/', auth, permissionCheck('refunds.view'), refundController.getAll);
router.get('/:id', auth, permissionCheck('refunds.view'), refundController.getById);
router.post('/', auth, permissionCheck('refunds.create'), refundController.create);
router.put('/:id/status', auth, permissionCheck('refunds.create'), refundController.updateStatus);
router.delete('/:id', auth, permissionCheck('refunds.create'), refundController.remove);

export default router;
