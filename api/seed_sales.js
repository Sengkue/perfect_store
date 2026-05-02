import { Sale, SaleDetail, Product, ProductVariant, User, Customer, sequelize } from './models/index.js';
import { Op } from 'sequelize';

async function seedSales() {
  try {
    console.log('🚀 Starting Sales Seeding...');
    
    const products = await Product.findAll({
      include: [{ model: ProductVariant, as: 'variants' }]
    });
    
    const staff = await User.findAll({ 
      where: { 
        role: { [Op.in]: ['staff', 'manager', 'admin', 'root'] } 
      } 
    });
    const customers = await Customer.findAll();
    
    if (products.length === 0) {
      console.error('❌ No products found. Please run seed.js first.');
      return;
    }

    // Clear existing sales to avoid duplicate SL numbers if desired
    // await SaleDetail.destroy({ where: {} });
    // await Sale.destroy({ where: {} });

    // Generate sales for the last 30 days
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Random number of sales per day (3 to 12)
      const salesCount = Math.floor(Math.random() * 10) + 3;
      
      for (let j = 0; j < salesCount; j++) {
        const seller = staff[Math.floor(Math.random() * staff.length)];
        const buyer = customers.length > 0 ? customers[Math.floor(Math.random() * customers.length)] : null;
        
        const saleTime = new Date(date);
        saleTime.setHours(Math.floor(Math.random() * 12) + 9); // 9 AM to 9 PM
        saleTime.setMinutes(Math.floor(Math.random() * 60));

        const sale = await Sale.create({
          sale_type: 'in_shop',
          sale_number: `SL-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}-${i}-${j}`,
          user_id: seller.id,
          customer_id: buyer ? buyer.id : null,
          sale_date: saleTime,
          payment_method: 'cash',
          payment_status: 'paid',
          sale_status: 'completed',
          subtotal: 0,
          total_amount: 0,
          created_at: saleTime
        });

        let totalAmount = 0;
        // Random items per sale (1 to 3)
        const itemsCount = Math.floor(Math.random() * 3) + 1;
        
        for (let k = 0; k < itemsCount; k++) {
          const product = products[Math.floor(Math.random() * products.length)];
          if (!product.variants || product.variants.length === 0) continue;
          
          const variant = product.variants[Math.floor(Math.random() * product.variants.length)];
          const qty = Math.floor(Math.random() * 2) + 1;
          const price = Number(product.selling_price);

          await SaleDetail.create({
            sale_id: sale.id,
            product_id: product.id,
            variant_id: variant.id,
            quantity: qty,
            unit_price: price,
            total_price: price * qty
          });

          totalAmount += price * qty;
        }

        await sale.update({ subtotal: totalAmount, total_amount: totalAmount });
      }
      console.log(`✅ Seeded sales for ${date.toLocaleDateString()}`);
    }

    console.log('🎉 Sales seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedSales();
