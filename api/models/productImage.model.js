import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ProductImage = sequelize.define('product_images', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  image_url: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  is_primary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  indexes: [
    { fields: ['product_id'] }
  ]
});

export default ProductImage;
