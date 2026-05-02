import { Router } from 'express';
import * as customerController from '../controllers/customer.controller.js';
import auth from '../middleware/auth.js';
import permissionCheck from '../middleware/permissionCheck.js';
import { customerValidator } from '../utils/validators.js';

const router = Router();

// Customer CRUD
router.get('/', auth, permissionCheck('customers.view'), customerController.getAll);
router.get('/:id', auth, permissionCheck('customers.view'), customerController.getById);
router.post('/', auth, permissionCheck('customers.manage'), customerValidator, customerController.create);
router.put('/:id', auth, permissionCheck('customers.manage'), customerController.update);
router.delete('/:id', auth, permissionCheck('customers.manage'), customerController.remove);

// Customer Addresses
router.get('/:id/addresses', auth, permissionCheck('customers.view'), customerController.getAddresses);
router.post('/:id/addresses', auth, permissionCheck('customers.manage'), customerController.addAddress);
router.put('/:id/addresses/:addressId', auth, permissionCheck('customers.manage'), customerController.updateAddress);
router.delete('/:id/addresses/:addressId', auth, permissionCheck('customers.manage'), customerController.removeAddress);

export default router;
