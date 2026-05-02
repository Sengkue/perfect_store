import { Router } from 'express';
import * as logController from '../controllers/log.controller.js';
import auth from '../middleware/auth.js';
import permissionCheck from '../middleware/permissionCheck.js';

const router = Router();

// Only root or users with system.logs permission can view logs
router.get('/', auth, permissionCheck('system.view_logs'), logController.getLogs);

export default router;
