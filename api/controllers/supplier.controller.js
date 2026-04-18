import { Supplier } from '../models/index.js';
import { getPagination, getPaginatedResponse } from '../utils/helpers.js';
import { Op } from 'sequelize';

// GET /api/suppliers
export const getAll = async (req, res, next) => {
  try {
    const { limit, offset, page, pageSize } = getPagination(req.query);
    const where = {};

    if (req.query.search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${req.query.search}%` } },
        { contact_person: { [Op.like]: `%${req.query.search}%` } },
        { phone: { [Op.like]: `%${req.query.search}%` } }
      ];
    }

    const data = await Supplier.findAndCountAll({
      where,
      limit,
      offset,
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      ...getPaginatedResponse(data, page, pageSize)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/suppliers/:id
export const getById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    res.json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

// POST /api/suppliers
export const create = async (req, res, next) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/suppliers/:id
export const update = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    await supplier.update(req.body);
    res.json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/suppliers/:id
export const remove = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    await supplier.destroy();
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    next(error);
  }
};
