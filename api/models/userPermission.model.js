import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserPermission = sequelize.define('user_permissions', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  permission_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  is_allowed: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  granted_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

export default UserPermission;
