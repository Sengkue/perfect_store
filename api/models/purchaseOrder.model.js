import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PurchaseOrder = sequelize.define('purchase_orders', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  po_number: {
    type: DataTypes.STRING(50),
    unique: true
  },
  user_id: {
    type: DataTypes.INTEGER
  },
  supplier_id: {
    type: DataTypes.INTEGER
  },
  order_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  expected_date: {
    type: DataTypes.DATEONLY
  },
  total_amount: {
    type: DataTypes.DECIMAL(12, 2)
  },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'approved', 'received', 'cancelled'),
    defaultValue: 'draft'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

export default PurchaseOrder;
