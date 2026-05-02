import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ImportDetail = sequelize.define('import_details', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  import_id: {
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
  unit_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  }
}, {
  indexes: [
    { fields: ['import_id'] },
    { fields: ['product_id'] },
    { fields: ['variant_id'] }
  ]
});

export default ImportDetail;
