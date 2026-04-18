import { Router } from 'express';

import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import userProfileRoutes from './userProfile.routes.js';
import permissionRoutes from './permission.routes.js';
import shopSettingRoutes from './shopSetting.routes.js';
import customerRoutes from './customer.routes.js';
import supplierRoutes from './supplier.routes.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';
import purchaseOrderRoutes from './purchaseOrder.routes.js';
import importRoutes from './import.routes.js';
import promotionRoutes from './promotion.routes.js';
import saleRoutes from './sale.routes.js';
import returnRoutes from './return.routes.js';
import paymentRoutes from './payment.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/users', userProfileRoutes); // mounts at /users/:userId/profile
router.use('/permissions', permissionRoutes);
router.use('/shop-settings', shopSettingRoutes);
router.use('/customers', customerRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/imports', importRoutes);
router.use('/promotions', promotionRoutes);
router.use('/sales', saleRoutes);
router.use('/returns', returnRoutes);
router.use('/payments', paymentRoutes);

export default router;
