import { Permission, RolePermission, UserPermission } from '../models/index.js';

/**
 * Permission-based access control middleware.
 * Usage: permissionCheck('products.edit', 'products.delete')
 *
 * Resolution order:
 *   1. Root role → always allowed (superAdmin bypass)
 *   2. User-level override → takes priority
 *   3. Role-level permission → fallback
 *   4. Default → deny
 */
const permissionCheck = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      // Root bypasses everything
      if (req.user.role === 'root') {
        return next();
      }

      // Look up permission IDs for the required permission names
      const permRecords = await Permission.findAll({
        where: { name: requiredPermissions }
      });

      if (permRecords.length === 0) {
        // If the permission names don't exist in DB, deny by default
        return res.status(403).json({
          success: false,
          message: 'Unknown permission requested.'
        });
      }

      const permIds = permRecords.map(p => p.id);

      // Get user-level overrides
      const userOverrides = await UserPermission.findAll({
        where: {
          user_id: req.user.id,
          permission_id: permIds
        }
      });

      // Get role-level permissions
      const rolePerms = await RolePermission.findAll({
        where: {
          role: req.user.role,
          permission_id: permIds
        }
      });

      // Build resolution map: permission_id → allowed (user override > role > deny)
      const resolvedMap = {};

      // Start with role permissions
      for (const rp of rolePerms) {
        resolvedMap[rp.permission_id] = rp.is_allowed;
      }

      // Apply user overrides (takes priority)
      for (const up of userOverrides) {
        resolvedMap[up.permission_id] = up.is_allowed;
      }

      // Check that ALL required permissions are allowed
      const allAllowed = permIds.every(id => resolvedMap[id] === true);

      if (!allAllowed) {
        const denied = requiredPermissions.filter((name, i) => resolvedMap[permIds[i]] !== true);
        return res.status(403).json({
          success: false,
          message: `Access denied. Missing permission: ${denied.join(', ')}`
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default permissionCheck;
