import { Router } from 'express';
import * as shopSettingController from '../controllers/shopSetting.controller.js';
import auth from '../middleware/auth.js';
import roleCheck from '../middleware/roleCheck.js';

const router = Router();

router.get('/', shopSettingController.getSettings);
router.put('/', auth, roleCheck('admin'), shopSettingController.updateSettings);

export default router;
