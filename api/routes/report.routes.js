import { Router } from 'express';
import { getDashboardSummary, getSalesChart, getInventoryStatus, getCustomerReport, getStaffReport, getTopProducts, getExpenseReport } from '../controllers/report.controller.js';
import auth from '../middleware/auth.js';
import permissionCheck from '../middleware/permissionCheck.js';

const router = Router();

router.use(auth);

router.get('/summary', permissionCheck('sales.report'), getDashboardSummary);
router.get('/sales-chart', permissionCheck('sales.report'), getSalesChart);
router.get('/inventory', permissionCheck('sales.report'), getInventoryStatus);
router.get('/customers', permissionCheck('sales.report'), getCustomerReport);
router.get('/staff', permissionCheck('sales.report'), getStaffReport);
router.get('/top-products', permissionCheck('sales.report'), getTopProducts);
router.get('/expenses', permissionCheck('sales.report'), getExpenseReport);

export default router;
