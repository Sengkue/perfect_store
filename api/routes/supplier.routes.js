import { Router } from 'express';
import * as supplierController from '../controllers/supplier.controller.js';
import auth from '../middleware/auth.js';
import permissionCheck from '../middleware/permissionCheck.js';

const router = Router();

router.get('/', auth, permissionCheck('suppliers.view'), supplierController.getAll);
router.get('/:id', auth, permissionCheck('suppliers.view'), supplierController.getById);
router.post('/', auth, permissionCheck('suppliers.manage'), supplierController.create);
router.put('/:id', auth, permissionCheck('suppliers.manage'), supplierController.update);
router.delete('/:id', auth, permissionCheck('suppliers.manage'), supplierController.remove);

export default router;
