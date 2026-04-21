import bcrypt from 'bcryptjs';
import { 
  User, UserProfile, Permission, ShopSetting, Category, 
  Supplier, Product, ProductVariant, Customer, CustomerAddress, 
  Promotion, sequelize 
} from './models/index.js';

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
  // Admin
  { name: 'users.view',               display_name: 'View Users',              module: 'Admin',          description: 'Browse user accounts' },
  { name: 'users.manage',             display_name: 'Manage Users',            module: 'Admin',          description: 'Create, edit, delete user accounts' },
  { name: 'permissions.manage',       display_name: 'Manage Permissions',      module: 'Admin',          description: 'Assign role and user permissions' },
  // Settings
  { name: 'settings.view',            display_name: 'View Settings',           module: 'Settings',       description: 'View store settings' },
  { name: 'settings.manage',          display_name: 'Manage Settings',         module: 'Settings',       description: 'Update store settings, tax rate, etc.' },
];

const seedDatabase = async () => {
  try {
    console.log('--- Database Seeding Started ---');
    await sequelize.authenticate();
    await sequelize.sync({ alter: true }); // Ensure schema is up to date
    console.log('✅ Database connected and synced.');

    // 1. Seed Shop Settings
    console.log('Seeding shop settings...');
    await ShopSetting.findOrCreate({
      where: { shop_name: 'Perfect Store' },
      defaults: {
        shop_name: 'Perfect Store',
        phone: '020-12345678',
        email: 'contact@perfectstore.com',
        address: '123 Main St, Vientiane, Laos',
        tax_number: 'TX-123456-LAO',
        tax_rate: 10.00
      }
    });

    // 2. Seed Permissions
    console.log('Seeding permissions...');
    for (const perm of defaultPermissions) {
      await Permission.findOrCreate({
        where: { name: perm.name },
        defaults: perm
      });
    }

    // 3. Seed Users & Profiles
    console.log('Seeding users...');
    const salt = await bcrypt.genSalt(10);
    const usersData = [
      { username: 'admin', password: 'admin123', role: 'admin', firstName: 'System', lastName: 'Admin' },
      { username: 'manager', password: 'manager123', role: 'manager', firstName: 'Ken', lastName: 'Manager' },
      { username: 'staff1', password: 'staff123', role: 'staff', firstName: 'Lina', lastName: 'Cashier' }
    ];

    for (const u of usersData) {
      const [user, created] = await User.findOrCreate({
        where: { username: u.username },
        defaults: {
          username: u.username,
          password_hash: await bcrypt.hash(u.password, salt),
          role: u.role,
          is_active: true
        }
      });
      if (created) {
        await UserProfile.create({
          user_id: user.id,
          first_name: u.firstName,
          last_name: u.lastName,
          email: `${u.username}@perfectstore.com`,
          phone: `020-999${Math.floor(Math.random() * 10000)}`
        });
      }
    }

    // 4. Seed Categories (Hierarchical)
    console.log('Seeding categories...');
    const mainCategories = [
      { name: 'Drinks', slug: 'drinks', description: 'Beverages and water' },
      { name: 'Food', slug: 'food', description: 'Snacks, groceries and food items' },
      { name: 'Electronics', slug: 'electronics', description: 'Gadgets and devices' },
      { name: 'Clothing', slug: 'clothing', description: 'Apparel and accessories' }
    ];

    for (const cat of mainCategories) {
      const [category] = await Category.findOrCreate({
        where: { slug: cat.slug },
        defaults: {
          category_name: cat.name,
          slug: cat.slug,
          description: cat.description
        }
      });

      // Add sub-categories
      if (cat.slug === 'drinks') {
        const subDrinks = [
          { name: 'Soft Drinks', slug: 'soft-drinks', parent_id: category.id },
          { name: 'Mineral Water', slug: 'mineral-water', parent_id: category.id },
          { name: 'Coffee & Tea', slug: 'coffee-tea', parent_id: category.id }
        ];
        for (const sub of subDrinks) {
          await Category.findOrCreate({ where: { slug: sub.slug }, defaults: { category_name: sub.name, slug: sub.slug, parent_id: sub.parent_id } });
        }
      } else if (cat.slug === 'food') {
        const subFood = [
          { name: 'Snacks', slug: 'snacks', parent_id: category.id },
          { name: 'Instant Noodles', slug: 'instant-noodles', parent_id: category.id }
        ];
        for (const sub of subFood) {
          await Category.findOrCreate({ where: { slug: sub.slug }, defaults: { category_name: sub.name, slug: sub.slug, parent_id: sub.parent_id } });
        }
      }
    }

    // 5. Seed Suppliers
    console.log('Seeding suppliers...');
    const suppliers = [
      { name: 'Lao Coca-Cola Bottling', contact_person: 'Mr. Coke', phone: '021-111222', email: 'sales@cocacola.la' },
      { name: 'Beerlao Company', contact_person: 'Mr. Beer', phone: '021-333444', email: 'info@beerlao.la' },
      { name: 'P&G Distribution', contact_person: 'Ms. Proctor', phone: '021-555666', email: 'distro@pg.com' },
      { name: 'Samsung Electronics Laos', contact_person: 'Mr. Sam', phone: '021-777888', email: 'support@samsung.la' }
    ];

    for (const sup of suppliers) {
      await Supplier.findOrCreate({
        where: { name: sup.name },
        defaults: sup
      });
    }

    // 6. Seed Products & Variants
    console.log('Seeding products...');
    
    const softDrinksCat = await Category.findOne({ where: { slug: 'soft-drinks' } });
    const waterCat = await Category.findOne({ where: { slug: 'mineral-water' } });
    const snackCat = await Category.findOne({ where: { slug: 'snacks' } });
    const electronicsCat = await Category.findOne({ where: { slug: 'electronics' } });
    
    const cokeSup = await Supplier.findOne({ where: { name: 'Lao Coca-Cola Bottling' } });
    const waterSup = await Supplier.findOne({ where: { name: 'Beerlao Company' } }); // Beerlao makes Tiger Head
    const electronicsSup = await Supplier.findOne({ where: { name: 'Samsung Electronics Laos' } });

    const products = [
      {
        name: 'Coca Cola 325ml',
        barcode: '8850999011015',
        sku: 'DRK-COKE-325',
        description: 'Refreshing carbonated soft drink.',
        cost_price: 3500.00,
        selling_price: 5000.00,
        category_id: softDrinksCat?.id,
        primary_supplier_id: cokeSup?.id,
        is_active: true
      },
      {
        name: 'Tiger Head Water 550ml',
        barcode: '8850999022028',
        sku: 'DRK-WATER-550',
        description: 'Pure drinking water.',
        cost_price: 1500.00,
        selling_price: 3000.00,
        category_id: waterCat?.id,
        primary_supplier_id: waterSup?.id,
        is_active: true
      },
      {
        name: 'Lay\'s Classic XL',
        barcode: '8850999033031',
        sku: 'FOD-LAYS-XL',
        description: 'Potato chips classic flavor.',
        cost_price: 8000.00,
        selling_price: 12000.00,
        category_id: snackCat?.id,
        is_active: true
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        barcode: '8806095300000',
        sku: 'ELE-S24U-256',
        description: 'Latest high-end smartphone from Samsung.',
        cost_price: 12000000.00,
        selling_price: 15500000.00,
        category_id: electronicsCat?.id,
        primary_supplier_id: electronicsSup?.id,
        is_active: true
      }
    ];

    for (const prod of products) {
      const [productRecord, created] = await Product.findOrCreate({
        where: { sku: prod.sku },
        defaults: prod
      });

      if (created) {
        // Create a default variant if none specified
        await ProductVariant.create({
          product_id: productRecord.id,
          variant_sku: `${prod.sku}-DEF`,
          color: 'Standard',
          size: 'Regular',
          quantity_in_stock: 100,
          reorder_level: 10,
          additional_price: 0
        });
        
        // Add specific variants for phone
        if (prod.sku === 'ELE-S24U-256') {
          await ProductVariant.create({
            product_id: productRecord.id,
            variant_sku: `${prod.sku}-GRAY`,
            color: 'Titanium Gray',
            size: '512GB',
            quantity_in_stock: 5,
            reorder_level: 2,
            additional_price: 1500000.00
          });
        }
      }
    }

    // 7. Seed Customers
    console.log('Seeding customers...');
    const customerData = [
      { first_name: 'Somchai', last_name: 'Sivilay', phone: '020-55511122', email: 'somchai@gmail.com' },
      { first_name: 'Keo', last_name: 'Phimmasone', phone: '020-55533344', email: 'keo.p@outlook.com' }
    ];

    for (const cust of customerData) {
      const [customer, created] = await Customer.findOrCreate({
        where: { phone: cust.phone },
        defaults: cust
      });
      if (created) {
        await CustomerAddress.create({
          customer_id: customer.id,
          recipient_name: `${cust.first_name} ${cust.last_name}`,
          recipient_phone: cust.phone,
          detailed_address: 'Sikhottabong District, Vientiane, Laos',
          is_default: true,
          address_type: 'home'
        });
      }
    }

    // 8. Seed Promotions
    console.log('Seeding promotions...');
    await Promotion.findOrCreate({
      where: { name: 'Grand Opening Discount' },
      defaults: {
        name: 'Grand Opening Discount',
        description: '10% off on all items for the opening month',
        discount_type: 'percentage',
        discount_value: 10.00,
        start_date: new Date(),
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        is_active: true
      }
    });

    console.log('-------------------------------------------');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('Credentials:');
    console.log('- Admin: admin / admin123');
    console.log('- Manager: manager / manager123');
    console.log('- Staff: staff1 / staff123');
    console.log('-------------------------------------------');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
