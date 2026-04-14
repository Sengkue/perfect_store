import { Router } from 'express';
import * as customerController from '../controllers/customer.controller.js';
import auth from '../middleware/auth.js';
import { customerValidator } from '../utils/validators.js';

const router = Router();

// Customer CRUD
router.get('/', auth, customerController.getAll);
router.get('/:id', auth, customerController.getById);
router.post('/', auth, customerValidator, customerController.create);
router.put('/:id', auth, customerController.update);
router.delete('/:id', auth, customerController.remove);

// Customer Addresses
router.get('/:id/addresses', auth, customerController.getAddresses);
router.post('/:id/addresses', auth, customerController.addAddress);
router.put('/:id/addresses/:addressId', auth, customerController.updateAddress);
router.delete('/:id/addresses/:addressId', auth, customerController.removeAddress);

export default router;
