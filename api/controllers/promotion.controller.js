import { Promotion } from '../models/index.js';
import { getPagination, getPaginatedResponse } from '../utils/helpers.js';
import { Op } from 'sequelize';

// GET /api/promotions
export const getAll = async (req, res, next) => {
  try {
    const { limit, offset, page, pageSize } = getPagination(req.query);
    const where = {};

    if (req.query.is_active !== undefined) where.is_active = req.query.is_active === 'true';

    // Filter active promotions by date
    if (req.query.current === 'true') {
      const now = new Date();
      where.start_date = { [Op.lte]: now };
      where.end_date = { [Op.gte]: now };
      where.is_active = true;
    }

    if (req.query.search) {
      where[Op.or] = [
        { promo_code: { [Op.like]: `%${req.query.search}%` } },
        { name: { [Op.like]: `%${req.query.search}%` } }
      ];
    }

    const data = await Promotion.findAndCountAll({
      where,
      limit,
      offset,
      order: [['id', 'DESC']]
    });

    res.json({
      success: true,
      ...getPaginatedResponse(data, page, pageSize)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/promotions/:id
export const getById = async (req, res, next) => {
  try {
    const promotion = await Promotion.findByPk(req.params.id);
    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Promotion not found' });
    }

    res.json({ success: true, data: promotion });
  } catch (error) {
    next(error);
  }
};

// POST /api/promotions
export const create = async (req, res, next) => {
  try {
    const promotion = await Promotion.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Promotion created successfully',
      data: promotion
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/promotions/:id
export const update = async (req, res, next) => {
  try {
    const promotion = await Promotion.findByPk(req.params.id);
    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Promotion not found' });
    }

    await promotion.update(req.body);
    res.json({
      success: true,
      message: 'Promotion updated successfully',
      data: promotion
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/promotions/:id
export const remove = async (req, res, next) => {
  try {
    const promotion = await Promotion.findByPk(req.params.id);
    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Promotion not found' });
    }

    await promotion.destroy();
    res.json({ success: true, message: 'Promotion deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// POST /api/promotions/validate
export const validatePromo = async (req, res, next) => {
  try {
    const { promo_code, purchase_amount } = req.body;

    const promotion = await Promotion.findOne({
      where: {
        promo_code,
        is_active: true,
        start_date: { [Op.lte]: new Date() },
        end_date: { [Op.gte]: new Date() }
      }
    });

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired promo code.'
      });
    }

    // Check usage limit
    if (promotion.usage_limit && promotion.used_count >= promotion.usage_limit) {
      return res.status(400).json({
        success: false,
        message: 'Promo code has reached its usage limit.'
      });
    }

    // Check minimum purchase
    if (purchase_amount && parseFloat(purchase_amount) < parseFloat(promotion.min_purchase)) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase of ${promotion.min_purchase} is required.`
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (promotion.discount_type === 'percentage') {
      discountAmount = (parseFloat(purchase_amount) * parseFloat(promotion.discount_value)) / 100;
    } else if (promotion.discount_type === 'fixed_amount') {
      discountAmount = parseFloat(promotion.discount_value);
    }

    res.json({
      success: true,
      message: 'Promo code is valid',
      data: {
        promotion,
        discount_amount: discountAmount,
        final_amount: Math.max(0, parseFloat(purchase_amount) - discountAmount)
      }
    });
  } catch (error) {
    next(error);
  }
};
