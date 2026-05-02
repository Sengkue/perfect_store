<template>
  <v-container fluid class="pa-6">
    <v-row class="mb-6">
      <v-col cols="12" class="d-flex align-center flex-wrap gap-3">
        <div class="header-icon-container rounded-xl pa-3 me-3">
          <v-icon color="indigo" size="32">mdi-calendar-check</v-icon>
        </div>
        <div>
          <h1 class="text-h4 font-weight-black mb-1">ສະຫຼຸບຍອດປິດກະ</h1>
          <p class="text-subtitle-1 text-medium-emphasis">ສະຫຼຸບລາຍຮັບແຍກຕາມຮູບແບບການຊຳລະເງິນປະຈຳວັນ</p>
        </div>
        <v-spacer></v-spacer>

        <v-card elevation="0" border class="rounded-xl px-4 py-2 d-flex align-center gap-3 bg-white">
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
                style="width: 180px"
              ></v-text-field>
            </template>
            <v-date-picker v-model="selectedDateObj" @update:modelValue="onDateChange" color="indigo"></v-date-picker>
          </v-menu>
          <v-divider vertical class="mx-2"></v-divider>
          <v-btn color="indigo" variant="elevated" class="rounded-lg mr-2" @click="fetchData" :loading="loading">
            ໂຫຼດຂໍ້ມູນ
          </v-btn>
          <v-btn color="success" variant="tonal" prepend-icon="mdi-file-excel" @click="exportToExcel">
            Export
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="reportData">
      <!-- Summary Cards -->
      <v-col cols="12" md="4">
        <v-card border elevation="0" class="rounded-xl pa-6 h-100 bg-indigo-lighten-5">
          <div class="text-overline text-indigo">ລາຍຮັບທັງໝົດ</div>
          <div class="text-h3 font-weight-black text-indigo mt-2">{{ formatCurrency(reportData.overall?.totalRevenue || 0) }}</div>
          <div class="text-subtitle-2 mt-2">ຈາກທັງໝົດ {{ reportData.overall?.totalTransactions || 0 }} ລາຍການ</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card border elevation="0" class="rounded-xl pa-6 h-100">
          <div class="text-overline text-grey">ຄ່າສະເລ່ຍຕໍ່ບິນ</div>
          <div class="text-h4 font-weight-black mt-2">{{ formatCurrency(reportData.overall?.avgTransaction || 0) }}</div>
          <div class="text-caption text-grey mt-1">Average Revenue Per Bill</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card border elevation="0" class="rounded-xl pa-6 h-100">
          <div class="text-overline text-grey">ວັນທີລາຍງານ</div>
          <div class="text-h4 font-weight-black mt-2 text-uppercase">{{ formatDateLao(selectedDate) }}</div>
          <div class="text-caption text-grey mt-1">Daily Closure Date</div>
        </v-card>
      </v-col>

      <!-- Payment Breakdown -->
      <v-col cols="12">
        <v-card border elevation="0" class="rounded-xl overflow-hidden shadow-soft">
          <v-card-title class="pa-4 bg-grey-lighten-4 font-weight-bold">
            ແຍກຕາມຮູບແບບການຊຳລະເງິນ (Payment Methods)
          </v-card-title>
          <v-divider></v-divider>
          <v-table>
            <thead>
              <tr class="bg-grey-lighten-5">
                <th class="text-left font-weight-bold">ຮູບແບບການຊຳລະ</th>
                <th class="text-center font-weight-bold">ຈຳນວນບິນ</th>
                <th class="text-right font-weight-bold">ຍອດລວມ (LAK)</th>
                <th class="text-right font-weight-bold">ສັດສ່ວນ (%)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pay in reportData.paymentSummary" :key="pay.payment_method">
                <td class="text-uppercase font-weight-bold">
                  <v-icon :icon="getPaymentIcon(pay.payment_method)" size="small" class="me-2" color="primary"></v-icon>
                  {{ pay.payment_method }}
                </td>
                <td class="text-center">{{ pay.transactions }} ບິນ</td>
                <td class="text-right font-weight-black">{{ formatCurrency(pay.total) }}</td>
                <td class="text-right">
                  <v-progress-linear
                    :model-value="(pay.total / reportData.overall.totalRevenue) * 100"
                    color="indigo"
                    height="8"
                    rounded
                  ></v-progress-linear>
                  <span class="text-caption">{{ ((pay.total / reportData.overall.totalRevenue) * 100).toFixed(1) }}%</span>
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
.header-icon-container { background-color: rgba(63, 81, 181, 0.1); }
.shadow-soft { box-shadow: 0 4px 20px rgba(0,0,0,0.04) !important; }
</style>
