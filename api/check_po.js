import dotenv from 'dotenv';
import { PurchaseOrder, PurchaseOrderDetail } from './models/index.js';

dotenv.config();

async function checkLastPO() {
  try {
    const po = await PurchaseOrder.findOne({
      order: [['id', 'DESC']],
      include: [{ model: PurchaseOrderDetail, as: 'details' }]
    });
    console.log('Last PO:', JSON.stringify(po, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkLastPO();
