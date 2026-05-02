import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Refund = sequelize.define('refunds', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sale_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  refund_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  refund_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  refund_status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed'),
    defaultValue: 'pending'
  }
}, {
  indexes: [
    { fields: ['sale_id'] },
    { fields: ['user_id'] },
    { fields: ['refund_status'] }
  ]
});

export default Refund;
