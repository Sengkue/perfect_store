import { PurchaseOrder, PurchaseOrderDetail, Supplier, User, Product, ProductVariant } from '../models/index.js';
import { getPagination, getPaginatedResponse } from '../utils/helpers.js';
import { Op } from 'sequelize';

export const getAll = async (req, res, next) => {
  try {
    const { limit, offset, page, pageSize } = getPagination(req.query);
    const where = {};

    if (req.query.status) where.status = req.query.status;
    if (req.query.search) {
      where.po_number = { [Op.like]: `%${req.query.search}%` };
    }

    const data = await PurchaseOrder.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'name'] },
        { model: User, as: 'user', attributes: ['id', 'username'] }
      ]
    });

    res.json({ success: true, ...getPaginatedResponse(data, page, pageSize) });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findByPk(req.params.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: User, as: 'user', attributes: ['id', 'username'] },
        { 
          model: PurchaseOrderDetail, 
          as: 'details',
          include: [
            { model: Product, as: 'product' },
            { model: ProductVariant, as: 'variant' }
          ]
        }
      ]
    });

    if (!po) return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    res.json({ success: true, data: po });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  const t = await PurchaseOrder.sequelize.transaction();
  try {
    const { supplier_id, order_date, expected_date, notes, details } = req.body;

    const po_number = `PO-${Date.now()}`;
    let total_amount = 0;

    const po = await PurchaseOrder.create({
      po_number,
      user_id: req.user ? req.user.id : null,
      supplier_id,
      order_date,
      expected_date,
      notes,
      status: 'draft'
    }, { transaction: t });

    if (details && details.length > 0) {
      const detailRecords = details.map(d => {
        const subtotal = d.quantity_ordered * (d.unit_cost || 0);
        total_amount += subtotal;
        return {
          po_id: po.id,
          product_id: d.product_id,
          variant_id: d.variant_id || null,
          quantity_ordered: d.quantity_ordered,
          unit_cost: d.unit_cost,
          subtotal
        };
      });
      await PurchaseOrderDetail.bulkCreate(detailRecords, { transaction: t });
    }

    await po.update({ total_amount }, { transaction: t });
    await t.commit();

    res.status(201).json({ success: true, message: 'Purchase Order created', data: po });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findByPk(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'Purchase Order not found' });

    await po.update({ status: req.body.status });
    res.json({ success: true, message: 'Purchase Order status updated', data: po });
  } catch (error) {
    next(error);
  }
};
