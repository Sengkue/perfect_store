import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PurchaseOrder, PurchaseOrderDetail } from './api/models/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'api', '.env') });

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
