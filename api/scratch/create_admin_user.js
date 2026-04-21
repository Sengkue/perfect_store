import bcrypt from 'bcryptjs';
import { User, UserProfile, sequelize } from '../models/index.js';

const createAdmin = async () => {
  try {
    // 1. Authenticate and Sync
    console.log('Connecting to database...');
    await sequelize.authenticate();
    // Using sync() will create tables if they don't exist. 
    // Since the user said they deleted all data, this is safe and necessary.
    console.log('Syncing database schema...');
    await sequelize.sync();

    // 2. Define Admin Credentials
    const username = 'admin';
    const password = 'password123';
    
    console.log(`Checking if user "${username}" already exists...`);
    const existingUser = await User.findOne({ where: { username } });

    if (existingUser) {
      console.log(`User "${username}" already exists. Updating password...`);
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      await existingUser.update({ password_hash, role: 'admin', is_active: true });
      console.log(`User "${username}" updated successfully.`);
    } else {
      console.log(`Creating user "${username}"...`);
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      
      const user = await User.create({
        username,
        password_hash,
        role: 'admin',
        is_active: true
      });

      console.log(`Creating profile for user "${username}"...`);
      await UserProfile.create({
        user_id: user.id,
        first_name: 'System',
        last_name: 'Administrator',
        email: 'admin@perfectstore.com'
      });

      console.log(`User "${username}" and profile created successfully.`);
    }

    console.log('-----------------------------------');
    console.log('Login Credentials:');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log('-----------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();
