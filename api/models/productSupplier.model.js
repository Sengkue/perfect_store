import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ProductSupplier = sequelize.define('product_suppliers', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  supplier_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  supplier_cost_price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  supplier_sku: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  is_primary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['product_id', 'supplier_id']
    },
    { fields: ['supplier_sku'] }
  ]
});

export default ProductSupplier;
