<template>
  <v-container fluid class="pa-2 container-border">
    <!-- ── Header Section ── -->
    <v-row class="mb-2">
      <v-col cols="12" class="d-flex align-center flex-wrap gap-2">
        <div class="header-icon-container rounded-lg pa-2 me-2 border">
          <v-icon color="orange-darken-2" size="28">mdi-account-star</v-icon>
        </div>
        <div>
          <h1 class="text-h5 font-weight-black mb-1">ລາຍງານລູກຄ້າ</h1>
          <p class="text-caption text-medium-emphasis">ວິເຄາະພຶດຕິກຳ ແລະ ຍອດຊື້ຂອງລູກຄ້າທີ່ດີທີ່ສຸດ</p>
        </div>
        <v-spacer />
        <div class="d-flex gap-2">
          <v-btn
            color="orange-darken-2"
            variant="tonal"
            prepend-icon="mdi-refresh"
            @click="fetchCustomers"
            :loading="loading"
            class="rounded-lg font-weight-bold"
            size="small"
          >
            ໂຫຼດໃໝ່
          </v-btn>
          <v-btn
            color="success"
            variant="elevated"
            prepend-icon="mdi-file-excel"
            @click="exportToExcel"
            class="rounded-lg font-weight-bold"
            size="small"
          >
            Export
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- ── Top 3 Highlights ── -->
    <v-row dense>
      <v-col v-for="(c, i) in topThree" :key="i" cols="12" md="4">
        <v-card border elevation="0" class="rounded-lg pa-4 text-center relative overflow-hidden h-100 shadow-soft">
          <div class="medal-icon" :class="'rank-' + (i+1)">
            <v-icon :icon="i === 0 ? 'mdi-crown' : 'mdi-medal'" :color="rankColor(i)" size="20" />
          </div>
          
          <v-avatar size="64" class="mb-3 border shadow-sm" :image="getAvatar(c.customer)" />
          <div class="text-subtitle-1 font-weight-bold line-clamp-1 px-4">{{ getCustomerName(c.customer) }}</div>
          <div class="text-caption text-medium-emphasis mb-3">{{ c.customer?.phone || 'ບໍ່ມີເບີໂທ' }}</div>
          
          <v-divider class="mb-3" />
          
          <div class="d-flex justify-space-around align-center">
            <div class="text-center">
              <div class="text-caption text-grey font-weight-medium">ຍອດຊື້ລວມ</div>
              <div class="text-subtitle-2 font-weight-black text-orange-darken-2">{{ formatCurrency(c.totalSpent) }}</div>
            </div>
            <v-divider vertical inset length="20" />
            <div class="text-center">
              <div class="text-caption text-grey font-weight-medium">ຈຳນວນອໍເດີ</div>
              <div class="text-subtitle-2 font-weight-black">{{ c.totalOrders }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Detailed List Table ── -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card border elevation="0" class="rounded-lg shadow-soft">
          <v-card-title class="pa-4 d-flex align-center">
            <v-icon icon="mdi-format-list-numbered" class="me-2" color="orange-darken-2" size="20" />
            <span class="text-subtitle-1 font-weight-bold">ລາຍຊື່ລູກຄ້າທີ່ມັກຊື້ຫຼາຍທີ່ສຸດ (Top 10)</span>
          </v-card-title>
          <v-divider />
          
          <v-table hover class="custom-table">
            <thead>
              <tr>
                <th class="text-left font-weight-bold" style="width: 80px">ອັນດັບ</th>
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
                  <v-avatar size="22" :color="i < 3 ? rankColor(i) : 'grey-lighten-2'" class="text-caption font-weight-black text-white">
                    {{ i + 1 }}
                  </v-avatar>
                </td>
                <td>
                  <div class="font-weight-bold text-primary">{{ getCustomerName(c.customer) }}</div>
                </td>
                <td class="text-caption">{{ c.customer?.phone || '-' }}</td>
                <td class="text-center">
                  <v-chip size="x-small" variant="tonal" class="font-weight-bold">{{ c.totalOrders }}</v-chip>
                </td>
                <td class="text-right font-weight-black">{{ formatCurrency(c.totalSpent) }}</td>
                <td class="text-right text-grey font-weight-medium">{{ formatCurrency(c.totalSpent / c.totalOrders) }}</td>
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
  border-color: rgba(255, 152, 0, 0.2) !important;
}

.container-border {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  background-color: rgb(var(--v-theme-surface));
  margin-top: 8px;
}

.shadow-soft {
  box-shadow: 0 4px 20px rgba(0,0,0,0.04) !important;
}

.medal-icon {
  position: absolute;
  top: 12px;
  right: 12px;
}

.rank-1 { transform: scale(1.3); }
.rank-2 { transform: scale(1.1); }
.rank-3 { transform: scale(1.0); }

.border {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
}

.shadow-sm {
  box-shadow: 0 4px 10px rgba(0,0,0,0.08) !important;
}

.relative { position: relative; }

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.custom-table :deep(thead th) {
  background-color: #f8f9fa !important;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  height: 44px !important;
}

.custom-table :deep(tbody td) {
  height: 48px !important;
  font-size: 0.875rem;
}
</style>
