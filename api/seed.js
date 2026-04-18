import bcrypt from 'bcryptjs';
import { User, Category, Supplier, Product, ProductVariant, sequelize } from './models/index.js';

const seedDatabase = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    console.log('Seeding admin user...'); 
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('admin123', salt);
      await User.create({
        username: 'admin',
        password_hash,
        role: 'admin',
        is_active: true
      });
      console.log('Admin user created successfully! (admin / admin123)');
    } else {
      console.log('Admin user already exists.');
    }

    console.log('Seeding categories...');
    const categories = [
      { category_name: 'Electronics', slug: 'electronics', description: 'Gadgets and devices' },
      { category_name: 'Clothing', slug: 'clothing', description: 'Apparel and accessories' },
      { category_name: 'Groceries', slug: 'groceries', description: 'Food and daily items' }
    ];

    for (const cat of categories) {
      await Category.findOrCreate({
        where: { slug: cat.slug },
        defaults: cat
      });
    }

    console.log('Seeding suppliers...');
    const suppliers = [
      { name: 'Tech Source Inc', contact_person: 'John Doe', phone: '123-456-7890', email: 'contact@techsource.com' },
      { name: 'Fashion Hub', contact_person: 'Jane Smith', phone: '098-765-4321', email: 'info@fashionhub.com' }
    ];

    for (const sup of suppliers) {
      await Supplier.findOrCreate({
        where: { email: sup.email },
        defaults: sup
      });
    }

    console.log('Seeding products...');
    
    // Fetch dependencies
    const electronics = await Category.findOne({ where: { slug: 'electronics' } });
    const clothing = await Category.findOne({ where: { slug: 'clothing' } });
    const techSupplier = await Supplier.findOne({ where: { email: 'contact@techsource.com' } });
    const fashionSupplier = await Supplier.findOne({ where: { email: 'info@fashionhub.com' } });

    const products = [
      {
        name: 'Smartphone Pro Max',
        barcode: '1234567890123',
        sku: 'ELEC-SPM-001',
        description: 'Latest high-end smartphone with advanced camera.',
        cost_price: 600.00,
        selling_price: 999.99,
        weight: 0.2,
        is_active: true,
        category_id: electronics?.id,
        supplier_id: techSupplier?.id,
      },
      {
        name: 'Wireless Noise Cancelling Headphones',
        barcode: '9876543210987',
        sku: 'ELEC-WNH-002',
        description: 'Over-ear headphones with superior noise cancellation.',
        cost_price: 150.00,
        selling_price: 299.99,
        weight: 0.3,
        is_active: true,
        category_id: electronics?.id,
        supplier_id: techSupplier?.id,
      },
      {
        name: 'Classic Cotton T-Shirt',
        barcode: '5555555555555',
        sku: 'CLTH-CCT-001',
        description: '100% cotton casual t-shirt.',
        cost_price: 5.00,
        selling_price: 15.00,
        weight: 0.1,
        is_active: true,
        category_id: clothing?.id,
        supplier_id: fashionSupplier?.id,
      }
    ];

    for (const prod of products) {
      const [productRecord, created] = await Product.findOrCreate({
        where: { sku: prod.sku },
        defaults: prod
      });

      if (created) {
        // Create product variants if product was newly created
        if (prod.sku === 'ELEC-SPM-001') { 
          await ProductVariant.bulkCreate([
            { product_id: productRecord.id, color: 'Black', size: '128GB', variant_sku: 'ELEC-SPM-001-BLK-128', quantity_in_stock: 50 },
            { product_id: productRecord.id, color: 'White', size: '256GB', variant_sku: 'ELEC-SPM-001-WHT-256', quantity_in_stock: 30, additional_price: 50.00 }
          ]);
        } else if (prod.sku === 'CLTH-CCT-001') { 
          await ProductVariant.bulkCreate([
            { product_id: productRecord.id, color: 'Red', size: 'M', variant_sku: 'CLTH-CCT-001-RED-M', quantity_in_stock: 100 },
            { product_id: productRecord.id, color: 'Blue', size: 'L', variant_sku: 'CLTH-CCT-001-BLU-L', quantity_in_stock: 80 }
          ]);
        }
      }
    }

    console.log('Database seeded successfully with users, categories, suppliers, and products!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
