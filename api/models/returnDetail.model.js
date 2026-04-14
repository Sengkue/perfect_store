import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ReturnDetail = sequelize.define('return_details', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  return_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sale_detail_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity_returned: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  refund_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  }
});

export default ReturnDetail;
