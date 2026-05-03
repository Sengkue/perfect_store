<template>
  <v-container fluid class="pa-2 container-border">
    <v-row class="mb-2">
      <v-col cols="12" class="d-flex align-center flex-wrap gap-2">
        <div class="header-icon-container rounded-lg pa-3 me-3">
          <v-icon color="teal" size="28">mdi-file-percent</v-icon>
        </div>
        <div>
          <h1 class="text-h5 font-weight-black mb-1">ລາຍງານພາສີ</h1>
          <p class="text-caption text-medium-emphasis">ສະຫຼຸບຍອດຂາຍ ແລະ ອາກອນມູນຄ່າເພີ່ມ (VAT)</p>
        </div>
        <v-spacer></v-spacer>

        <!-- Date Filters -->
        <v-card elevation="0" border class="rounded-lg px-2 py-1 d-flex align-center gap-2 bg-white shadow-soft">
          <!-- Start Date -->
          <v-menu v-model="menuStart" :close-on-content-click="false">
            <template v-slot:activator="{ props }">
              <v-text-field
                v-bind="props"
                v-model="startDateFormatted"
                label="ເລີ່ມ"
                variant="plain"
                density="compact"
                hide-details
                readonly
                prepend-inner-icon="mdi-calendar"
                style="width: 150px"
              ></v-text-field>
            </template>
            <v-date-picker v-model="startDateValue" color="teal" @update:model-value="menuStart = false"></v-date-picker>
          </v-menu>

          <v-icon icon="mdi-arrow-right" color="grey"></v-icon>

          <!-- End Date -->
          <v-menu v-model="menuEnd" :close-on-content-click="false">
            <template v-slot:activator="{ props }">
              <v-text-field
                v-bind="props"
                v-model="endDateFormatted"
                label="ສິ້ນສຸດ"
                variant="plain"
                density="compact"
                hide-details
                readonly
                prepend-inner-icon="mdi-calendar"
                style="width: 150px"
              ></v-text-field>
            </template>
            <v-date-picker v-model="endDateValue" color="teal" @update:model-value="menuEnd = false"></v-date-picker>
          </v-menu>

          <v-divider vertical class="mx-2"></v-divider>
          <v-btn color="teal" variant="elevated" class="rounded-lg mr-2" @click="fetchData" :loading="loading">ຄຳນວນ</v-btn>
          <v-btn color="success" variant="tonal" prepend-icon="mdi-file-excel" @click="exportToExcel">Export</v-btn>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="taxData" class="mt-n2">
      <v-col cols="12" sm="4">
        <v-card border elevation="0" class="rounded-lg pa-4 h-100 shadow-soft">
          <div class="text-overline text-grey opacity-80" style="line-height: 1.2">ຍອດຂາຍສຸດທິ (Net Sales)</div>
          <div class="text-h6 font-weight-black mt-1 text-teal">{{ formatCurrency(taxData.netSales || 0) }}</div>
          <div class="text-caption text-grey">ຍອດຂາຍກ່ອນຄິດໄລ່ພາສີ</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card border elevation="0" class="rounded-lg pa-4 h-100 bg-teal-lighten-5 shadow-soft border-teal-lighten-4">
          <div class="text-overline text-teal opacity-80" style="line-height: 1.2">ອາກອນມູນຄ່າເພີ່ມ (Total VAT)</div>
          <div class="text-h5 font-weight-black text-teal mt-1">{{ formatCurrency(taxData.totalTax || 0) }}</div>
          <div class="text-caption text-teal">Total Tax Collected</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card border elevation="0" class="rounded-lg pa-4 h-100 shadow-soft">
          <div class="text-overline text-grey opacity-80" style="line-height: 1.2">ຍອດຂາຍລວມພາສີ (Gross Sales)</div>
          <div class="text-h6 font-weight-black mt-1">{{ formatCurrency(taxData.grossSales || 0) }}</div>
          <div class="text-caption text-grey">Total Including Tax</div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import * as XLSX from 'xlsx'
import { showToast } from '~/composables/useToast'
const api = useApi()

const loading = ref(false)
const menuStart = ref(false)
const menuEnd = ref(false)

// Internal Date objects for v-date-picker
const startDateValue = ref(new Date())
const endDateValue = ref(new Date())

// Formatted strings for display
const startDateFormatted = computed(() => formatDate(startDateValue.value))
const endDateFormatted = computed(() => formatDate(endDateValue.value))

// API-ready strings (YYYY-MM-DD)
const startDate = computed(() => toISODate(startDateValue.value))
const endDate = computed(() => toISODate(endDateValue.value))

const taxData = ref(null)

// Helper to format for display
function formatDate(date) {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-GB').format(date)
}

// Helper for API format
function toISODate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await api('/reports/tax', { params: { startDate: startDate.value, endDate: endDate.value } })
    if (res.success) taxData.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const formatCurrency = (val) => new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK', maximumFractionDigits: 0 }).format(val)

const exportToExcel = () => {
  if (!taxData.value) return
  try {
    const wsData = [
      ['ລາຍງານພາສີ'],
      ['ໄລຍະເວລາ:', `${startDate.value} ຫາ ${endDate.value}`],
      [''],
      ['ລາຍລະອຽດ'],
      ['ຍອດຂາຍສຸດທິ (Net Sales)', taxData.value.netSales, 'LAK'],
      ['ອາກອນມູນຄ່າເພີ່ມ (Total VAT)', taxData.value.totalTax, 'LAK'],
      ['ຍອດຂາຍລວມພາສີ (Gross Sales)', taxData.value.grossSales, 'LAK']
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'TaxReport')
    XLSX.writeFile(wb, `tax_report_${startDate.value}_to_${endDate.value}.xlsx`)
    showToast('ສົ່ງອອກຂໍ້ມູນສຳເລັດ', 'success')
  } catch (e) {
    showToast('ສົ່ງອອກຂໍ້ມູນຫຼົ້ມເຫຼວ', 'error')
  }
}

onMounted(fetchData)
</script>

<style scoped>
.header-icon-container { background-color: rgba(0, 150, 136, 0.1); }
.container-border {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  background-color: rgb(var(--v-theme-surface));
  margin-top: 8px;
}
.shadow-soft { box-shadow: 0 4px 20px rgba(0,0,0,0.04) !important; }
.border-teal-lighten-4 { border-left: 4px solid #4DB6AC !important; }
</style>
