import {
  Sale, SaleDetail, Customer, User, Promotion,
  CustomerAddress, Product, ProductVariant, Payment
} from '../models/index.js';
import { getPagination, getPaginatedResponse, generateSaleNumber } from '../utils/helpers.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

// GET /api/sales
export const getAll = async (req, res, next) => {
  try {
    const { limit, offset, page, pageSize } = getPagination(req.query);
    const where = {};

    // Filters
    if (req.query.sale_type) where.sale_type = req.query.sale_type;
    if (req.query.sale_status) where.sale_status = req.query.sale_status;
    if (req.query.payment_status) where.payment_status = req.query.payment_status;
    if (req.query.payment_method) where.payment_method = req.query.payment_method;
    if (req.query.delivery_status) where.delivery_status = req.query.delivery_status;
    if (req.query.customer_id) where.customer_id = req.query.customer_id;

    // Date range
    if (req.query.from_date || req.query.to_date) {
      where.sale_date = {};
      if (req.query.from_date) where.sale_date[Op.gte] = req.query.from_date;
      if (req.query.to_date) where.sale_date[Op.lte] = req.query.to_date + ' 23:59:59';
    }

    // Search by sale number or tracking code
    if (req.query.search) {
      where[Op.or] = [
        { sale_number: { [Op.like]: `%${req.query.search}%` } },
        { tracking_code: { [Op.like]: `%${req.query.search}%` } }
      ];
    }

    const data = await Sale.findAndCountAll({
      where,
      limit,
      offset,
      order: [['id', 'DESC']],
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'first_name', 'last_name', 'phone'] },
        { model: User, as: 'user', attributes: ['id', 'username'] }
      ]
    });

    res.json({
      success: true,
      ...getPaginatedResponse(data, page, pageSize)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/sales/:id
export const getById = async (req, res, next) => {
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: { exclude: ['password_hash'] }
        },
        { model: User, as: 'user' },
        { model: Promotion, as: 'promotion' },
        {
          model: CustomerAddress,
          as: 'address'
        },
        {
          model: SaleDetail,
          as: 'details',
          include: [
            { model: Product, as: 'product', attributes: ['id', 'name', 'barcode', 'sku'] },
            { model: ProductVariant, as: 'variant', attributes: ['id', 'color', 'size'] }
          ]
        }
      ]
    });

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    res.json({ success: true, data: sale });
  } catch (error) {
    next(error);
  }
};

// POST /api/sales
export const create = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { items, ...saleData } = req.body;

    // Generate sale number
    saleData.sale_number = generateSaleNumber(saleData.sale_type);

    // Set user from auth
    if (req.user) {
      saleData.user_id = req.user.id;
    }

    // Calculate subtotal from items and resolve missing variant_ids
    let subtotal = 0;
    const detailsData = [];
    for (const item of items) {
      const itemSubtotal = (item.unit_price * item.quantity) - (item.discount_per_item || 0) * item.quantity;
      subtotal += itemSubtotal;

      let variantId = item.variant_id || null;
      if (!variantId) {
        // Find default/first variant for this product
        const defaultVariant = await ProductVariant.findOne({ where: { product_id: item.product_id }, transaction: t });
        if (defaultVariant) {
          variantId = defaultVariant.id;
        }
      }

      // Ensure item has variant_id for the stock update loop below
      item.variant_id = variantId;

      detailsData.push({
        product_id: item.product_id,
        variant_id: variantId,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_per_item: item.discount_per_item || 0,
        subtotal: itemSubtotal
      });
    }

    saleData.subtotal = subtotal;

    // Apply promotion if provided
    if (saleData.promotion_id) {
      const promo = await Promotion.findByPk(saleData.promotion_id);
      if (promo && promo.is_active) {
        if (promo.discount_type === 'percentage') {
          saleData.discount_amount = (subtotal * parseFloat(promo.discount_value)) / 100;
        } else if (promo.discount_type === 'fixed_amount') {
          saleData.discount_amount = parseFloat(promo.discount_value);
        }
        // Increment used count
        await promo.increment('used_count', { transaction: t });
      }
    }

    // Calculate total
    const discountAmount = parseFloat(saleData.discount_amount) || 0;
    const taxAmount = parseFloat(saleData.tax_amount) || 0;
    const shippingFee = parseFloat(saleData.shipping_fee) || 0;
    saleData.total_amount = subtotal - discountAmount + taxAmount + shippingFee;

    const amountPaid = parseFloat(req.body.amount_paid) || 0;
    if (amountPaid >= saleData.total_amount) {
      saleData.payment_status = 'paid';
    } else if (amountPaid > 0) {
      saleData.payment_status = 'partial';
    } else {
      saleData.payment_status = 'pending';
    }

    // In-shop sales are completed instantly at the register.
    // Online / other types stay 'pending' until fulfilled.
    if (saleData.sale_type === 'in_shop') {
      saleData.sale_status = 'completed';
    }

    const sale = await Sale.create(saleData, { transaction: t });

    // Create payment record if any amount paid
    if (amountPaid > 0) {
      await Payment.create({
        sale_id: sale.id,
        amount: amountPaid,
        payment_method: saleData.payment_method
      }, { transaction: t });
    }

    // Create sale details
    const details = detailsData.map(d => ({ ...d, sale_id: sale.id }));
    await SaleDetail.bulkCreate(details, { transaction: t });

    // Update stock for variants
    for (const item of items) {
      if (item.variant_id) {
        await ProductVariant.decrement(
          'quantity_in_stock',
          { by: item.quantity, where: { id: item.variant_id }, transaction: t }
        );
      }
    }

    // Update customer total spent and loyalty points
    if (saleData.customer_id) {
      await Customer.increment(
        {
          total_spent: saleData.total_amount,
          loyalty_points: Math.floor(saleData.total_amount / 100) // 1 point per 100 spent
        },
        { where: { id: saleData.customer_id }, transaction: t }
      );
    }

    await t.commit();

    const result = await Sale.findByPk(sale.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'first_name', 'last_name'] },
        {
          model: SaleDetail,
          as: 'details',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: result
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// PUT /api/sales/:id/status
export const updateStatus = async (req, res, next) => {
  try {
    const sale = await Sale.findByPk(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    const updateData = {};
    if (req.body.sale_status) updateData.sale_status = req.body.sale_status;
    if (req.body.payment_status) updateData.payment_status = req.body.payment_status;
    if (req.body.delivery_status) updateData.delivery_status = req.body.delivery_status;
    if (req.body.tracking_code) updateData.tracking_code = req.body.tracking_code;
    if (req.body.courier_name) updateData.courier_name = req.body.courier_name;
    if (req.body.estimated_delivery) updateData.estimated_delivery = req.body.estimated_delivery;

    // Set actual delivery date if delivered
    if (req.body.delivery_status === 'delivered') {
      updateData.actual_delivery = new Date();
    }

    updateData.updated_at = new Date();

    await sale.update(updateData);

    res.json({
      success: true,
      message: 'Sale updated successfully',
      data: sale
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/sales/report/summary
export const getSalesReport = async (req, res, next) => {
  try {
    const where = { sale_status: 'completed' };

    if (req.query.from_date || req.query.to_date) {
      where.sale_date = {};
      if (req.query.from_date) where.sale_date[Op.gte] = req.query.from_date;
      if (req.query.to_date) where.sale_date[Op.lte] = req.query.to_date + ' 23:59:59';
    }

    // Overall summary
    const summary = await Sale.findAll({
      where,
      attributes: [
        'sale_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_transactions'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_revenue'],
        [sequelize.fn('AVG', sequelize.col('total_amount')), 'avg_order_value']
      ],
      group: ['sale_type'],
      raw: true
    });

    // Daily breakdown
    const daily = await Sale.findAll({
      where,
      attributes: [
        [sequelize.fn('DATE', sequelize.col('sale_date')), 'date'],
        'sale_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'transactions'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue']
      ],
      group: [sequelize.fn('DATE', sequelize.col('sale_date')), 'sale_type'],
      order: [[sequelize.fn('DATE', sequelize.col('sale_date')), 'DESC']],
      raw: true
    });

    res.json({
      success: true,
      data: { summary, daily }
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/sales/:id
export const remove = async (req, res, next) => {
  try {
    const sale = await Sale.findByPk(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    if (sale.sale_status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a completed sale. Use return/refund instead.'
      });
    }

    await sale.destroy();
    res.json({ success: true, message: 'Sale deleted successfully' });
  } catch (error) {
    next(error);
  }
};
