import { Refund, RefundDetail, Sale, SaleDetail, Product, ProductVariant, User } from '../models/index.js';
import { getPagination, getPaginatedResponse } from '../utils/helpers.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

// GET /api/refunds
export const getAll = async (req, res, next) => {
  try {
    const { limit, offset, page, pageSize } = getPagination(req.query);
    const where = {};

    if (req.query.refund_status) where.refund_status = req.query.refund_status;
    if (req.query.sale_id) where.sale_id = req.query.sale_id;

    const data = await Refund.findAndCountAll({
      where,
      limit,
      offset,
      order: [['id', 'DESC']],
      include: [
        {
          model: Sale,
          as: 'sale',
          attributes: ['id', 'sale_number', 'sale_type', 'total_amount']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }
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

// GET /api/refunds/:id
export const getById = async (req, res, next) => {
  try {
    const refundRecord = await Refund.findByPk(req.params.id, {
      include: [
        { model: Sale, as: 'sale' },
        { model: User, as: 'user' },
        {
          model: RefundDetail,
          as: 'details',
          include: [{
            model: SaleDetail,
            as: 'saleDetail',
            include: [
              { model: Product, as: 'product', attributes: ['id', 'name'] },
              { model: ProductVariant, as: 'variant', attributes: ['id', 'color', 'size'] }
            ]
          }]
        }
      ]
    });

    if (!refundRecord) {
      return res.status(404).json({ success: false, message: 'Refund not found' });
    }

    res.json({ success: true, data: refundRecord });
  } catch (error) {
    next(error);
  }
};

// POST /api/refunds
export const create = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { items, ...refundData } = req.body;

    // Verify sale exists
    const sale = await Sale.findByPk(refundData.sale_id);
    if (!sale) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    // Set user from auth
    if (req.user) {
      refundData.user_id = req.user.id;
    }

    // Calculate total refund
    let totalRefund = 0;
    const detailsData = items.map(item => {
      totalRefund += parseFloat(item.refund_amount) || 0;
      return {
        sale_detail_id: item.sale_detail_id,
        quantity_refunded: item.quantity_refunded,
        refund_amount: item.refund_amount || 0
      };
    });

    refundData.refund_amount = totalRefund;

    const refundRecord = await Refund.create(refundData, { transaction: t });

    // Create refund details
    const details = detailsData.map(d => ({ ...d, refund_id: refundRecord.id }));
    await RefundDetail.bulkCreate(details, { transaction: t });

    await t.commit();

    const result = await Refund.findByPk(refundRecord.id, {
      include: [
        { model: Sale, as: 'sale', attributes: ['id', 'sale_number'] },
        { model: RefundDetail, as: 'details' }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Refund created successfully',
      data: result
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// PUT /api/refunds/:id/status
export const updateStatus = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const refundRecord = await Refund.findByPk(req.params.id, {
      include: [{
        model: RefundDetail,
        as: 'details',
        include: [{
          model: SaleDetail,
          as: 'saleDetail'
        }]
      }]
    });

    if (!refundRecord) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Refund not found' });
    }

    const { refund_status } = req.body;

    // If completing refund, restore stock
    if (refund_status === 'completed' && refundRecord.refund_status !== 'completed') {
      for (const detail of refundRecord.details) {
        if (detail.saleDetail && detail.saleDetail.variant_id) {
          await ProductVariant.increment(
            'quantity_in_stock',
            {
              by: detail.quantity_refunded,
              where: { id: detail.saleDetail.variant_id },
              transaction: t
            }
          );
        }
      }

      // Update sale status
      await Sale.update(
        { sale_status: 'returned' },
        { where: { id: refundRecord.sale_id }, transaction: t }
      );
    }

    await refundRecord.update({ refund_status }, { transaction: t });
    await t.commit();

    res.json({
      success: true,
      message: `Refund status updated to ${refund_status}`,
      data: refundRecord
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// DELETE /api/refunds/:id
export const remove = async (req, res, next) => {
  try {
    const refundRecord = await Refund.findByPk(req.params.id);
    if (!refundRecord) {
      return res.status(404).json({ success: false, message: 'Refund not found' });
    }

    if (refundRecord.refund_status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a completed refund.'
      });
    }

    await refundRecord.destroy();
    res.json({ success: true, message: 'Refund deleted successfully' });
  } catch (error) {
    next(error);
  }
};
