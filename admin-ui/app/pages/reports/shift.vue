<template>
  <v-container fluid class="pa-2 container-border">
    <!-- ── Header Section ── -->
    <v-row class="mb-2">
      <v-col cols="12" class="d-flex align-center flex-wrap gap-2">
        <div class="header-icon-container rounded-lg pa-2 me-2 border">
          <v-icon color="indigo" size="28">mdi-calendar-check</v-icon>
        </div>
        <div>
          <h1 class="text-h5 font-weight-black mb-1">ສະຫຼຸບຍອດປິດກະ</h1>
          <p class="text-caption text-medium-emphasis">ສະຫຼຸບລາຍຮັບແຍກຕາມຮູບແບບການຊຳລະເງິນປະຈຳວັນ</p>
        </div>
        <v-spacer />

        <v-card elevation="0" border class="rounded-lg px-3 py-1 d-flex align-center gap-2 bg-white shadow-soft">
          <v-menu v-model="dateMenu" :close-on-content-click="false">
            <template v-slot:activator="{ props }">
              <v-text-field
                v-model="selectedDate"
                label="ເລືອກວັນທີ"
                prepend-inner-icon="mdi-calendar"
                variant="plain"
                density="compact"
                hide-details
                readonly
                v-bind="props"
                style="width: 160px"
                class="font-weight-bold"
              />
            </template>
            <v-date-picker v-model="selectedDateObj" @update:modelValue="onDateChange" color="indigo" />
          </v-menu>
          <v-divider vertical class="mx-1" />
          <v-btn color="indigo" variant="elevated" class="rounded-lg" size="small" @click="fetchData" :loading="loading">
            ໂຫຼດຂໍ້ມູນ
          </v-btn>
          <v-btn color="success" variant="tonal" prepend-icon="mdi-file-excel" size="small" class="rounded-lg" @click="exportToExcel">
            Export
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="reportData" dense>
      <!-- Summary Cards -->
      <v-col cols="12" sm="4">
        <v-card border elevation="0" class="rounded-lg pa-4 h-100 bg-indigo-lighten-5">
          <div class="text-overline text-indigo font-weight-bold" style="line-height: 1.2">ລາຍຮັບທັງໝົດ</div>
          <div class="text-h5 font-weight-black text-indigo mt-1">{{ formatCurrency(reportData.overall?.totalRevenue || 0) }}</div>
          <div class="text-caption text-indigo mt-1 opacity-80">ຈາກທັງໝົດ {{ reportData.overall?.totalTransactions || 0 }} ລາຍການ</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card border elevation="0" class="rounded-lg pa-4 h-100">
          <div class="text-overline text-grey-darken-1 font-weight-bold" style="line-height: 1.2">ຄ່າສະເລ່ຍຕໍ່ບິນ</div>
          <div class="text-h6 font-weight-black mt-1">{{ formatCurrency(reportData.overall?.avgTransaction || 0) }}</div>
          <div class="text-caption text-grey">Average per transaction</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card border elevation="0" class="rounded-lg pa-4 h-100">
          <div class="text-overline text-grey-darken-1 font-weight-bold" style="line-height: 1.2">ວັນທີລາຍງານ</div>
          <div class="text-h6 font-weight-black mt-1 text-uppercase">{{ formatDateLao(selectedDate) }}</div>
          <div class="text-caption text-grey">Daily closure summary</div>
        </v-card>
      </v-col>

      <!-- Payment Breakdown -->
      <v-col cols="12" class="mt-4">
        <v-card border elevation="0" class="rounded-lg overflow-hidden shadow-soft">
          <v-card-title class="pa-4 bg-grey-lighten-4">
            <div class="d-flex align-center gap-2">
              <v-icon icon="mdi-bank-transfer" color="indigo" size="20" />
              <span class="text-subtitle-1 font-weight-bold">ແຍກຕາມຮູບແບບການຊຳລະເງິນ (Payment Methods)</span>
            </div>
          </v-card-title>
          <v-divider />
          <v-table class="custom-table">
            <thead>
              <tr>
                <th class="text-left font-weight-bold">ຮູບແບບການຊຳລະ</th>
                <th class="text-center font-weight-bold">ຈຳນວນບິນ</th>
                <th class="text-right font-weight-bold">ຍອດລວມ (LAK)</th>
                <th class="text-right font-weight-bold" style="width: 250px">ສັດສ່ວນ (%)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pay in reportData.paymentSummary" :key="pay.payment_method">
                <td class="text-uppercase font-weight-bold">
                  <v-icon :icon="getPaymentIcon(pay.payment_method)" size="18" class="me-2" color="primary" />
                  {{ pay.payment_method }}
                </td>
                <td class="text-center">
                  <v-chip size="x-small" variant="tonal" color="grey-darken-2" class="font-weight-bold">{{ pay.transactions }} ບິນ</v-chip>
                </td>
                <td class="text-right font-weight-black">{{ formatCurrency(pay.total) }}</td>
                <td class="text-right">
                  <div class="d-flex align-center gap-3">
                    <v-progress-linear
                      :model-value="(pay.total / reportData.overall.totalRevenue) * 100"
                      color="indigo"
                      height="6"
                      rounded
                      class="flex-1"
                    />
                    <span class="text-caption font-weight-bold" style="width: 45px">{{ ((pay.total / reportData.overall.totalRevenue) * 100).toFixed(1) }}%</span>
                  </div>
                </td>
              </tr>
              <tr v-if="!reportData.paymentSummary?.length">
                <td colspan="4" class="text-center pa-10 text-grey">ບໍ່ມີຂໍ້ມູນການຂາຍໃນວັນທີນີ້</td>
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
const dateMenu = ref(false)
const selectedDate = ref(new Date().toISOString().split('T')[0])
const selectedDateObj = ref(new Date())
const reportData = ref(null)

const fetchData = async () => {
  loading.value = true
  try {
    const res = await api('/reports/shift', { params: { date: selectedDate.value } })
    if (res.success) reportData.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const onDateChange = (val) => {
  if (val) {
    selectedDate.value = new Date(val).toISOString().split('T')[0]
    dateMenu.value = false
    fetchData()
  }
}

const formatCurrency = (val) => new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK', maximumFractionDigits: 0 }).format(val)
const formatDateLao = (val) => new Date(val).toLocaleDateString('lo-LA', { day: '2-digit', month: 'long', year: 'numeric' })

const getPaymentIcon = (m) => ({
  cash: 'mdi-cash',
  transfer: 'mdi-bank',
  credit_card: 'mdi-credit-card'
}[m] || 'mdi-help-circle')

const exportToExcel = () => {
  if (!reportData.value) return
  try {
    const wsData = [
      ['ລາຍງານສະຫຼຸບຍອດປິດກະ'],
      ['ວັນທີ:', formatDateLao(selectedDate.value)],
      [''],
      ['ສະຫຼຸບພາບລວມ'],
      ['ລາຍຮັບທັງໝົດ', reportData.value.overall.totalRevenue, 'LAK'],
      ['ຈຳນວນບິນທັງໝົດ', reportData.value.overall.totalTransactions, 'ບິນ'],
      ['ຄ່າສະເລ່ຍຕໍ່ບິນ', reportData.value.overall.avgTransaction, 'LAK'],
      [''],
      ['ແຍກຕາມຮູບແບບການຊຳລະ'],
      ['ຮູບແບບ', 'ຈຳນວນບິນ', 'ຍອດລວມ']
    ]

    reportData.value.paymentSummary.forEach(p => {
      wsData.push([p.payment_method, p.transactions, p.total])
    })

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'ShiftClosure')
    XLSX.writeFile(wb, `shift_report_${selectedDate.value}.xlsx`)
    showToast('ສົ່ງອອກຂໍ້ມູນສຳເລັດ', 'success')
  } catch (e) {
    showToast('ສົ່ງອອກຂໍ້ມູນຫຼົ້ມເຫຼວ', 'error')
  }
}

onMounted(fetchData)
</script>

<style scoped>
.header-icon-container {
  background-color: rgba(63, 81, 181, 0.1);
  border-color: rgba(63, 81, 181, 0.2) !important;
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

.border {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
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
