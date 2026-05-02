import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserProfile, Permission, RolePermission, UserPermission } from '../models/index.js';

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({
      where: { username },
      include: [{ model: UserProfile, as: 'profile' }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact administrator.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    // Update last login
    await user.update({ last_login: new Date() });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          profile: user.profile,
          last_login: user.last_login
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;

    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      password_hash,
      role: role || 'staff'
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: UserProfile, as: 'profile' }]
    });

    // Resolve permissions
    let permissions = [];

    if (user.role === 'root') {
      // Root gets wildcard — superAdmin
      permissions = ['*'];
    } else {
      // Get all permission definitions
      const allPerms = await Permission.findAll();
      const permMap = {};
      for (const p of allPerms) {
        permMap[p.id] = p.name;
      }

      // Get role-level permissions
      const rolePerms = await RolePermission.findAll({
        where: { role: user.role }
      });

      // Build resolved map from role permissions
      const resolvedMap = {};
      for (const rp of rolePerms) {
        resolvedMap[rp.permission_id] = rp.is_allowed;
      }

      // Apply user-level overrides
      const userOverrides = await UserPermission.findAll({
        where: { user_id: user.id }
      });
      for (const up of userOverrides) {
        resolvedMap[up.permission_id] = up.is_allowed;
      }

      // Convert to permission name array (only allowed ones)
      for (const [permId, isAllowed] of Object.entries(resolvedMap)) {
        if (isAllowed && permMap[permId]) {
          permissions.push(permMap[permId]);
        }
      }
    }

    res.json({
      success: true,
      data: {
        ...user.toJSON(),
        permissions
      }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/change-password
export const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    const user = await User.findByPk(req.user.id);
    const isMatch = await bcrypt.compare(current_password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);

    await user.update({ password_hash });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};
