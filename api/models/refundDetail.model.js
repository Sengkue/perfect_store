import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RefundDetail = sequelize.define('refund_details', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  refund_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sale_detail_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity_refunded: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  refund_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  }
}, {
  indexes: [
    { fields: ['refund_id'] },
    { fields: ['sale_detail_id'] }
  ]
});

export default RefundDetail;
