import { Payment, Sale } from '../models/index.js';
import { getPagination, getPaginatedResponse } from '../utils/helpers.js';
import sequelize from '../config/database.js';

// GET /api/payments
export const getAll = async (req, res, next) => {
  try {
    const { limit, offset, page, pageSize } = getPagination(req.query);
    const where = {};

    if (req.query.sale_id) where.sale_id = req.query.sale_id;

    const data = await Payment.findAndCountAll({
      where,
      limit,
      offset,
      order: [['id', 'DESC']],
      include: [{
        model: Sale,
        as: 'sale',
        attributes: ['id', 'sale_number', 'sale_type', 'total_amount', 'payment_status']
      }]
    });

    res.json({
      success: true,
      ...getPaginatedResponse(data, page, pageSize)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/payments/:id
export const getById = async (req, res, next) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [{ model: Sale, as: 'sale' }]
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

// POST /api/payments
export const create = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { sale_id, amount, payment_method, transaction_id, payment_reference } = req.body;

    // Verify sale exists
    const sale = await Sale.findByPk(sale_id);
    if (!sale) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    const payment = await Payment.create({
      sale_id,
      amount,
      payment_method,
      transaction_id,
      payment_reference
    }, { transaction: t });

    // Calculate total paid for this sale
    const totalPaid = await Payment.sum('amount', {
      where: { sale_id },
      transaction: t
    });

    // Update sale payment status
    let paymentStatus = 'partial';
    if (totalPaid >= parseFloat(sale.total_amount)) {
      paymentStatus = 'paid';
    }

    await sale.update({
      payment_status: paymentStatus,
      updated_at: new Date()
    }, { transaction: t });

    await t.commit();

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment,
        total_paid: totalPaid,
        remaining: Math.max(0, parseFloat(sale.total_amount) - totalPaid),
        payment_status: paymentStatus
      }
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// GET /api/payments/sale/:saleId/history
export const getPaymentHistory = async (req, res, next) => {
  try {
    const sale = await Sale.findByPk(req.params.saleId);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    const payments = await Payment.findAll({
      where: { sale_id: req.params.saleId },
      order: [['payment_date', 'ASC']]
    });

    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    res.json({
      success: true,
      data: {
        sale: {
          id: sale.id,
          sale_number: sale.sale_number,
          total_amount: sale.total_amount,
          payment_status: sale.payment_status
        },
        payments,
        total_paid: totalPaid,
        remaining: Math.max(0, parseFloat(sale.total_amount) - totalPaid)
      }
    });
  } catch (error) {
    next(error);
  }
};
