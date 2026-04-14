import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Province = sequelize.define('provinces', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  province_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  province_code: {
    type: DataTypes.STRING(10),
    allowNull: true
  }
});

export default Province;
