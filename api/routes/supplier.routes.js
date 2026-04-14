import { Router } from 'express';
import * as supplierController from '../controllers/supplier.controller.js';
import auth from '../middleware/auth.js';

const router = Router();

router.get('/', auth, supplierController.getAll);
router.get('/:id', auth, supplierController.getById);
router.post('/', auth, supplierController.create);
router.put('/:id', auth, supplierController.update);
router.delete('/:id', auth, supplierController.remove);

export default router;
