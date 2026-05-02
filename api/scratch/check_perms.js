import { User, Permission, RolePermission, UserPermission } from '../models/index.js';

async function check() {
  try {
    const adminUser = await User.findOne({ where: { username: 'admin' } });
    if (!adminUser) {
      console.log('Admin user not found');
      return;
    }
    console.log('User:', adminUser.username, 'Role:', adminUser.role);

    const rolePerms = await RolePermission.findAll({ where: { role: adminUser.role } });
    console.log('Role Permissions count:', rolePerms.length);

    const userOverrides = await UserPermission.findAll({ where: { user_id: adminUser.id } });
    console.log('User Overrides count:', userOverrides.length);
    
    const allPerms = await Permission.findAll();
    const permMap = {};
    allPerms.forEach(p => permMap[p.id] = p.name);

    for (const up of userOverrides) {
      const name = permMap[up.permission_id] || up.permission_id;
      console.log(`  - ${name}: ${up.is_allowed ? 'ALLOW' : 'DENY'}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
