import { sequelize } from './models/index.js';
import { Permission } from './models/index.js';

const defaultPermissions = [
  // Dashboard
  { name: 'dashboard.view',           display_name: 'View Dashboard',          module: 'Dashboard',      description: 'Access the main dashboard' },

  // POS
  { name: 'pos.access',               display_name: 'Access POS Terminal',     module: 'POS',            description: 'Open and use the POS terminal' },

  // Products
  { name: 'products.view',            display_name: 'View Products',           module: 'Products',       description: 'Browse products and variants' },
  { name: 'products.create',          display_name: 'Create Products',         module: 'Products',       description: 'Add new products to catalog' },
  { name: 'products.edit',            display_name: 'Edit Products',           module: 'Products',       description: 'Update product info and pricing' },
  { name: 'products.delete',          display_name: 'Delete Products',         module: 'Products',       description: 'Remove products from catalog' },

  // Categories
  { name: 'categories.view',          display_name: 'View Categories',         module: 'Categories',     description: 'Browse product categories' },
  { name: 'categories.manage',        display_name: 'Manage Categories',       module: 'Categories',     description: 'Create, edit, delete categories' },

  // Suppliers
  { name: 'suppliers.view',           display_name: 'View Suppliers',          module: 'Suppliers',      description: 'Browse supplier list' },
  { name: 'suppliers.manage',         display_name: 'Manage Suppliers',        module: 'Suppliers',      description: 'Create, edit, delete suppliers' },

  // Purchase Orders
  { name: 'purchase_orders.view',     display_name: 'View Purchase Orders',    module: 'Purchase Orders',description: 'View PO list and details' },
  { name: 'purchase_orders.create',   display_name: 'Create Purchase Orders',  module: 'Purchase Orders',description: 'Create new purchase orders' },
  { name: 'purchase_orders.approve',  display_name: 'Approve Purchase Orders', module: 'Purchase Orders',description: 'Change PO status/approve them' },

  // Stock Imports
  { name: 'imports.view',             display_name: 'View Stock Imports',      module: 'Imports',        description: 'View import/receiving records' },
  { name: 'imports.create',           display_name: 'Record Stock Import',     module: 'Imports',        description: 'Record new stock received' },
  { name: 'imports.complete',         display_name: 'Complete Imports',        module: 'Imports',        description: 'Mark import as completed (updates stock)' },

  // Sales
  { name: 'sales.view',               display_name: 'View Sales',              module: 'Sales',          description: 'Browse all sales records' },
  { name: 'sales.create',             display_name: 'Create Sales',            module: 'Sales',          description: 'Process new sale transactions' },
  { name: 'sales.delete',             display_name: 'Delete Sales',            module: 'Sales',          description: 'Remove pending sale records' },
  { name: 'sales.report',             display_name: 'View Sales Reports',      module: 'Sales',          description: 'Access revenue and sales analytics' },

  // Returns
  { name: 'returns.view',             display_name: 'View Returns',            module: 'Returns',        description: 'Browse return/refund records' },
  { name: 'returns.create',           display_name: 'Process Returns',         module: 'Returns',        description: 'Create return and refund transactions' },

  // Customers
  { name: 'customers.view',           display_name: 'View Customers',          module: 'Customers',      description: 'Browse customer list' },
  { name: 'customers.manage',         display_name: 'Manage Customers',        module: 'Customers',      description: 'Create, edit, delete customers' },

  // Users & Permissions (admin only)
  { name: 'users.view',               display_name: 'View Users',              module: 'Admin',          description: 'Browse user accounts' },
  { name: 'users.manage',             display_name: 'Manage Users',            module: 'Admin',          description: 'Create, edit, delete user accounts' },
  { name: 'permissions.manage',       display_name: 'Manage Permissions',      module: 'Admin',          description: 'Assign role and user permissions' },

  // Settings
  { name: 'settings.view',            display_name: 'View Settings',           module: 'Settings',       description: 'View store settings' },
  { name: 'settings.manage',          display_name: 'Manage Settings',         module: 'Settings',       description: 'Update store settings, tax rate, etc.' },
];

const seedPermissions = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    console.log('Seeding permissions...');
    let created = 0;
    let skipped = 0;

    for (const perm of defaultPermissions) {
      const [, wasCreated] = await Permission.findOrCreate({
        where: { name: perm.name },
        defaults: perm
      });
      if (wasCreated) created++;
      else skipped++;
    }

    console.log(`✅ Done! ${created} permissions created, ${skipped} already existed.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    process.exit(1);
  }
};

seedPermissions();
