import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CustomerAddress = sequelize.define('customer_addresses', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  recipient_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  recipient_phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  detailed_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  address_type: {
    type: DataTypes.ENUM('home', 'work', 'other'),
    defaultValue: 'home'
  }
}, {
  indexes: [
    { fields: ['customer_id'] }
  ]
});

export default CustomerAddress;
