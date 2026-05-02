<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-6">
          <v-icon size="36" color="primary" class="mr-4">mdi-package-variant</v-icon>
          <div>
            <h1 class="text-h4 font-weight-bold">ລາຍງານສິນຄ້າຄົງຄັງ</h1>
            <div class="text-subtitle-1 text-medium-emphasis">ກວດສອບຈຳນວນສິນຄ້າ ແລະ ມູນຄ່າສາງ</div>
          </div>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="tonal"
            prepend-icon="mdi-refresh"
            class="mr-2"
            @click="fetchInventory"
            :loading="loading"
          >
            ໂຫຼດໃໝ່
          </v-btn>
          <v-btn
            color="success"
            variant="elevated"
            prepend-icon="mdi-file-excel"
            @click="exportToExcel"
          >
            Export Excel
          </v-btn>
        </div>

        <v-row>
          <v-col cols="12" md="4">
            <v-card border elevation="0" class="rounded-xl pa-4">
              <div class="text-overline text-grey">ຈຳນວນສິນຄ້າທັງໝົດ</div>
              <div class="text-h4 font-weight-black">{{ inventory.totalItems }}</div>
              <div class="text-caption text-medium-emphasis mt-1">ຊິ້ນ/ອັນ ໃນສາງ</div>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card border elevation="0" class="rounded-xl pa-4">
              <div class="text-overline text-grey">ມູນຄ່າສາງທັງໝົດ (ຕົ້ນທຶນ)</div>
              <div class="text-h4 font-weight-black text-primary">{{ formatCurrency(inventory.totalStockValue) }}</div>
              <div class="text-caption text-medium-emphasis mt-1">ຄິດໄລ່ຕາມລາຄາຕົ້ນທຶນ</div>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card border elevation="0" class="rounded-xl pa-4">
              <div class="text-overline text-grey">ສິນຄ້າທີ່ໃກ້ຈະໝົດ</div>
              <div class="text-h4 font-weight-black text-error">{{ inventory.lowStockCount }}</div>
              <div class="text-caption text-medium-emphasis mt-1">ລາຍການທີ່ຕ່ຳກວ່າລະດັບແຈ້ງເຕືອນ</div>
            </v-card>
          </v-col>
        </v-row>

        <v-card border elevation="0" class="rounded-xl mt-6">
          <v-card-title class="pa-4 d-flex align-center">
            <v-icon icon="mdi-alert-circle-outline" color="error" class="mr-2"></v-icon>
            ລາຍການສິນຄ້າທີ່ຄວນສັ່ງຊື້ເພີ່ມ (Low Stock)
          </v-card-title>
          <v-divider></v-divider>
          <v-table>
            <thead>
              <tr>
                <th class="text-left">ຊື່ສິນຄ້າ</th>
                <th class="text-left">SKU</th>
                <th class="text-center">ຈຳນວນຄົງເຫຼືອ</th>
                <th class="text-center">ລະດັບແຈ້ງເຕືອນ</th>
                <th class="text-right">ສະຖານະ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in inventory.lowStockItems" :key="item.variant_sku">
                <td class="font-weight-medium">{{ item.product_name }}</td>
                <td><v-chip size="x-small" label>{{ item.variant_sku }}</v-chip></td>
                <td class="text-center font-weight-bold text-error">{{ item.quantity }}</td>
                <td class="text-center">{{ item.reorder_level }}</td>
                <td class="text-right">
                  <v-chip color="error" size="x-small" variant="flat">Stock Low</v-chip>
                </td>
              </tr>
              <tr v-if="!inventory.lowStockItems?.length">
                <td colspan="5" class="text-center pa-10 text-medium-emphasis">
                  ບໍ່ມີສິນຄ້າທີ່ໃກ້ຈະໝົດໃນຂະນະນີ້
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import { showToast } from '~/composables/useToast'

const api = useApi()
const loading = ref(false)
const inventory = ref({
  totalItems: 0,
  totalStockValue: 0,
  lowStockCount: 0,
  lowStockItems: []
})

const fetchInventory = async () => {
  loading.value = true
  try {
    const res = await api('/reports/inventory')
    if (res.success) {
      inventory.value = res.data
    }
  } catch (e) {
    console.error('Failed to fetch inventory report', e)
  } finally {
    loading.value = false
  }
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK', maximumFractionDigits: 0 }).format(val)
}

const exportToExcel = () => {
  try {
    const wsData = [
      ['ລາຍງານສິນຄ້າຄົງຄັງ'],
      ['ວັນທີລາຍງານ:', new Date().toLocaleString()],
      [''],
      ['ສະຫຼຸບພາບລວມ'],
      ['ຈຳນວນສິນຄ້າທັງໝົດ', inventory.value.totalItems, 'ຊິ້ນ/ອັນ'],
      ['ມູນຄ່າສາງທັງໝົດ', inventory.value.totalStockValue, 'LAK'],
      ['ສິນຄ້າທີ່ໃກ້ຈະໝົດ', inventory.value.lowStockCount, 'ລາຍການ'],
      [''],
      ['ລາຍການສິນຄ້າທີ່ຄວນສັ່ງຊື້ເພີ່ມ'],
      ['ຊື່ສິນຄ້າ', 'SKU', 'ຈຳນວນຄົງເຫຼືອ', 'ລະດັບແຈ້ງເຕືອນ']
    ]

    inventory.value.lowStockItems.forEach(item => {
      wsData.push([item.product_name, item.variant_sku, item.quantity, item.reorder_level])
    })

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory')

    XLSX.writeFile(wb, `inventory_report_${new Date().toISOString().slice(0, 10)}.xlsx`)
    showToast('ສົ່ງອອກຂໍ້ມູນສຳເລັດ', 'success')
  } catch (e) {
    console.error(e)
    showToast('ສົ່ງອອກຂໍ້ມູນຫຼົ້ມເຫຼວ', 'error')
  }
}

onMounted(() => {
  fetchInventory()
})
</script>
