import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'api', '.env') });

async function testCreatePO() {
  try {
    const payload = {
      supplier_id: 1,
      items: [
        {
          product_id: 1,
          quantity_ordered: 5,
          unit_cost: 1000
        }
      ]
    };

    // We need a token if there's auth. 
    // Assuming the API might be open or we can bypass it for this test if we use the model directly.
    // Let's use the model directly.
    const { PurchaseOrder, PurchaseOrderDetail } = await import('./api/models/index.js');
    
    const t = await PurchaseOrder.sequelize.transaction();
    const po = await PurchaseOrder.create({
      po_number: 'TEST-' + Date.now(),
      supplier_id: 1,
      total_amount: 5000,
      status: 'draft'
    }, { transaction: t });

    await PurchaseOrderDetail.create({
      po_id: po.id,
      product_id: 1,
      quantity_ordered: 5,
      unit_cost: 1000,
      subtotal: 5000
    }, { transaction: t });

    await t.commit();
    console.log('PO created successfully with qty 5');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testCreatePO();
