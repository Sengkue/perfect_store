import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Permission = sequelize.define('permissions', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false
  },
  display_name: {
    type: DataTypes.STRING(100)
  },
  module: {
    type: DataTypes.STRING(50)
  },
  description: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: false
});

export default Permission;
