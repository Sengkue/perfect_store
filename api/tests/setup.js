import { beforeAll, afterAll } from 'vitest';
import { sequelize } from '../models/index.js';

beforeAll(async () => {
  // Sync database before all tests
  await sequelize.sync({ force: true });
  console.log('Test database synchronized.');
});

afterAll(async () => {
  // Close connection after all tests
  await sequelize.close();
});
