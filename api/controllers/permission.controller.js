import { Permission, RolePermission, UserPermission, User } from '../models/index.js';

export const getAllPermissions = async (req, res, next) => {
  try {
    const permissions = await Permission.findAll();
    res.json({ success: true, data: permissions });
  } catch (error) {
    next(error);
  }
};

export const getRolePermissions = async (req, res, next) => {
  try {
    const { role } = req.params;
    const perms = await RolePermission.findAll({
      where: { role },
      include: [{ model: Permission, as: 'permission' }]
    });
    res.json({ success: true, data: perms });
  } catch (error) {
    next(error);
  }
};

export const updateRolePermissions = async (req, res, next) => {
  try {
    const { role } = req.params;
    const { permissions } = req.body; // Array of { permission_id, is_allowed }
    
    // Destroy old, insert new (or update)
    await RolePermission.destroy({ where: { role } });
    
    const rolePerms = permissions.map(p => ({
      role,
      permission_id: p.permission_id,
      is_allowed: p.is_allowed
    }));
    await RolePermission.bulkCreate(rolePerms);
    
    res.json({ success: true, message: 'Role permissions updated' });
  } catch (error) {
    next(error);
  }
};

export const getUserPermissions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const perms = await UserPermission.findAll({
      where: { user_id: userId },
      include: [{ model: Permission, as: 'permission' }]
    });
    res.json({ success: true, data: perms });
  } catch (error) {
    next(error);
  }
};

export const updateUserPermissions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body; // Array of { permission_id, is_allowed }

    await UserPermission.destroy({ where: { user_id: userId } });

    const userPerms = permissions.map(p => ({
      user_id: userId,
      permission_id: p.permission_id,
      is_allowed: p.is_allowed,
      granted_by: req.user ? req.user.id : null
    }));
    await UserPermission.bulkCreate(userPerms);

    res.json({ success: true, message: 'User permissions updated' });
  } catch (error) {
    next(error);
  }
};
