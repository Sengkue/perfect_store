import { Permission } from './models/index.js';

async function seedNewPermissions() {
  const newPerms = [
    {
      name: 'reports.shift',
      display_name: 'ເບິ່ງລາຍງານປິດກະ',
      description: 'ສາມາດເຂົ້າເບິ່ງການສະຫຼຸບຍອດຂາຍປະຈຳວັນ (Shift Closure)',
      module: 'Reports'
    },
    {
      name: 'reports.tax',
      display_name: 'ເບິ່ງລາຍງານພາສີ',
      description: 'ສາມາດເຂົ້າເບິ່ງການສະຫຼຸບຍອດພາສີ ແລະ Net Sales',
      module: 'Reports'
    },
    {
      name: 'reports.refunds',
      display_name: 'ເບິ່ງລາຍງານການຄືນເງິນ',
      description: 'ສາມາດເຂົ້າເບິ່ງປະຫວັດການຄືນສິນຄ້າ ແລະ ຄືນເງິນ',
      module: 'Reports'
    }
  ];

  for (const p of newPerms) {
    const [perm, created] = await Permission.findOrCreate({
      where: { name: p.name },
      defaults: p
    });
    if (created) console.log(`Created: ${p.name}`);
    else console.log(`Exists: ${p.name}`);
  }
  process.exit();
}

seedNewPermissions();
