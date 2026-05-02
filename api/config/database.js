import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

let sequelize;

if (process.env.NODE_ENV === 'test') {
  sequelize = new Sequelize('sqlite::memory:', {
    logging: false,
    define: {
      underscored: true,
      freezeTableName: true,
      timestamps: false
    }
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        underscored: true,
        freezeTableName: true,
        timestamps: false
      }
    }
  );
}

export default sequelize;
