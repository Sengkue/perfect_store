import bcrypt from 'bcryptjs';
import { Customer, CustomerAddress } from '../models/index.js';
import { getPagination, getPaginatedResponse } from '../utils/helpers.js';
import { Op } from 'sequelize';

// GET /api/customers
export const getAll = async (req, res, next) => {
  try {
    const { limit, offset, page, pageSize } = getPagination(req.query);
    const where = {};

    if (req.query.search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${req.query.search}%` } },
        { last_name: { [Op.like]: `%${req.query.search}%` } },
        { phone: { [Op.like]: `%${req.query.search}%` } },
        { email: { [Op.like]: `%${req.query.search}%` } }
      ];
    }

    if (req.query.tier) {
      where.customer_tier = req.query.tier;
    }

    const data = await Customer.findAndCountAll({
      where,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: { exclude: ['password_hash'] }
    });

    res.json({
      success: true,
      ...getPaginatedResponse(data, page, pageSize)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/customers/:id
export const getById = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{
        model: CustomerAddress,
        model: CustomerAddress,
        as: 'addresses'
      }]
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

// POST /api/customers
export const create = async (req, res, next) => {
  try {
    const data = { ...req.body };

    // Hash password if provided
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password_hash = await bcrypt.hash(data.password, salt);
      delete data.password;
    }

    const customer = await Customer.create(data);
    const { password_hash, ...result } = customer.toJSON();

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/customers/:id
export const update = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const data = { ...req.body };
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password_hash = await bcrypt.hash(data.password, salt);
      delete data.password;
    }

    await customer.update(data);
    const { password_hash, ...result } = customer.toJSON();

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/customers/:id
export const remove = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    await customer.destroy();
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// --- Customer Addresses Sub-resource ---

// GET /api/customers/:id/addresses
export const getAddresses = async (req, res, next) => {
  try {
    const addresses = await CustomerAddress.findAll({
      where: { customer_id: req.params.id }
    });

    res.json({ success: true, data: addresses });
  } catch (error) {
    next(error);
  }
};

// POST /api/customers/:id/addresses
export const addAddress = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // If setting as default, unset other defaults first
    if (req.body.is_default) {
      await CustomerAddress.update(
        { is_default: false },
        { where: { customer_id: req.params.id } }
      );
    }

    const address = await CustomerAddress.create({
      ...req.body,
      customer_id: req.params.id
    });

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: address
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/customers/:customerId/addresses/:addressId
export const updateAddress = async (req, res, next) => {
  try {
    const address = await CustomerAddress.findOne({
      where: { id: req.params.addressId, customer_id: req.params.id }
    });

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    if (req.body.is_default) {
      await CustomerAddress.update(
        { is_default: false },
        { where: { customer_id: req.params.id } }
      );
    }

    await address.update(req.body);

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: address
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/customers/:customerId/addresses/:addressId
export const removeAddress = async (req, res, next) => {
  try {
    const address = await CustomerAddress.findOne({
      where: { id: req.params.addressId, customer_id: req.params.id }
    });

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    await address.destroy();
    res.json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    next(error);
  }
};
