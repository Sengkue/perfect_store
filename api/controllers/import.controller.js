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
    if (req.query.purchase_order_id) where.purchase_order_id = req.query.purchase_order_id;

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

    const importRecord = await Import.create({
      ...importData,
      purchase_order_id: importData.purchase_order_id || null
    }, { transaction: t });

    // Update Purchase Order status to completed if this import is linked to one
    if (importData.purchase_order_id) {
      await PurchaseOrder.update(
        { status: 'received' },
        { 
          where: { id: importData.purchase_order_id }, 
          transaction: t 
        }
      );
    }

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

// PUT /api/imports/:id
export const update = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const importRecord = await Import.findByPk(req.params.id, {
      include: [{ model: ImportDetail, as: 'details' }]
    });

    if (!importRecord) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Import not found' });
    }

    const { status, payment_status, receive_date, invoice_number, notes } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (payment_status) updates.payment_status = payment_status;
    if (receive_date) updates.receive_date = receive_date;
    if (invoice_number) updates.invoice_number = invoice_number;
    if (notes !== undefined) updates.notes = notes;

    // If completing import, update stock levels
    if (status === 'completed' && importRecord.status !== 'completed') {
      for (const detail of importRecord.details) {
        let variantId = detail.variant_id;

        // If no variant specified, try to find or create a default one
        if (!variantId) {
          let [variant] = await ProductVariant.findOrCreate({
            where: { product_id: detail.product_id },
            defaults: { product_id: detail.product_id, color: 'Default', size: '' },
            transaction: t
          });
          variantId = variant.id;
        }

        if (variantId) {
          await ProductVariant.increment(
            'quantity_in_stock',
            { by: detail.quantity, where: { id: variantId }, transaction: t }
          );
        }
      }
    }

    await importRecord.update(updates, { transaction: t });
    await t.commit();

    // Reload with details
    const result = await Import.findByPk(importRecord.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: ImportDetail, as: 'details', include: [{ model: Product, as: 'product' }] }
      ]
    });

    res.json({
      success: true,
      message: 'Import updated successfully',
      data: result
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// PUT /api/imports/:id/status
export const updateStatus = async (req, res, next) => {
  // Keeping this for backward compatibility with frontend code
  // but logic is now in update.
  return update(req, res, next);
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
