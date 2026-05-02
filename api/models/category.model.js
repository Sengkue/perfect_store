import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Category = sequelize.define('categories', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  category_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  indexes: [
    { fields: ['category_name'] }
  ]
});

export default Category;
