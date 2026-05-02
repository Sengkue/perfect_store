import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import auth from '../middleware/auth.js';
import permissionCheck from '../middleware/permissionCheck.js';
import upload from '../middleware/upload.js';
import { productValidator } from '../utils/validators.js';

const router = Router();

// Product CRUD
router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.post('/', auth, permissionCheck('products.create'), productValidator, productController.create);
router.put('/:id', auth, permissionCheck('products.edit'), productController.update);
router.delete('/:id', auth, permissionCheck('products.delete'), productController.remove);

// Variants
router.post('/:id/variants', auth, permissionCheck('products.edit'), productController.addVariant);
router.put('/:id/variants/:variantId', auth, permissionCheck('products.edit'), productController.updateVariant);
router.delete('/:id/variants/:variantId', auth, permissionCheck('products.delete'), productController.removeVariant);

// Images
router.post('/:id/images', auth, permissionCheck('products.edit'), upload.single('image'), productController.addImage);
router.delete('/:id/images/:imageId', auth, permissionCheck('products.delete'), productController.removeImage);

export default router;
