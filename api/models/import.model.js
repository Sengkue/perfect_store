import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Import = sequelize.define('imports', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  purchase_order_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  supplier_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  invoice_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  receive_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  total_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'partial', 'paid'),
    defaultValue: 'pending'
  },
  status: {
    type: DataTypes.ENUM('draft', 'received', 'completed', 'cancelled'),
    defaultValue: 'draft'
  }
});

export default Import;
