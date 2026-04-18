import { Import, ImportDetail, Product, ProductVariant, Supplier, User, PurchaseOrder } from '../models/index.js';
import { getPagination, getPaginatedResponse, generateInvoiceNumber } from '../utils/helpers.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

// GET /api/imports
export const getAll = async (req, res, next) => {
  try {
    const { limit, offset, page, pageSize } = getPagination(req.query);
    const where = {};

    if (req.query.status) where.status = req.query.status;
    if (req.query.payment_status) where.payment_status = req.query.payment_status;
    if (req.query.supplier_id) where.supplier_id = req.query.supplier_id;

    // Date range
    if (req.query.from_date || req.query.to_date) {
      where.receive_date = {};
      if (req.query.from_date) where.receive_date[Op.gte] = req.query.from_date;
      if (req.query.to_date) where.receive_date[Op.lte] = req.query.to_date;
    }

    const data = await Import.findAndCountAll({
      where,
      limit,
      offset,
      order: [['id', 'DESC']],
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'name'] },
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

// GET /api/imports/:id
export const getById = async (req, res, next) => {
  try {
    const importRecord = await Import.findByPk(req.params.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: User, as: 'user', attributes: ['id', 'username'] },
        { model: PurchaseOrder, as: 'purchase_order' },
        {
          model: ImportDetail,
          as: 'details',
          include: [
            { model: Product, as: 'product', attributes: ['id', 'name', 'barcode', 'sku'] },
            { model: ProductVariant, as: 'variant', attributes: ['id', 'color', 'size', 'variant_sku'] }
          ]
        }
      ]
    });

    if (!importRecord) {
      return res.status(404).json({ success: false, message: 'Import not found' });
    }

    res.json({ success: true, data: importRecord });
  } catch (error) {
    next(error);
  }
};

// POST /api/imports
export const create = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { items, ...importData } = req.body;

    // Generate invoice number if not provided
    if (!importData.invoice_number) {
      importData.invoice_number = generateInvoiceNumber();
    }

    // Set user from authenticated user
    if (req.user) {
      importData.user_id = req.user.id;
    }

    // Calculate total
    let totalAmount = 0;
    const detailsData = items.map(item => {
      const subtotal = (item.unit_cost || 0) * item.quantity;
      totalAmount += subtotal;
      return {
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        quantity: item.quantity,
        unit_cost: item.unit_cost || 0,
        subtotal
      };
    });

    importData.total_amount = totalAmount;

    const importRecord = await Import.create(importData, { transaction: t });

    // Create details
    const details = detailsData.map(d => ({ ...d, import_id: importRecord.id }));
    await ImportDetail.bulkCreate(details, { transaction: t });

    await t.commit();

    const result = await Import.findByPk(importRecord.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: ImportDetail, as: 'details', include: [{ model: Product, as: 'product' }] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Import created successfully',
      data: result
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// PUT /api/imports/:id/status
export const updateStatus = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const importRecord = await Import.findByPk(req.params.id, {
      include: [{ model: ImportDetail, as: 'details' }]
    });

    if (!importRecord) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Import not found' });
    }

    const { status } = req.body;

    // If completing import, update stock levels
    if (status === 'completed' && importRecord.status !== 'completed') {
      for (const detail of importRecord.details) {
        if (detail.variant_id) {
          await ProductVariant.increment(
            'quantity_in_stock',
            { by: detail.quantity, where: { id: detail.variant_id }, transaction: t }
          );
        }
      }
    }

    await importRecord.update({ status }, { transaction: t });
    await t.commit();

    res.json({
      success: true,
      message: `Import status updated to ${status}`,
      data: importRecord
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// DELETE /api/imports/:id
export const remove = async (req, res, next) => {
  try {
    const importRecord = await Import.findByPk(req.params.id);
    if (!importRecord) {
      return res.status(404).json({ success: false, message: 'Import not found' });
    }

    if (importRecord.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a completed import.'
      });
    }

    await importRecord.destroy();
    res.json({ success: true, message: 'Import deleted successfully' });
  } catch (error) {
    next(error);
  }
};
