const { User, Permission, RolePermission, UserPermission } = require('./models/index.js');

async function check() {
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
  for (const up of userOverrides) {
    const perm = await Permission.findByPk(up.permission_id);
    console.log(`  - ${perm ? perm.name : up.permission_id}: ${up.is_allowed ? 'ALLOW' : 'DENY'}`);
  }

  process.exit();
}

check();
