'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('permissions', [
      {
        name: 'reports.shift',
        display_name: 'ເບິ່ງລາຍງານປິດກະ',
        description: 'ສາມາດເຂົ້າເບິ່ງການສະຫຼຸບຍອດຂາຍປະຈຳວັນ (Shift Closure)',
        module: 'Reports',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'reports.tax',
        display_name: 'ເບິ່ງລາຍງານພາສີ',
        description: 'ສາມາດເຂົ້າເບິ່ງການສະຫຼຸບຍອດພາສີ ແລະ Net Sales',
        module: 'Reports',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'reports.refunds',
        display_name: 'ເບິ່ງລາຍງານການຄືນເງິນ',
        description: 'ສາມາດເຂົ້າເບິ່ງປະຫວັດການຄືນສິນຄ້າ ແລະ ຄືນເງິນ',
        module: 'Reports',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('permissions', {
      name: ['reports.shift', 'reports.tax', 'reports.refunds']
    }, {});
  }
};
