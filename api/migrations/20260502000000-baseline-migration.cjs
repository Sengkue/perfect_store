'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Shop Settings
    await queryInterface.createTable('shop_settings', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      shop_name: { type: Sequelize.STRING(100), allowNull: false },
      phone: { type: Sequelize.STRING(20), allowNull: true },
      email: { type: Sequelize.STRING(100), allowNull: true },
      logo_url: { type: Sequelize.TEXT, allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      tax_number: { type: Sequelize.STRING(50), allowNull: true },
      tax_rate: { type: Sequelize.DECIMAL(5, 2), defaultValue: 10.00, allowNull: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('now') }
    });

    // 2. Users
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      username: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      role: { type: Sequelize.ENUM('root', 'admin', 'staff', 'manager'), defaultValue: 'staff' },
      last_login: { type: Sequelize.DATE, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true }
    });
    await queryInterface.addIndex('users', ['username']);
    await queryInterface.addIndex('users', ['role']);

    // 3. User Profile
    await queryInterface.createTable('user_profile', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      first_name: { type: Sequelize.STRING(50), allowNull: false },
      last_name: { type: Sequelize.STRING(50), allowNull: false },
      phone: { type: Sequelize.STRING(20), unique: true },
      email: { type: Sequelize.STRING(100) },
      address: { type: Sequelize.TEXT },
      hire_date: { type: Sequelize.DATEONLY },
      salary: { type: Sequelize.DECIMAL(10, 2) },
      avatar_url: { type: Sequelize.TEXT }
    });
    await queryInterface.addIndex('user_profile', ['user_id']);

    // 4. Permissions
    await queryInterface.createTable('permissions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(100), unique: true, allowNull: false },
      display_name: { type: Sequelize.STRING(100) },
      module: { type: Sequelize.STRING(50) },
      description: { type: Sequelize.TEXT }
    });

    // 5. Role Permissions
    await queryInterface.createTable('role_permissions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      role: { type: Sequelize.ENUM('root', 'admin', 'staff', 'manager'), allowNull: false },
      permission_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'permissions', key: 'id' }, onDelete: 'CASCADE' },
      is_allowed: { type: Sequelize.BOOLEAN, defaultValue: true }
    });
    await queryInterface.addIndex('role_permissions', ['role']);
    await queryInterface.addIndex('role_permissions', ['permission_id']);

    // 6. User Permissions
    await queryInterface.createTable('user_permissions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      permission_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'permissions', key: 'id' }, onDelete: 'CASCADE' },
      is_allowed: { type: Sequelize.BOOLEAN, allowNull: false },
      granted_by: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('now') }
    });

    // 7. Customers
    await queryInterface.createTable('customers', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      first_name: { type: Sequelize.STRING(50), allowNull: false },
      last_name: { type: Sequelize.STRING(50), allowNull: false },
      phone: { type: Sequelize.STRING(20), allowNull: true, unique: true },
      email: { type: Sequelize.STRING(100), allowNull: true, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: true },
      total_spent: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      loyalty_points: { type: Sequelize.INTEGER, defaultValue: 0 },
      customer_tier: { type: Sequelize.ENUM('bronze', 'silver', 'gold', 'platinum'), defaultValue: 'bronze' },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
      is_verified: { type: Sequelize.BOOLEAN, defaultValue: false }
    });
    await queryInterface.addIndex('customers', ['first_name']);
    await queryInterface.addIndex('customers', ['last_name']);
    await queryInterface.addIndex('customers', ['phone']);
    await queryInterface.addIndex('customers', ['email']);

    // 8. Customer Addresses
    await queryInterface.createTable('customer_addresses', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      customer_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'customers', key: 'id' }, onDelete: 'CASCADE' },
      recipient_name: { type: Sequelize.STRING(100), allowNull: false },
      recipient_phone: { type: Sequelize.STRING(20), allowNull: true },
      detailed_address: { type: Sequelize.TEXT, allowNull: true },
      is_default: { type: Sequelize.BOOLEAN, defaultValue: false },
      address_type: { type: Sequelize.ENUM('home', 'work', 'other'), defaultValue: 'home' }
    });
    await queryInterface.addIndex('customer_addresses', ['customer_id']);

    // 9. Suppliers
    await queryInterface.createTable('suppliers', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      contact_person: { type: Sequelize.STRING(100), allowNull: true },
      phone: { type: Sequelize.STRING(20), allowNull: true },
      email: { type: Sequelize.STRING(100), allowNull: true }
    });
    await queryInterface.addIndex('suppliers', ['name']);
    await queryInterface.addIndex('suppliers', ['phone']);

    // 10. Categories
    await queryInterface.createTable('categories', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      parent_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'categories', key: 'id' }, onDelete: 'SET NULL' },
      category_name: { type: Sequelize.STRING(100), allowNull: false },
      slug: { type: Sequelize.STRING(100), allowNull: true, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true }
    });
    await queryInterface.addIndex('categories', ['category_name']);

    // 11. Products
    await queryInterface.createTable('products', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      category_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'categories', key: 'id' }, onDelete: 'SET NULL' },
      primary_supplier_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'suppliers', key: 'id' }, onDelete: 'SET NULL' },
      name: { type: Sequelize.STRING(200), allowNull: false },
      barcode: { type: Sequelize.STRING(50), allowNull: true, unique: true },
      sku: { type: Sequelize.STRING(50), allowNull: true, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      cost_price: { type: Sequelize.DECIMAL(15, 2), allowNull: true },
      selling_price: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      weight: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('now') }
    });
    await queryInterface.addIndex('products', ['name']);
    await queryInterface.addIndex('products', ['barcode']);
    await queryInterface.addIndex('products', ['sku']);

    // 12. Product Variants
    await queryInterface.createTable('product_variants', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'CASCADE' },
      color: { type: Sequelize.STRING(50), allowNull: true },
      size: { type: Sequelize.STRING(20), allowNull: true },
      variant_sku: { type: Sequelize.STRING(50), allowNull: true, unique: true },
      quantity_in_stock: { type: Sequelize.INTEGER, defaultValue: 0 },
      reorder_level: { type: Sequelize.INTEGER, defaultValue: 5 },
      additional_price: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 }
    });
    await queryInterface.addIndex('product_variants', ['product_id']);
    await queryInterface.addIndex('product_variants', ['variant_sku']);

    // 13. Product Images
    await queryInterface.createTable('product_images', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'CASCADE' },
      image_url: { type: Sequelize.TEXT, allowNull: false },
      is_primary: { type: Sequelize.BOOLEAN, defaultValue: false },
      sort_order: { type: Sequelize.INTEGER, defaultValue: 0 }
    });
    await queryInterface.addIndex('product_images', ['product_id']);

    // 14. Product Suppliers
    await queryInterface.createTable('product_suppliers', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'CASCADE' },
      supplier_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'suppliers', key: 'id' }, onDelete: 'CASCADE' },
      supplier_cost_price: { type: Sequelize.DECIMAL(15, 2), allowNull: true },
      supplier_sku: { type: Sequelize.STRING(50), allowNull: true },
      is_primary: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('now') }
    });
    await queryInterface.addIndex('product_suppliers', ['product_id', 'supplier_id'], { unique: true });
    await queryInterface.addIndex('product_suppliers', ['supplier_sku']);

    // 15. Purchase Orders
    await queryInterface.createTable('purchase_orders', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      supplier_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'suppliers', key: 'id' } },
      po_number: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      status: { type: Sequelize.ENUM('pending', 'ordered', 'received', 'cancelled'), defaultValue: 'pending' },
      total_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      notes: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('now') }
    });

    // 16. Purchase Order Details
    await queryInterface.createTable('purchase_order_details', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      po_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'purchase_orders', key: 'id' }, onDelete: 'CASCADE' },
      product_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'products', key: 'id' } },
      variant_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'product_variants', key: 'id' } },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      cost_price: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      received_quantity: { type: Sequelize.INTEGER, defaultValue: 0 }
    });

    // 17. Imports
    await queryInterface.createTable('imports', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      purchase_order_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'purchase_orders', key: 'id' } },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      supplier_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'suppliers', key: 'id' } },
      import_number: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      status: { type: Sequelize.ENUM('pending', 'completed', 'cancelled'), defaultValue: 'pending' },
      notes: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('now') }
    });

    // 18. Import Details
    await queryInterface.createTable('import_details', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      import_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'imports', key: 'id' }, onDelete: 'CASCADE' },
      product_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'products', key: 'id' } },
      variant_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'product_variants', key: 'id' } },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      cost_price: { type: Sequelize.DECIMAL(15, 2), allowNull: false }
    });

    // 19. Promotions
    await queryInterface.createTable('promotions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      description: { type: Sequelize.TEXT },
      discount_type: { type: Sequelize.ENUM('percentage', 'fixed_amount'), allowNull: false },
      discount_value: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      start_date: { type: Sequelize.DATE },
      end_date: { type: Sequelize.DATE },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true }
    });

    // 20. Sales
    await queryInterface.createTable('sales', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      customer_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'customers', key: 'id' } },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      promotion_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'promotions', key: 'id' } },
      address_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'customer_addresses', key: 'id' } },
      sale_number: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      subtotal: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      tax_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      discount_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      total_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      payment_status: { type: Sequelize.ENUM('unpaid', 'partially_paid', 'paid'), defaultValue: 'unpaid' },
      sale_status: { type: Sequelize.ENUM('pending', 'processing', 'completed', 'cancelled', 'refunded'), defaultValue: 'pending' },
      sale_type: { type: Sequelize.ENUM('pos', 'online'), defaultValue: 'pos' },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('now') }
    });

    // 21. Sale Details
    await queryInterface.createTable('sale_details', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      sale_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'sales', key: 'id' }, onDelete: 'CASCADE' },
      product_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'products', key: 'id' } },
      variant_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'product_variants', key: 'id' } },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      unit_price: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      discount_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      total_price: { type: Sequelize.DECIMAL(15, 2), allowNull: false }
    });

    // 22. Payments
    await queryInterface.createTable('payments', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      sale_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'sales', key: 'id' } },
      payment_method: { type: Sequelize.ENUM('cash', 'transfer', 'credit_card', 'other'), allowNull: false },
      amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      transaction_id: { type: Sequelize.STRING(100) },
      status: { type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded'), defaultValue: 'completed' },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('now') }
    });

    // 23. Refunds
    await queryInterface.createTable('refunds', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      sale_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'sales', key: 'id' } },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      refund_number: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      reason: { type: Sequelize.TEXT },
      status: { type: Sequelize.ENUM('pending', 'completed', 'cancelled'), defaultValue: 'pending' },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('now') }
    });

    // 24. Refund Details
    await queryInterface.createTable('refund_details', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      refund_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'refunds', key: 'id' }, onDelete: 'CASCADE' },
      sale_detail_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'sale_details', key: 'id' } },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false }
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop in reverse order
    await queryInterface.dropTable('refund_details');
    await queryInterface.dropTable('refunds');
    await queryInterface.dropTable('payments');
    await queryInterface.dropTable('sale_details');
    await queryInterface.dropTable('sales');
    await queryInterface.dropTable('promotions');
    await queryInterface.dropTable('import_details');
    await queryInterface.dropTable('imports');
    await queryInterface.dropTable('purchase_order_details');
    await queryInterface.dropTable('purchase_orders');
    await queryInterface.dropTable('product_suppliers');
    await queryInterface.dropTable('product_images');
    await queryInterface.dropTable('product_variants');
    await queryInterface.dropTable('products');
    await queryInterface.dropTable('categories');
    await queryInterface.dropTable('suppliers');
    await queryInterface.dropTable('customer_addresses');
    await queryInterface.dropTable('customers');
    await queryInterface.dropTable('user_permissions');
    await queryInterface.dropTable('role_permissions');
    await queryInterface.dropTable('permissions');
    await queryInterface.dropTable('user_profile');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('shop_settings');
  }
};
