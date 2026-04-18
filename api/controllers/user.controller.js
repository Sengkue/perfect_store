import bcrypt from 'bcryptjs';
import { User, UserProfile } from '../models/index.js';
import { getPagination, getPaginatedResponse } from '../utils/helpers.js';
import { Op } from 'sequelize';

// GET /api/users
export const getAll = async (req, res, next) => {
  try {
    const { limit, offset, page, pageSize } = getPagination(req.query);
    const where = {};

    if (req.query.role)      where.role      = req.query.role;
    if (req.query.is_active !== undefined) {
      where.is_active = req.query.is_active === 'true';
    }
    if (req.query.search) {
      where.username = { [Op.like]: `%${req.query.search}%` };
    }

    const data = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash'] },
      limit,
      offset,
      order: [['id', 'DESC']],
      include: [
        { model: UserProfile, as: 'profile', attributes: ['id', 'first_name', 'last_name', 'email', 'phone'] }
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

// GET /api/users/:id
export const getById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: UserProfile, as: 'profile' }]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// POST /api/users  (admin creates a user with a set password)
export const create = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Username already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      password_hash,
      role: role || 'staff',
      is_active:   true
    });

    const result = await User.findByPk(user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: UserProfile, as: 'profile', attributes: ['id', 'first_name', 'last_name'] }]
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id  (update role / is_active / employee link)
export const update = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { role, is_active } = req.body;

    const allowed = {};
    if (role !== undefined) allowed.role = role;
    if (is_active !== undefined) allowed.is_active = is_active;

    await user.update(allowed);

    const result = await User.findByPk(user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: UserProfile, as: 'profile', attributes: ['id', 'first_name', 'last_name'] }]
    });

    res.json({ success: true, message: 'User updated successfully', data: result });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id/reset-password
export const resetPassword = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);

    await user.update({ password_hash });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id
export const remove = async (req, res, next) => {
  try {
    // Prevent deleting yourself
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.destroy();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};
