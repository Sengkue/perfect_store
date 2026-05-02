<template>
  <v-container fluid class="pa-6">
    <v-row class="mb-6">
      <v-col cols="12" class="d-flex align-center">
        <div class="header-icon-container rounded-xl pa-3 me-4">
          <v-icon color="orange-darken-2" size="32">mdi-account-star</v-icon>
        </div>
        <div>
          <h1 class="text-h4 font-weight-black mb-1">ລາຍງານລູກຄ້າ</h1>
          <p class="text-subtitle-1 text-medium-emphasis">ວິເຄາະພຶດຕິກຳ ແລະ ຍອດຊື້ຂອງລູກຄ້າທີ່ດີທີ່ສຸດ</p>
        </div>
        <v-spacer></v-spacer>
        <v-btn
          color="orange-darken-2"
          variant="tonal"
          prepend-icon="mdi-refresh"
          @click="fetchCustomers"
          :loading="loading"
          class="rounded-lg px-6 mr-2"
        >
          ໂຫຼດໃໝ່
        </v-btn>
        <v-btn
          color="success"
          variant="elevated"
          prepend-icon="mdi-file-excel"
          @click="exportToExcel"
          class="rounded-lg px-6"
        >
          Export
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <!-- Top 3 Highlights -->
      <v-col v-for="(c, i) in topThree" :key="i" cols="12" md="4">
        <v-card border elevation="0" class="rounded-xl pa-6 text-center relative overflow-hidden h-100">
          <div class="medal-icon" :class="'rank-' + (i+1)">
            <v-icon :icon="i === 0 ? 'mdi-crown' : 'mdi-medal'" :color="rankColor(i)"></v-icon>
          </div>
          
          <v-avatar size="80" class="mb-4 border-2 shadow-sm" :image="getAvatar(c.customer)"></v-avatar>
          <div class="text-h6 font-weight-bold">{{ getCustomerName(c.customer) }}</div>
          <div class="text-caption text-medium-emphasis mb-4">{{ c.customer?.phone || 'ບໍ່ມີເບີໂທ' }}</div>
          
          <v-divider class="mb-4"></v-divider>
          
          <div class="d-flex justify-space-around">
            <div class="text-center">
              <div class="text-caption text-grey">ຍອດຊື້ລວມ</div>
              <div class="text-subtitle-1 font-weight-black text-orange-darken-2">{{ formatCurrency(c.totalSpent) }}</div>
            </div>
            <v-divider vertical inset></v-divider>
            <div class="text-center">
              <div class="text-caption text-grey">ຈຳນວນອໍເດີ</div>
              <div class="text-subtitle-1 font-weight-black">{{ c.totalOrders }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Detailed List Table -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card border elevation="0" class="rounded-xl">
          <v-card-title class="pa-6 d-flex align-center">
            <span class="text-h6 font-weight-bold">ລາຍຊື່ລູກຄ້າທີ່ມັກຊື້ຫຼາຍທີ່ສຸດ (Top 10)</span>
            <v-spacer></v-spacer>
          </v-card-title>
          <v-divider></v-divider>
          
          <v-table hover>
            <thead>
              <tr class="bg-grey-lighten-4">
                <th class="text-left font-weight-bold">ອັນດັບ</th>
                <th class="text-left font-weight-bold">ລູກຄ້າ</th>
                <th class="text-left font-weight-bold">ເບີໂທລະສັບ</th>
                <th class="text-center font-weight-bold">ຈຳນວນອໍເດີ</th>
                <th class="text-right font-weight-bold">ຍອດຊື້ທັງໝົດ</th>
                <th class="text-right font-weight-bold">ສະເລ່ຍຕໍ່ອໍເດີ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(c, i) in customers" :key="i">
                <td>
                  <v-avatar size="24" :color="i < 3 ? rankColor(i) : 'grey-lighten-2'" class="text-caption font-weight-bold text-white">
                    {{ i + 1 }}
                  </v-avatar>
                </td>
                <td class="font-weight-bold text-primary">{{ getCustomerName(c.customer) }}</td>
                <td>{{ c.customer?.phone || '-' }}</td>
                <td class="text-center">{{ c.totalOrders }}</td>
                <td class="text-right font-weight-black">{{ formatCurrency(c.totalSpent) }}</td>
                <td class="text-right text-grey">{{ formatCurrency(c.totalSpent / c.totalOrders) }}</td>
              </tr>
              <tr v-if="!customers.length && !loading">
                <td colspan="6" class="text-center pa-10 text-medium-emphasis">
                  ບໍ່ມີຂໍ້ມູນລູກຄ້າໃນຂະນະນີ້
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
import { ref, computed, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import { showToast } from '~/composables/useToast'

const api = useApi()
const loading = ref(false)
const customers = ref([])

const topThree = computed(() => customers.value.slice(0, 3))

const fetchCustomers = async () => {
  loading.value = true
  try {
    const res = await api('/reports/customers')
    if (res.success) {
      customers.value = res.data
    }
  } catch (e) {
    console.error('Failed to fetch customer report', e)
  } finally {
    loading.value = false
  }
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK', maximumFractionDigits: 0 }).format(val)
}

const getCustomerName = (c) => {
  if (!c) return 'ລູກຄ້າທົ່ວໄປ (Walk-in)'
  return `${c.first_name} ${c.last_name || ''}`.trim()
}

const getAvatar = (c) => {
  const name = getCustomerName(c)
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
}

const rankColor = (i) => {
  if (i === 0) return 'amber-darken-3' // Gold
  if (i === 1) return 'grey-darken-1'  // Silver
  if (i === 2) return 'brown-darken-1' // Bronze
  return 'grey'
}

const exportToExcel = () => {
  if (!customers.value.length) return
  try {
    const wsData = [
      ['ລາຍງານລູກຄ້າ'],
      ['ວັນທີ:', new Date().toLocaleString()],
      [''],
      ['ອັນດັບ', 'ລູກຄ້າ', 'ເບີໂທລະສັບ', 'ຈຳນວນອໍເດີ', 'ຍອດຊື້ທັງໝົດ', 'ສະເລ່ຍຕໍ່ອໍເດີ']
    ]
    customers.value.forEach((c, i) => {
      wsData.push([
        i + 1,
        getCustomerName(c.customer),
        c.customer?.phone || '-',
        c.totalOrders,
        c.totalSpent,
        c.totalSpent / c.totalOrders
      ])
    })
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Customers')
    XLSX.writeFile(wb, `customer_report_${new Date().toISOString().slice(0, 10)}.xlsx`)
    showToast('ສົ່ງອອກຂໍ້ມູນສຳເລັດ', 'success')
  } catch (e) {
    showToast('ສົ່ງອອກຂໍ້ມູນຫຼົ້ມເຫຼວ', 'error')
  }
}

onMounted(() => {
  fetchCustomers()
})
</script>

<style scoped>
.header-icon-container {
  background-color: rgba(255, 152, 0, 0.1);
}

.medal-icon {
  position: absolute;
  top: 15px;
  right: 15px;
  font-size: 32px;
}

.rank-1 { transform: scale(1.5); }
.rank-2 { transform: scale(1.2); }
.rank-3 { transform: scale(1.1); }

.border-2 {
  border: 2px solid white;
}

.shadow-sm {
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.relative { position: relative; }
</style>
