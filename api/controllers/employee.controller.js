import { Employee, Province, District, User } from '../models/index.js';
import { getPagination, getPaginatedResponse } from '../utils/helpers.js';
import { Op } from 'sequelize';

// GET /api/employees
export const getAll = async (req, res, next) => {
  try {
    const { limit, offset, page, pageSize } = getPagination(req.query);
    const where = {};

    // Search by name or phone
    if (req.query.search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${req.query.search}%` } },
        { last_name: { [Op.like]: `%${req.query.search}%` } },
        { phone: { [Op.like]: `%${req.query.search}%` } }
      ];
    }

    const data = await Employee.findAndCountAll({
      where,
      limit,
      offset,
      order: [['id', 'DESC']],
      include: [
        { model: Province, as: 'province' },
        { model: District, as: 'district' }
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

// GET /api/employees/:id
export const getById = async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [
        { model: Province, as: 'province' },
        { model: District, as: 'district' },
        { model: User, as: 'user', attributes: { exclude: ['password_hash'] } }
      ]
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

// POST /api/employees
export const create = async (req, res, next) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/employees/:id
export const update = async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    await employee.update(req.body);
    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/employees/:id
export const remove = async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    await employee.destroy();
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    next(error);
  }
};
