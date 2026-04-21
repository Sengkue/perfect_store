import { Product, ProductSupplier } from '../models/index.js';
import sequelize from '../config/database.js';

async function migrate() {
  console.log('--- Starting Supplier Data Migration ---');
  
  try {
    // 1. Authenticate and Sync
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    // Ensure the new table exists
    await sequelize.sync({ alter: true });
    console.log('Database synced (New tables created).');

    // 2. Determine which column to use (supplier_id or primary_supplier_id)
    const [results] = await sequelize.query('DESCRIBE products');
    const columns = results.map(c => c.Field);
    const supplierCol = columns.includes('primary_supplier_id') ? 'primary_supplier_id' : 'supplier_id';
    
    console.log(`Using column: ${supplierCol} for migration.`);

    // 3. Fetch products using raw query to avoid model mismatches
    const [products] = await sequelize.query(`SELECT id, ${supplierCol} as supplier_id, cost_price, sku FROM products WHERE ${supplierCol} IS NOT NULL`);

    console.log(`Found ${products.length} products to migrate.`);

    let count = 0;
    for (const product of products) {
      // 4. Check if relationship already exists
      const [ps, created] = await ProductSupplier.findOrCreate({
        where: {
          product_id: product.id,
          supplier_id: product.supplier_id
        },
        defaults: {
          is_primary: true,
          supplier_cost_price: product.cost_price,
          supplier_sku: product.sku
        },
        logging: false
      });

      if (created) {
        count++;
      }
    }

    console.log(`Migration completed. Created ${count} new records in product_suppliers.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
