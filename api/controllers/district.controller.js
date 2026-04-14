import { District, Province } from '../models/index.js';
import { getPagination, getPaginatedResponse } from '../utils/helpers.js';

// GET /api/districts
export const getAll = async (req, res, next) => {
  try {
    const { limit, offset, page, pageSize } = getPagination(req.query);
    const where = {};

    if (req.query.province_id) {
      where.province_id = req.query.province_id;
    }

    const data = await District.findAndCountAll({
      where,
      limit,
      offset,
      order: [['district_name', 'ASC']],
      include: [{ model: Province, as: 'province' }]
    });

    res.json({
      success: true,
      ...getPaginatedResponse(data, page, pageSize)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/districts/:id
export const getById = async (req, res, next) => {
  try {
    const district = await District.findByPk(req.params.id, {
      include: [{ model: Province, as: 'province' }]
    });

    if (!district) {
      return res.status(404).json({ success: false, message: 'District not found' });
    }

    res.json({ success: true, data: district });
  } catch (error) {
    next(error);
  }
};

// POST /api/districts
export const create = async (req, res, next) => {
  try {
    const district = await District.create(req.body);
    res.status(201).json({
      success: true,
      message: 'District created successfully',
      data: district
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/districts/:id
export const update = async (req, res, next) => {
  try {
    const district = await District.findByPk(req.params.id);
    if (!district) {
      return res.status(404).json({ success: false, message: 'District not found' });
    }

    await district.update(req.body);
    res.json({
      success: true,
      message: 'District updated successfully',
      data: district
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/districts/:id
export const remove = async (req, res, next) => {
  try {
    const district = await District.findByPk(req.params.id);
    if (!district) {
      return res.status(404).json({ success: false, message: 'District not found' });
    }

    await district.destroy();
    res.json({ success: true, message: 'District deleted successfully' });
  } catch (error) {
    next(error);
  }
};
