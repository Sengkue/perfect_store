import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserProfile = sequelize.define('user_profile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    unique: true
  },
  email: {
    type: DataTypes.STRING(100)
  },
  address: {
    type: DataTypes.TEXT
  },
  hire_date: {
    type: DataTypes.DATEONLY
  },
  salary: {
    type: DataTypes.DECIMAL(10, 2)
  },
  avatar_url: {
    type: DataTypes.TEXT
  }
}, {
  freezeTableName: true,
  timestamps: false,
  indexes: [
    { fields: ['user_id'] }
  ]
});

export default UserProfile;
