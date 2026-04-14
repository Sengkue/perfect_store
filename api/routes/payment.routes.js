import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

router.get('/', auth, paymentController.getAll);
router.get('/:id', auth, paymentController.getById);
router.post('/', auth, paymentController.create);
router.get('/sale/:saleId/history', auth, paymentController.getPaymentHistory);

export default router;
