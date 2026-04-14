import { Return, ReturnDetail, Sale, SaleDetail, Product, ProductVariant, Employee } from '../models/index.js';
import { getPagination, getPaginatedResponse } from '../utils/helpers.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

// GET /api/returns
export const getAll = async (req, res, next) => {
  try {
    const { limit, offset, page, pageSize } = getPagination(req.query);
    const where = {};

    if (req.query.return_status) where.return_status = req.query.return_status;
    if (req.query.sale_id) where.sale_id = req.query.sale_id;

    const data = await Return.findAndCountAll({
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
          model: Employee,
          as: 'employee',
          attributes: ['id', 'first_name', 'last_name']
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

// GET /api/returns/:id
export const getById = async (req, res, next) => {
  try {
    const returnRecord = await Return.findByPk(req.params.id, {
      include: [
        { model: Sale, as: 'sale' },
        { model: Employee, as: 'employee' },
        {
          model: ReturnDetail,
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

    if (!returnRecord) {
      return res.status(404).json({ success: false, message: 'Return not found' });
    }

    res.json({ success: true, data: returnRecord });
  } catch (error) {
    next(error);
  }
};

// POST /api/returns
export const create = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { items, ...returnData } = req.body;

    // Verify sale exists
    const sale = await Sale.findByPk(returnData.sale_id);
    if (!sale) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    // Set employee from auth
    if (req.user && req.user.employee) {
      returnData.employee_id = req.user.employee.id;
    }

    // Calculate total refund
    let totalRefund = 0;
    const detailsData = items.map(item => {
      totalRefund += parseFloat(item.refund_amount) || 0;
      return {
        sale_detail_id: item.sale_detail_id,
        quantity_returned: item.quantity_returned,
        refund_amount: item.refund_amount || 0
      };
    });

    returnData.refund_amount = totalRefund;

    const returnRecord = await Return.create(returnData, { transaction: t });

    // Create return details
    const details = detailsData.map(d => ({ ...d, return_id: returnRecord.id }));
    await ReturnDetail.bulkCreate(details, { transaction: t });

    await t.commit();

    const result = await Return.findByPk(returnRecord.id, {
      include: [
        { model: Sale, as: 'sale', attributes: ['id', 'sale_number'] },
        { model: ReturnDetail, as: 'details' }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Return created successfully',
      data: result
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// PUT /api/returns/:id/status
export const updateStatus = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const returnRecord = await Return.findByPk(req.params.id, {
      include: [{
        model: ReturnDetail,
        as: 'details',
        include: [{
          model: SaleDetail,
          as: 'saleDetail'
        }]
      }]
    });

    if (!returnRecord) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Return not found' });
    }

    const { return_status } = req.body;

    // If completing return, restore stock
    if (return_status === 'completed' && returnRecord.return_status !== 'completed') {
      for (const detail of returnRecord.details) {
        if (detail.saleDetail && detail.saleDetail.variant_id) {
          await ProductVariant.increment(
            'quantity_in_stock',
            {
              by: detail.quantity_returned,
              where: { id: detail.saleDetail.variant_id },
              transaction: t
            }
          );
        }
      }

      // Update sale status
      await Sale.update(
        { sale_status: 'returned' },
        { where: { id: returnRecord.sale_id }, transaction: t }
      );
    }

    await returnRecord.update({ return_status }, { transaction: t });
    await t.commit();

    res.json({
      success: true,
      message: `Return status updated to ${return_status}`,
      data: returnRecord
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// DELETE /api/returns/:id
export const remove = async (req, res, next) => {
  try {
    const returnRecord = await Return.findByPk(req.params.id);
    if (!returnRecord) {
      return res.status(404).json({ success: false, message: 'Return not found' });
    }

    if (returnRecord.return_status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a completed return.'
      });
    }

    await returnRecord.destroy();
    res.json({ success: true, message: 'Return deleted successfully' });
  } catch (error) {
    next(error);
  }
};
