import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const District = sequelize.define('districts', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  province_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  district_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  postal_code: {
    type: DataTypes.STRING(10),
    allowNull: true
  }
});

export default District;
