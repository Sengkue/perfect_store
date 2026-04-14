import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { productValidator } from '../utils/validators.js';

const router = Router();

// Product CRUD
router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.post('/', auth, productValidator, productController.create);
router.put('/:id', auth, productController.update);
router.delete('/:id', auth, productController.remove);

// Variants
router.post('/:id/variants', auth, productController.addVariant);
router.put('/:id/variants/:variantId', auth, productController.updateVariant);
router.delete('/:id/variants/:variantId', auth, productController.removeVariant);

// Images
router.post('/:id/images', auth, upload.single('image'), productController.addImage);
router.delete('/:id/images/:imageId', auth, productController.removeImage);

export default router;
