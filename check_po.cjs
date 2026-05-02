const { PurchaseOrder, PurchaseOrderDetail } = require('./api/models/index.js');

async function checkLastPO() {
  try {
    const po = await PurchaseOrder.findOne({
      order: [['created_at', 'DESC']],
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
