import { Province, District } from '../models/index.js';
import { getPagination, getPaginatedResponse } from '../utils/helpers.js';

// GET /api/provinces
export const getAll = async (req, res, next) => {
  try {
    const { limit, offset, page, pageSize } = getPagination(req.query);

    const data = await Province.findAndCountAll({
      limit,
      offset,
      order: [['province_name', 'ASC']],
      include: req.query.include_districts === 'true'
        ? [{ model: District, as: 'districts' }]
        : []
    });

    res.json({
      success: true,
      ...getPaginatedResponse(data, page, pageSize)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/provinces/:id
export const getById = async (req, res, next) => {
  try {
    const province = await Province.findByPk(req.params.id, {
      include: [{ model: District, as: 'districts' }]
    });

    if (!province) {
      return res.status(404).json({ success: false, message: 'Province not found' });
    }

    res.json({ success: true, data: province });
  } catch (error) {
    next(error);
  }
};

// POST /api/provinces
export const create = async (req, res, next) => {
  try {
    const province = await Province.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Province created successfully',
      data: province
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/provinces/:id
export const update = async (req, res, next) => {
  try {
    const province = await Province.findByPk(req.params.id);
    if (!province) {
      return res.status(404).json({ success: false, message: 'Province not found' });
    }

    await province.update(req.body);
    res.json({
      success: true,
      message: 'Province updated successfully',
      data: province
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/provinces/:id
export const remove = async (req, res, next) => {
  try {
    const province = await Province.findByPk(req.params.id);
    if (!province) {
      return res.status(404).json({ success: false, message: 'Province not found' });
    }

    await province.destroy();
    res.json({ success: true, message: 'Province deleted successfully' });
  } catch (error) {
    next(error);
  }
};
