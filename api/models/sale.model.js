import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Sale = sequelize.define('sales', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sale_type: {
    type: DataTypes.ENUM('in_shop', 'online'),
    allowNull: false
  },
  sale_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  promotion_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  address_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  sale_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  shipping_fee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  total_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  payment_method: {
    type: DataTypes.ENUM('cash', 'credit_card', 'bank_transfer', 'cod', 'qr_payment', 'qr_code', 'card', 'credit'),
    allowNull: true
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded', 'partial'),
    defaultValue: 'pending'
  },
  sale_status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'cancelled', 'returned'),
    defaultValue: 'pending'
  },
  // Online-specific fields (NULL for in-shop)
  tracking_code: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  delivery_status: {
    type: DataTypes.ENUM('pending', 'packed', 'shipped', 'delivered', 'returned'),
    allowNull: true
  },
  courier_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  estimated_delivery: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  actual_delivery: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

export default Sale;
