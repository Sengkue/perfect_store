import { Router } from 'express';
import * as shopSettingController from '../controllers/shopSetting.controller.js';
import auth from '../middleware/auth.js';
import permissionCheck from '../middleware/permissionCheck.js';

const router = Router();

router.get('/', shopSettingController.getSettings);
router.put('/', auth, permissionCheck('settings.manage'), shopSettingController.updateSettings);

export default router;
