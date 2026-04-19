import { body, param, query } from 'express-validator';
import { validationResult } from 'express-validator';

/**
 * Middleware to check validation results
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({
        field: e.path,
        message: e.msg
      }))
    });
  }
  next();
};

// --- Auth validators ---
export const loginValidator = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

export const registerValidator = [
  body('username')
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'staff', 'manager']).withMessage('Role must be admin, staff, or manager'),
  body('employee_id')
    .optional()
    .isInt().withMessage('Employee ID must be an integer'),
  validate
];

// --- Employee validators ---
export const employeeValidator = [
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('phone').optional().isString(),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('salary').optional().isDecimal().withMessage('Salary must be a decimal number'),
  validate
];

// --- Customer validators ---
export const customerValidator = [
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('phone').optional().isString(),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  validate
];

// --- Product validators ---
export const productValidator = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('selling_price')
    .notEmpty().withMessage('Selling price is required')
    .isDecimal().withMessage('Selling price must be a decimal'),
  body('cost_price').optional().isDecimal().withMessage('Cost price must be a decimal'),
  body('barcode').optional().isString(),
  body('sku').optional().isString(),
  validate
];

// --- Sale validators ---
export const saleValidator = [
  body('sale_type')
    .notEmpty().withMessage('Sale type is required')
    .isIn(['in_shop', 'online']).withMessage('Sale type must be in_shop or online'),
  // total_amount is computed server-side from items — no need to send it from the client
  body('total_amount')
    .optional()
    .isNumeric().withMessage('Total amount must be a number'),
  body('items')
    .isArray({ min: 1 }).withMessage('At least one sale item is required'),
  body('items.*.product_id')
    .notEmpty().withMessage('Product ID is required for each item')
    .isInt().withMessage('Product ID must be an integer'),
  body('items.*.quantity')
    .notEmpty().withMessage('Quantity is required for each item')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unit_price')
    .notEmpty().withMessage('Unit price is required for each item')
    .isNumeric().withMessage('Unit price must be a number'),
  validate
];

// --- Import validators ---
export const importValidator = [
  body('supplier_id').optional().isInt().withMessage('Supplier ID must be an integer'),
  body('items')
    .isArray({ min: 1 }).withMessage('At least one import item is required'),
  body('items.*.product_id')
    .notEmpty().withMessage('Product ID is required')
    .isInt().withMessage('Product ID must be an integer'),
  body('items.*.quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  validate
];

// --- Promotion validators ---
export const promotionValidator = [
  body('promo_code').notEmpty().withMessage('Promo code is required'),
  body('discount_type')
    .notEmpty().withMessage('Discount type is required')
    .isIn(['percentage', 'fixed_amount', 'buy_x_get_y']).withMessage('Invalid discount type'),
  body('discount_value')
    .notEmpty().withMessage('Discount value is required')
    .isDecimal().withMessage('Discount value must be a decimal'),
  validate
];

// --- Generic ID param validator ---
export const idParamValidator = [
  param('id').isInt().withMessage('ID must be an integer'),
  validate
];
