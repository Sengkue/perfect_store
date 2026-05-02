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
import refundRoutes from './refund.routes.js';
import paymentRoutes from './payment.routes.js';
import logRoutes from './log.routes.js';
import activityLogger from '../middleware/activityLogger.js';

const router = Router();

// --- Log all activity (Audit Log) ---
router.use(activityLogger);

// --- Basic Routes ---
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to Perfect Store API' });
});

// --- Feature Routes ---
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
router.use('/payments', paymentRoutes);
router.use('/refunds', refundRoutes);
router.use('/system-logs', logRoutes);

export default router;
