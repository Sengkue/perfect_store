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
    const { supplier_id, order_date, expected_date, notes, items } = req.body;

    let total_amount = 0;
    const detailRecords = (items || []).map(d => {
      const qty = Number(d.quantity_ordered || d.quantity || 0);
      const subtotal = qty * Number(d.unit_cost || 0);
      total_amount += subtotal;
      return {
        product_id: d.product_id,
        variant_id: d.variant_id || null,
        quantity_ordered: qty,
        unit_cost: d.unit_cost,
        subtotal
      };
    });

    const po_number = `PO-${Date.now()}`;
    const po = await PurchaseOrder.create({
      po_number,
      user_id: req.user ? req.user.id : null,
      supplier_id,
      order_date: order_date || new Date().toISOString().split('T')[0],
      expected_date,
      notes,
      total_amount,
      status: 'draft'
    }, { transaction: t });

    if (detailRecords.length > 0) {
      const detailsWithPoId = detailRecords.map(d => ({ ...d, po_id: po.id }));
      await PurchaseOrderDetail.bulkCreate(detailsWithPoId, { transaction: t });
    }

    await t.commit();

    // Reload with associations
    const result = await PurchaseOrder.findByPk(po.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: PurchaseOrderDetail, as: 'details', include: [{ model: Product, as: 'product' }] }
      ]
    });

    res.status(201).json({ success: true, message: 'Purchase Order created', data: result });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

export const update = async (req, res, next) => {
  const t = await PurchaseOrder.sequelize.transaction();
  try {
    const po = await PurchaseOrder.findByPk(req.params.id);
    if (!po) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    }

    const { status, supplier_id, order_date, expected_date, notes, items } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (supplier_id) updates.supplier_id = supplier_id;
    if (order_date) updates.order_date = order_date;
    if (expected_date) updates.expected_date = expected_date;
    if (notes !== undefined) updates.notes = notes;

    if (items && Array.isArray(items)) {
      // Re-calculate total
      let total_amount = 0;
      // Simple approach: delete and recreate details if they are sent
      await PurchaseOrderDetail.destroy({ where: { po_id: po.id }, transaction: t });
      
      const detailRecords = items.map(d => {
        const qty = Number(d.quantity_ordered || d.quantity || 0);
        const subtotal = qty * (d.unit_cost || 0);
        total_amount += subtotal;
        return {
          po_id: po.id,
          product_id: d.product_id,
          variant_id: d.variant_id || null,
          quantity_ordered: qty,
          unit_cost: d.unit_cost,
          subtotal
        };
      });
      await PurchaseOrderDetail.bulkCreate(detailRecords, { transaction: t });
      updates.total_amount = total_amount;
    }

    await po.update(updates, { transaction: t });
    await t.commit();

    const result = await PurchaseOrder.findByPk(po.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: PurchaseOrderDetail, as: 'details', include: [{ model: Product, as: 'product' }] }
      ]
    });

    res.json({ success: true, message: 'Purchase Order updated', data: result });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  return update(req, res, next);
};

export const remove = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findByPk(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'Purchase Order not found' });

    if (['received'].includes(po.status)) {
      return res.status(400).json({ success: false, message: 'Cannot delete a received order' });
    }

    await po.destroy();
    res.json({ success: true, message: 'Purchase Order deleted' });
  } catch (error) {
    next(error);
  }
};
