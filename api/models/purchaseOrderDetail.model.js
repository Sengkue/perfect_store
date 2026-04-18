import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PurchaseOrderDetail = sequelize.define('purchase_order_details', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  po_id: {
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
  quantity_ordered: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unit_cost: {
    type: DataTypes.DECIMAL(10, 2)
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2)
  }
}, {
  timestamps: false
});

export default PurchaseOrderDetail;
