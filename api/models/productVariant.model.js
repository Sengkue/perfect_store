import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ProductVariant = sequelize.define('product_variants', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  color: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  size: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  variant_sku: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  quantity_in_stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  reorder_level: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  additional_price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  }
}, {
  indexes: [
    { fields: ['product_id'] },
    { fields: ['variant_sku'] }
  ]
});

export default ProductVariant;
