import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SaleDetail = sequelize.define('sale_details', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sale_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  variant_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  discount_per_item: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  }
}, {
  indexes: [
    { fields: ['sale_id'] },
    { fields: ['product_id'] },
    { fields: ['variant_id'] }
  ]
});

export default SaleDetail;
