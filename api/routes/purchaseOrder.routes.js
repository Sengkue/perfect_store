import { Router } from 'express';
import { getAll, getById, create, updateStatus } from '../controllers/purchaseOrder.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id/status', updateStatus);

export default router;
