import { Router } from 'express';
import * as employeeController from '../controllers/employee.controller.js';
import auth from '../middleware/auth.js';
import roleCheck from '../middleware/roleCheck.js';
import { employeeValidator } from '../utils/validators.js';

const router = Router();

router.get('/', auth, employeeController.getAll);
router.get('/:id', auth, employeeController.getById);
router.post('/', auth, roleCheck('admin', 'manager'), employeeValidator, employeeController.create);
router.put('/:id', auth, roleCheck('admin', 'manager'), employeeController.update);
router.delete('/:id', auth, roleCheck('admin'), employeeController.remove);

export default router;
