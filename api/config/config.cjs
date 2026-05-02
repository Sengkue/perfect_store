const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql',
    define: {
      underscored: true,
      freezeTableName: true,
      timestamps: false
    }
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME_TEST || 'perfect_store_test',
    host: process.env.DB_HOST,
    dialect: 'sqlite',
    storage: ':memory:',
    define: {
      underscored: true,
      freezeTableName: true,
      timestamps: false
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
    define: {
      underscored: true,
      freezeTableName: true,
      timestamps: false
    }
  }
};
