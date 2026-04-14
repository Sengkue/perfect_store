import { Router } from 'express';

import authRoutes from './auth.routes.js';
import shopSettingRoutes from './shopSetting.routes.js';
import provinceRoutes from './province.routes.js';
import districtRoutes from './district.routes.js';
import employeeRoutes from './employee.routes.js';
import customerRoutes from './customer.routes.js';
import supplierRoutes from './supplier.routes.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';
import importRoutes from './import.routes.js';
import promotionRoutes from './promotion.routes.js';
import saleRoutes from './sale.routes.js';
import returnRoutes from './return.routes.js';
import paymentRoutes from './payment.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/shop-settings', shopSettingRoutes);
router.use('/provinces', provinceRoutes);
router.use('/districts', districtRoutes);
router.use('/employees', employeeRoutes);
router.use('/customers', customerRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/imports', importRoutes);
router.use('/promotions', promotionRoutes);
router.use('/sales', saleRoutes);
router.use('/returns', returnRoutes);
router.use('/payments', paymentRoutes);

export default router;
