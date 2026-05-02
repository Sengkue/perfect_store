import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Promotion = sequelize.define('promotions', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  promo_code: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  discount_type: {
    type: DataTypes.ENUM('percentage', 'fixed_amount', 'buy_x_get_y'),
    allowNull: true
  },
  discount_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  min_purchase: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  usage_limit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },
  used_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  indexes: [
    { fields: ['promo_code'] },
    { fields: ['name'] }
  ]
});

export default Promotion;
