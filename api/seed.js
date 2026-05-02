import bcrypt from 'bcryptjs';
import {
  User, UserProfile, Permission, RolePermission, ShopSetting, Category,
  Supplier, Product, ProductVariant, Customer, CustomerAddress,
  Promotion, sequelize
} from './models/index.js';

const defaultPermissions = [
  // Dashboard
  { name: 'dashboard.view', display_name: 'ເບິ່ງແຜງຄວບຄຸມ', module: 'Dashboard', description: 'ເຂົ້າເບິ່ງແຜງຄວບຄຸມຫຼັກ' },
  // POS
  { name: 'pos.access', display_name: 'ເຂົ້າໃຊ້ງານລະບົບຂາຍ (POS)', module: 'POS', description: 'ເປີດ ແລະ ໃຊ້ງານເຄື່ອງຂາຍສິນຄ້າ (POS)' },
  // Products
  { name: 'products.view', display_name: 'ເບິ່ງລາຍການສິນຄ້າ', module: 'Products', description: 'ເບິ່ງລາຍການສິນຄ້າ ແລະ ຊະນິດສິນຄ້າ' },
  { name: 'products.create', display_name: 'ເພີ່ມສິນຄ້າໃໝ່', module: 'Products', description: 'ເພີ່ມສິນຄ້າໃໝ່ເຂົ້າໃນລະບົບ' },
  { name: 'products.edit', display_name: 'ແກ້ໄຂຂໍ້ມູນສິນຄ້າ', module: 'Products', description: 'ອັບເດດຂໍ້ມູນສິນຄ້າ ແລະ ລາຄາ' },
  { name: 'products.delete', display_name: 'ລຶບສິນຄ້າ', module: 'Products', description: 'ລຶບບັນຊີສິນຄ້າອອກຈາກລະບົບ' },
  // Categories
  { name: 'categories.view', display_name: 'ເບິ່ງໝວດໝູ່', module: 'Categories', description: 'ເບິ່ງລາຍການໝວດໝູ່ສິນຄ້າ' },
  { name: 'categories.manage', display_name: 'ຈັດການໝວດໝູ່', module: 'Categories', description: 'ສ້າງ, ແກ້ໄຂ, ແລະ ລຶບໝວດໝູ່' },
  // Suppliers
  { name: 'suppliers.view', display_name: 'ເບິ່ງຜູ້ສະໜອງ', module: 'Suppliers', description: 'ເບິ່ງລາຍຊື່ຜູ້ສະໜອງ' },
  { name: 'suppliers.manage', display_name: 'ຈັດການຜູ້ສະໜອງ', module: 'Suppliers', description: 'ສ້າງ, ແກ້ໄຂ, ແລະ ລຶບຜູ້ສະໜອງ' },
  // Purchase Orders
  { name: 'purchase_orders.view', display_name: 'ເບິ່ງໃບສັ່ງຊື້', module: 'Purchase Orders', description: 'ເບິ່ງລາຍການໃບສັ່ງຊື້ ແລະ ລາຍລະອຽດ' },
  { name: 'purchase_orders.create', display_name: 'ສ້າງໃບສັ່ງຊື້', module: 'Purchase Orders', description: 'ສ້າງໃບສັ່ງຊື້ສິນຄ້າໃໝ່' },
  { name: 'purchase_orders.approve', display_name: 'ອະນຸມັດໃບສັ່ງຊື້', module: 'Purchase Orders', description: 'ອະນຸມັດ ຫຼື ປ່ຽນສະຖານະໃບສັ່ງຊື້' },
  // Stock Imports
  { name: 'imports.view', display_name: 'ເບິ່ງການນຳເຂົ້າສິນຄ້າ', module: 'Imports', description: 'ເບິ່ງປະຫວັດການນຳເຂົ້າສິນຄ້າ' },
  { name: 'imports.create', display_name: 'ບັນທຶກການນຳເຂົ້າ', module: 'Imports', description: 'ບັນທຶກການຮັບສິນຄ້າໃໝ່ເຂົ້າສາງ' },
  { name: 'imports.complete', display_name: 'ຢືນຢັນການນຳເຂົ້າ', module: 'Imports', description: 'ຢືນຢັນການນຳເຂົ້າສຳເລັດ (ຈະອັບເດດສະຕັອກ)' },
  // Sales
  { name: 'sales.view', display_name: 'ເບິ່ງການຂາຍ', module: 'Sales', description: 'ເບິ່ງປະຫວັດການຂາຍທັງໝົດ' },
  { name: 'sales.create', display_name: 'ເຮັດການຂາຍ', module: 'Sales', description: 'ດຳເນີນການຂາຍສິນຄ້າ (POS)' },
  { name: 'sales.delete', display_name: 'ລຶບລາຍການຂາຍ', module: 'Sales', description: 'ລຶບບັນທຶກການຂາຍທີ່ຍັງບໍ່ທຳສຳເລັດ' },
  { name: 'sales.report', display_name: 'ເບິ່ງລາຍງານການຂາຍ', module: 'Sales', description: 'ເບິ່ງລາຍງານລາຍຮັບ ແລະ ວິເຄາະການຂາຍ' },
  // Refunds
  { name: 'refunds.view', display_name: 'ເບິ່ງການຄືນສິນຄ້າ', module: 'Refunds', description: 'ເບິ່ງລາຍການຄືນສິນຄ້າ ແລະ ສົ່ງເງິນຄືນ' },
  { name: 'refunds.create', display_name: 'ດຳເນີນການຄືນສິນຄ້າ', module: 'Refunds', description: 'ສ້າງລາຍການຄືນສິນຄ້າ ແລະ ຄືນເງິນ' },
  // Customers
  { name: 'customers.view', display_name: 'ເບິ່ງລູກຄ້າ', module: 'Customers', description: 'ເບິ່ງລາຍຊື່ລູກຄ້າທັງໝົດ' },
  { name: 'customers.manage', display_name: 'ຈັດການລູກຄ້າ', module: 'Customers', description: 'ສ້າງ, ແກ້ໄຂ, ແລະ ລຶບຂໍ້ມູນລູກຄ້າ' },
  // Admin
  { name: 'users.view', display_name: 'ເບິ່ງຜູ້ໃຊ້ງານ', module: 'Admin', description: 'ເບິ່ງບັນຊີຜູ້ໃຊ້ງານໃນລະບົບ' },
  { name: 'users.manage', display_name: 'ຈັດການຜູ້ໃຊ້ງານ', module: 'Admin', description: 'ສ້າງ, ແກ້ໄຂ, ແລະ ລຶບຜູ້ໃຊ້ງານ' },
  { name: 'permissions.manage', display_name: 'ຈັດການສິດການໃຊ້ງານ', module: 'Admin', description: 'ກຳນົດສິດການໃຊ້ງານໃຫ້ແຕ່ລະຕຳແໜ່ງ' },
  // Settings
  { name: 'settings.view', display_name: 'ເບິ່ງການຕັ້ງຄ່າ', module: 'Settings', description: 'ເບິ່ງການຕັ້ງຄ່າຂອງຮ້ານ' },
  { name: 'settings.manage', display_name: 'ຈັດການການຕັ້ງຄ່າ', module: 'Settings', description: 'ອັບເດດການຕັ້ງຄ່າຮ້ານ, ອັດຕາອາກອນ, ແລະ ອື່ນໆ' },
];

// ── Default Role Permissions ─────────────────────────────
// All permission names that each role gets by default
const roleDefaults = {
  admin: defaultPermissions.map(p => p.name), // Admin gets ALL permissions
  manager: [
    'dashboard.view',
    'pos.access',
    'products.view', 'products.create', 'products.edit',
    'categories.view', 'categories.manage',
    'suppliers.view', 'suppliers.manage',
    'purchase_orders.view', 'purchase_orders.create', 'purchase_orders.approve',
    'imports.view', 'imports.create', 'imports.complete',
    'sales.view', 'sales.create', 'sales.report',
    'refunds.view', 'refunds.create',
    'customers.view', 'customers.manage',
  ],
  staff: [
    'dashboard.view',
    'pos.access',
    'sales.view', 'sales.create',
    'refunds.view',
    'customers.view',
  ]
};


const seedDatabase = async () => {
  try {
    console.log('--- Database Seeding Started ---');
    await sequelize.authenticate();
    await sequelize.sync({ alter: true }); // Ensure schema is up to date
    console.log('✅ Database connected and synced.');

    // 1. Seed Shop Settings
    console.log('Seeding shop settings...');
    await ShopSetting.findOrCreate({
      where: { shop_name: 'ຮ້ານ ເພີເຟັກ ສະໂຕຣ' },
      defaults: {
        shop_name: 'ຮ້ານ ເພີເຟັກ ສະໂຕຣ',
        phone: '020-12345678',
        email: 'contact@perfectstore.com',
        address: 'ເຮືອນເລກທີ 123, ຖະໜົນລ້ານຊ້າງ, ນະຄອນຫຼວງວຽງຈັນ, ລາວ',
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
      { username: 'root', password: 'root123', role: 'root', firstName: 'Root', lastName: 'SuperAdmin' },
      { username: 'admin', password: 'admin123', role: 'admin', firstName: 'ຜູ້ດູແລ', lastName: 'ລະບົບ' },
      { username: 'manager', password: 'manager123', role: 'manager', firstName: 'ສົມຫັວງ', lastName: 'ຜູ້ຈັດການ' },
      { username: 'staff1', password: 'staff123', role: 'staff', firstName: 'ຈັນທາ', lastName: 'ພະນັກງານຂາຍ' }
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

    // 4. Seed Role Permissions
    console.log('Seeding role permissions...');
    const allPerms = await Permission.findAll();
    const permNameToId = {};
    for (const p of allPerms) {
      permNameToId[p.name] = p.id;
    }

    for (const [role, permNames] of Object.entries(roleDefaults)) {
      for (const permName of permNames) {
        const permId = permNameToId[permName];
        if (permId) {
          await RolePermission.findOrCreate({
            where: { role, permission_id: permId },
            defaults: { role, permission_id: permId, is_allowed: true }
          });
        }
      }
    }

    // 5. Seed Categories (Hierarchical)
    console.log('Seeding categories...');
    const mainCategories = [
      { name: 'ເຄື່ອງດື່ມ', slug: 'drinks', description: 'ນ້ຳດື່ມ ແລະ ເຄື່ອງດື່ມຕ່າງໆ' },
      { name: 'ອາຫານ', slug: 'food', description: 'ອາຫານວ່າງ, ເຄື່ອງແຫ້ງ ແລະ ອາຫານຕ່າງໆ' },
      { name: 'ເຄື່ອງເອເລັກໂຕຣນິກ', slug: 'electronics', description: 'ອຸປະກອນໄຟຟ້າ ແລະ ເອເລັກໂຕຣນິກ' },
      { name: 'ເຄື່ອງນຸ່ງຫົ່ມ', slug: 'clothing', description: 'ເສື້ອຜ້າ ແລະ ອຸປະກອນຕົບແຕ່ງ' }
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
          { name: 'ນ້ຳຫວານ/ນ້ຳອັດລົມ', slug: 'soft-drinks', parent_id: category.id },
          { name: 'ນ້ຳດື່ມບໍລິສຸດ', slug: 'mineral-water', parent_id: category.id },
          { name: 'ກາເຟ ແລະ ຊາ', slug: 'coffee-tea', parent_id: category.id }
        ];
        for (const sub of subDrinks) {
          await Category.findOrCreate({ where: { slug: sub.slug }, defaults: { category_name: sub.name, slug: sub.slug, parent_id: sub.parent_id } });
        }
      } else if (cat.slug === 'food') {
        const subFood = [
          { name: 'ເຂົ້າໜົມ', slug: 'snacks', parent_id: category.id },
          { name: 'ໝີ່ສຳເລັດຮູບ', slug: 'instant-noodles', parent_id: category.id }
        ];
        for (const sub of subFood) {
          await Category.findOrCreate({ where: { slug: sub.slug }, defaults: { category_name: sub.name, slug: sub.slug, parent_id: sub.parent_id } });
        }
      }
    }

    // 6. Seed Suppliers
    console.log('Seeding suppliers...');
    const suppliers = [
      { name: 'ບໍລິສັດ ບັດເຕີລິງ ລາວ (ໂຄຄາ-ໂຄລາ)', contact_person: 'ທ່ານ ໂຄຄາ', phone: '021-111222', email: 'sales@cocacola.la' },
      { name: 'ບໍລິສັດ ເບຍລາວ ຈຳກັດ', contact_person: 'ທ່ານ ເບຍລາວ', phone: '021-333444', email: 'info@beerlao.la' },
      { name: 'ຕົວແທນຈຳໜ່າຍ P&G', contact_person: 'ທ່ານນາງ ພຣັອກເຕີ', phone: '021-555666', email: 'distro@pg.com' },
      { name: 'ຊຳຊຸງ ເອເລັກໂຕຣນິກ ລາວ', contact_person: 'ທ່ານ ຊຳຊຸງ', phone: '021-777888', email: 'support@samsung.la' }
    ];

    for (const sup of suppliers) {
      await Supplier.findOrCreate({
        where: { name: sup.name },
        defaults: sup
      });
    }

    // 7. Seed Products & Variants
    console.log('Seeding products...');

    const softDrinksCat = await Category.findOne({ where: { slug: 'soft-drinks' } });
    const waterCat = await Category.findOne({ where: { slug: 'mineral-water' } });
    const snackCat = await Category.findOne({ where: { slug: 'snacks' } });
    const electronicsCat = await Category.findOne({ where: { slug: 'electronics' } });

    const cokeSup = await Supplier.findOne({ where: { name: 'ບໍລິສັດ ບັດເຕີລິງ ລາວ (ໂຄຄາ-ໂຄລາ)' } });
    const waterSup = await Supplier.findOne({ where: { name: 'ບໍລິສັດ ເບຍລາວ ຈຳກັດ' } }); // Beerlao makes Tiger Head
    const electronicsSup = await Supplier.findOne({ where: { name: 'ຊຳຊຸງ ເອເລັກໂຕຣນິກ ລາວ' } });

    const products = [
      {
        name: 'ໂຄຄາ ໂຄລາ 325ມລ',
        barcode: '8850999011015',
        sku: 'DRK-COKE-325',
        description: 'ເຄື່ອງດື່ມນ້ຳອັດລົມ ສົດຊື່ນ',
        cost_price: 3500.00,
        selling_price: 5000.00,
        category_id: softDrinksCat?.id,
        primary_supplier_id: cokeSup?.id,
        is_active: true
      },
      {
        name: 'ນ້ຳດື່ມ ຫົວເສືອ 550ມລ',
        barcode: '8850999022028',
        sku: 'DRK-WATER-550',
        description: 'ນ້ຳດື່ມບໍລິສຸດ',
        cost_price: 1500.00,
        selling_price: 3000.00,
        category_id: waterCat?.id,
        primary_supplier_id: waterSup?.id,
        is_active: true
      },
      {
        name: 'ມັນຝຣັ່ງທອດ ເລ (Lay\'s) ຣົດດັ້ງເດີມ XL',
        barcode: '8850999033031',
        sku: 'FOD-LAYS-XL',
        description: 'ມັນຝຣັ່ງທອດກອບ ຣົດດັ້ງເດີມ',
        cost_price: 8000.00,
        selling_price: 12000.00,
        category_id: snackCat?.id,
        is_active: true
      },
      {
        name: 'ຊຳຊຸງ ກາແລັກຊີ S24 ອັລຕຣາ',
        barcode: '8806095300000',
        sku: 'ELE-S24U-256',
        description: 'ໂທລະສັບສະມາດໂຟນລຸ້ນໃໝ່ຫຼ້າສຸດຈາກ ຊຳຊຸງ',
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
          color: 'ມາດຕະຖານ',
          size: 'ທົ່ວໄປ',
          quantity_in_stock: 100,
          reorder_level: 10,
          additional_price: 0
        });

        // Add specific variants for phone
        if (prod.sku === 'ELE-S24U-256') {
          await ProductVariant.create({
            product_id: productRecord.id,
            variant_sku: `${prod.sku}-GRAY`,
            color: 'ສີເງິນ/ເທົາ (Titanium Gray)',
            size: '512GB',
            quantity_in_stock: 5,
            reorder_level: 2,
            additional_price: 1500000.00
          });
        }
      }
    }

    // 8. Seed Customers
    console.log('Seeding customers...');
    const customerData = [
      { first_name: 'ສົມໄຊ', last_name: 'ສີວິໄລ', phone: '020-55511122', email: 'somchai@gmail.com' },
      { first_name: 'ແກ້ວ', last_name: 'ພິມມະສອນ', phone: '020-55533344', email: 'keo.p@outlook.com' }
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
          detailed_address: 'ເມືອງສີໂຄດຕະບອງ, ນະຄອນຫຼວງວຽງຈັນ, ລາວ',
          is_default: true,
          address_type: 'home'
        });
      }
    }

    // 9. Seed Promotions
    console.log('Seeding promotions...');
    await Promotion.findOrCreate({
      where: { name: 'ສ່ວນຫຼຸດເປີດຮ້ານໃໝ່' },
      defaults: {
        name: 'ສ່ວນຫຼຸດເປີດຮ້ານໃໝ່',
        description: 'ສ່ວນຫຼຸດ 10% ສຳລັບສິນຄ້າທຸກລາຍການໃນເດືອນເປີດຮ້ານ',
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
    console.log('- Root:    root / root123 (SuperAdmin)');
    console.log('- Admin:   admin / admin123');
    console.log('- Manager: manager / manager123');
    console.log('- Staff:   staff1 / staff123');
    console.log('-------------------------------------------');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
