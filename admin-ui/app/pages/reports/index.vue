<template>
  <v-container fluid class="pa-6">
    <v-row class="mb-6">
      <v-col cols="12" class="d-flex align-center flex-wrap gap-3">
        <div class="header-icon-container rounded-xl pa-3 me-3">
          <v-icon color="primary" size="32">mdi-chart-box</v-icon>
        </div>
        <div>
          <h1 class="text-h4 font-weight-black mb-1">ວິເຄາະທຸລະກິດ</h1>
          <p class="text-subtitle-1 text-medium-emphasis">ພາບລວມການເຕີບໂຕ ແລະ ສະຖານະການເງິນຂອງຮ້ານ</p>
        </div>
        <v-spacer></v-spacer>

        <!-- Date Filter & Export -->
        <v-card elevation="0" border class="rounded-xl px-4 py-2 d-flex align-center gap-3 bg-white shadow-soft">
          <!-- Start Date -->
          <v-menu v-model="startMenu" :close-on-content-click="false">
            <template v-slot:activator="{ props }">
              <v-text-field
                v-model="startDate"
                label="ແຕ່ວັນທີ"
                prepend-inner-icon="mdi-calendar"
                variant="plain"
                density="compact"
                hide-details
                readonly
                v-bind="props"
                style="width: 160px"
              ></v-text-field>
            </template>
            <v-date-picker v-model="startDateDate" @update:modelValue="onStartDateChange" color="primary"></v-date-picker>
          </v-menu>

          <v-icon icon="mdi-arrow-right" color="grey-lighten-1"></v-icon>

          <!-- End Date -->
          <v-menu v-model="endMenu" :close-on-content-click="false">
            <template v-slot:activator="{ props }">
              <v-text-field
                v-model="endDate"
                label="ເຖິງວັນທີ"
                prepend-inner-icon="mdi-calendar"
                variant="plain"
                density="compact"
                hide-details
                readonly
                v-bind="props"
                style="width: 160px"
              ></v-text-field>
            </template>
            <v-date-picker v-model="endDateDate" @update:modelValue="onEndDateChange" color="primary"></v-date-picker>
          </v-menu>

          <v-divider vertical class="mx-2"></v-divider>
          <v-btn
            color="primary"
            variant="elevated"
            class="rounded-lg px-6"
            @click="fetchSummary"
            :loading="loading"
          >
            ຄຳນວນໃໝ່
          </v-btn>
          <v-btn
            color="success"
            variant="tonal"
            prepend-icon="mdi-file-excel"
            class="rounded-lg px-6"
            @click="exportToExcel"
          >
            Export
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Financial Metric Cards -->
    <v-row class="mb-8">
      <v-col v-for="(metric, i) in metrics" :key="i" cols="12" sm="6" md="3">
        <v-card 
          border 
          elevation="0" 
          class="rounded-xl overflow-hidden shadow-soft metric-card"
          :style="{ background: metric.gradient }"
        >
          <div class="pa-6">
            <div class="d-flex justify-space-between align-start mb-4">
              <div>
                <div class="text-subtitle-2 font-weight-bold mb-1" :style="{ color: metric.textColor }">
                  {{ metric.label }}
                </div>
                <div class="text-h5 font-weight-black" :style="{ color: metric.textColor }">
                  {{ formatCurrency(metric.value) }}
                </div>
              </div>
              <v-avatar :color="metric.iconBg" size="44" class="shadow-sm">
                <v-icon :icon="metric.icon" :color="metric.iconColor"></v-icon>
              </v-avatar>
            </div>
            <div class="text-caption" :style="{ color: metric.textColor, opacity: 0.7 }">
              {{ metric.desc }}
            </div>
          </div>
          <div class="decoration-shape" :style="{ backgroundColor: metric.decorationColor }"></div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- Sales Trend Bar Chart (8/12) -->
      <v-col cols="12" lg="8">
        <v-card border elevation="0" class="rounded-xl pa-6 bg-white shadow-soft overflow-hidden h-100">
          <div class="d-flex align-center mb-8">
            <v-icon icon="mdi-finance" color="primary" class="me-2"></v-icon>
            <h2 class="text-h6 font-weight-bold">ແນວໂນ້ມລາຍຮັບປະຈຳວັນ</h2>
            <v-spacer></v-spacer>
            <v-chip size="small" variant="tonal" color="primary">ຍອດຂາຍປະຈຳວັນ</v-chip>
          </div>
          
          <div class="chart-container" style="height: 350px; position: relative;">
            <!-- Background Grid -->
            <div class="position-absolute w-100 h-100 d-flex flex-column justify-space-between ps-12 pe-4 pt-10 pb-12 opacity-10">
              <div v-for="i in 5" :key="i" class="border-bottom w-100"></div>
            </div>

            <div class="d-flex align-end justify-space-between h-100 px-4 pt-10 pb-4 position-relative" style="z-index: 1;">
              <div v-for="day in chartData" :key="day.date" class="flex-grow-1 mx-2 text-center d-flex flex-column align-center justify-end" style="height: 100%;">
                <div class="text-caption font-weight-black text-primary mb-1 bar-value-label">
                  {{ formatCurrencyShort(day.total) }}
                </div>
                <v-tooltip location="top" offset="10">
                  <template v-slot:activator="{ props }">
                    <div 
                      v-bind="props"
                      class="chart-bar rounded-t-xl transition-all position-relative overflow-hidden" 
                      :style="{ 
                        height: `${(day.total / maxChartValue * 100)}%`,
                        width: '100%',
                        maxWidth: '56px',
                        background: 'linear-gradient(180deg, #1976D2 0%, #64B5F6 100%)',
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
                      }"
                    >
                      <div class="bar-shine"></div>
                    </div>
                  </template>
                  <div class="pa-2">
                    <div class="text-caption font-weight-bold">{{ formatDateFull(day.date) }}</div>
                    <div class="text-h6 font-weight-black">{{ formatCurrency(day.total) }}</div>
                  </div>
                </v-tooltip>
                <div class="text-caption text-grey-darken-1 mt-4 font-weight-bold">{{ formatDate(day.date) }}</div>
              </div>
            </div>
            
            <!-- Y-axis markers -->
            <div class="position-absolute left-0 top-0 h-100 ps-4 pt-10 pb-12 d-flex flex-column justify-space-between text-caption text-grey opacity-50 font-weight-bold" style="pointer-events: none;">
              <span>{{ formatCurrencyShort(maxChartValue) }}</span>
              <span>{{ formatCurrencyShort(maxChartValue * 0.5) }}</span>
              <span>0</span>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Financial Distribution Donut Chart (4/12) -->
      <v-col cols="12" lg="4">
        <v-card border elevation="0" class="rounded-xl pa-6 bg-white shadow-soft h-100">
          <div class="d-flex align-center mb-8">
            <v-icon icon="mdi-chart-donut" color="primary" class="me-2"></v-icon>
            <h2 class="text-h6 font-weight-bold">ສັດສ່ວນລາຍຮັບ</h2>
          </div>

          <div class="d-flex flex-column align-center justify-center pt-4">
            <!-- Pure SVG Donut Chart -->
            <div class="position-relative d-flex align-center justify-center">
              <svg width="220" height="220" viewBox="0 0 42 42" class="donut-svg">
                <circle class="donut-hole" cx="21" cy="21" r="15.915" fill="transparent"></circle>
                <circle class="donut-ring" cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f1f1" stroke-width="4"></circle>
                
                <!-- Profit Segment -->
                <circle 
                  class="donut-segment" cx="21" cy="21" r="15.915" fill="transparent" 
                  stroke="#4CAF50" stroke-width="4" 
                  :stroke-dasharray="`${profitPercentage} ${100 - profitPercentage}`" 
                  stroke-dashoffset="25"
                ></circle>
                
                <!-- COGS Segment -->
                <circle 
                  class="donut-segment" cx="21" cy="21" r="15.915" fill="transparent" 
                  stroke="#FF9800" stroke-width="4" 
                  :stroke-dasharray="`${cogsPercentage} ${100 - cogsPercentage}`" 
                  :stroke-dashoffset="25 - profitPercentage"
                ></circle>

                 <!-- Expenses Segment -->
                 <circle 
                  class="donut-segment" cx="21" cy="21" r="15.915" fill="transparent" 
                  stroke="#E91E63" stroke-width="4" 
                  :stroke-dasharray="`${expensePercentage} ${100 - expensePercentage}`" 
                  :stroke-dashoffset="25 - profitPercentage - cogsPercentage"
                ></circle>
              </svg>
              
              <div class="position-absolute text-center">
                <div class="text-caption text-grey">ກຳໄລສຸດທິ</div>
                <div class="text-h5 font-weight-black text-success">{{ profitPercentage.toFixed(1) }}%</div>
              </div>
            </div>

            <!-- Legend -->
            <div class="w-100 mt-10">
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="d-flex align-center">
                  <div class="legend-dot bg-success me-2"></div>
                  <span class="text-body-2">ກຳໄລເບື້ອງຕົ້ນ</span>
                </div>
                <span class="text-body-2 font-weight-bold">{{ formatCurrency(summary.profit) }}</span>
              </div>
              <v-divider class="mb-3"></v-divider>
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="d-flex align-center">
                  <div class="legend-dot bg-orange me-2"></div>
                  <span class="text-body-2">ຕົ້ນທຶນສິນຄ້າ</span>
                </div>
                <span class="text-body-2 font-weight-bold">{{ formatCurrency(summary.cogs) }}</span>
              </div>
              <v-divider class="mb-3"></v-divider>
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <div class="legend-dot bg-pink me-2"></div>
                  <span class="text-body-2">ລາຍຈ່າຍນຳເຂົ້າ</span>
                </div>
                <span class="text-body-2 font-weight-bold">{{ formatCurrency(summary.expenses) }}</span>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { showToast } from '~/composables/useToast'
import * as XLSX from 'xlsx'

const api = useApi()
const loading = ref(false)
const startMenu = ref(false)
const endMenu = ref(false)

const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

const startDateDate = ref(thirtyDaysAgo)
const endDateDate = ref(new Date())
const startDate = ref(thirtyDaysAgo.toISOString().split('T')[0])
const endDate = ref(new Date().toISOString().split('T')[0])

const summary = ref({
  revenue: 1,
  cogs: 0,
  profit: 0,
  expenses: 0
})

const chartData = ref([])

const profitPercentage = computed(() => (summary.value.profit / (summary.value.revenue || 1)) * 100)
const cogsPercentage = computed(() => (summary.value.cogs / (summary.value.revenue || 1)) * 100)
const expensePercentage = computed(() => (summary.value.expenses / (summary.value.revenue || 1)) * 100)

const metrics = computed(() => [
  { 
    label: 'ລາຍຮັບທັງໝົດ', 
    value: summary.value.revenue, 
    desc: 'ຈາກການຂາຍທັງໝົດ',
    icon: 'mdi-cash-register',
    gradient: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
    textColor: '#0D47A1',
    iconColor: '#1976D2',
    iconBg: 'white',
    decorationColor: 'rgba(25, 118, 210, 0.05)'
  },
  { 
    label: 'ຕົ້ນທຶນສິນຄ້າ', 
    value: summary.value.cogs, 
    desc: 'Cost of Goods Sold',
    icon: 'mdi-tag-outline',
    gradient: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)',
    textColor: '#E65100',
    iconColor: '#F57C00',
    iconBg: 'white',
    decorationColor: 'rgba(245, 124, 0, 0.05)'
  },
  { 
    label: 'ກຳໄລເບື້ອງຕົ້ນ', 
    value: summary.value.profit, 
    desc: 'ລາຍຮັບ - ຕົ້ນທຶນສິນຄ້າ',
    icon: 'mdi-trending-up',
    gradient: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
    textColor: '#1B5E20',
    iconColor: '#388E3C',
    iconBg: 'white',
    decorationColor: 'rgba(56, 142, 60, 0.05)'
  },
  { 
    label: 'ລາຍຈ່າຍນຳເຂົ້າ', 
    value: summary.value.expenses, 
    desc: 'ລາຍຈ່າຍທັງໝົດ',
    icon: 'mdi-truck-delivery-outline',
    gradient: 'linear-gradient(135deg, #FCE4EC 0%, #F8BBD0 100%)',
    textColor: '#880E4F',
    iconColor: '#C2185B',
    iconBg: 'white',
    decorationColor: 'rgba(194, 24, 91, 0.05)'
  }
])

const maxChartValue = computed(() => {
  const totals = chartData.value.map(d => Number(d.total))
  return Math.max(...totals, 100000) * 1.2
})

const fetchSummary = async () => {
  loading.value = true
  try {
    const res = await api('/reports/summary', {
      params: { startDate: startDate.value, endDate: endDate.value }
    })
    if (res.success) {
      summary.value = res.data
    }

    const chartRes = await api('/reports/sales-chart', {
      params: { startDate: startDate.value, endDate: endDate.value }
    })
    if (chartRes.success) {
      chartData.value = chartRes.data
    }
  } catch (e) {
    console.error('Failed to fetch dashboard data', e)
  } finally {
    loading.value = false
  }
}

const onStartDateChange = (val) => {
  if (val) {
    startDate.value = new Date(val).toISOString().split('T')[0]
    startMenu.value = false
    fetchSummary()
  }
}

const onEndDateChange = (val) => {
  if (val) {
    endDate.value = new Date(val).toISOString().split('T')[0]
    endMenu.value = false
    fetchSummary()
  }
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK', maximumFractionDigits: 0 }).format(val)
}

const formatCurrencyShort = (val) => {
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M'
  if (val >= 1000) return (val / 1000).toFixed(0) + 'K'
  return val
}

const formatDate = (val) => {
  if (!val) return '-'
  return new Date(val).toLocaleDateString('lo-LA', { day: '2-digit', month: 'short' })
}

const formatDateFull = (val) => {
  if (!val) return '-'
  return new Date(val).toLocaleDateString('lo-LA', { day: '2-digit', month: 'long', year: 'numeric' })
}

const exportToExcel = () => {
  try {
    if (!summary.value.revenue && !chartData.value.length) {
      showToast('ບໍ່ມີຂໍ້ມູນທີ່ຈະສົ່ງອອກ', 'warning')
      return
    }

    const wsData = [
      ['ລາຍງານພາບລວມທຸລະກິດ'],
      ['ແຕ່ວັນທີ:', startDate.value, 'ເຖິງວັນທີ:', endDate.value],
      [''],
      ['ຫົວຂໍ້', 'ມູນຄ່າ', 'ລາຍລະອຽດ'],
      ['ລາຍຮັບທັງໝົດ', summary.value.revenue, 'ຈາກການຂາຍ'],
      ['ຕົ້ນທຶນສິນຄ້າ', summary.value.cogs, 'Cost of Goods Sold'],
      ['ກຳໄລເບື້ອງຕົ້ນ', summary.value.profit, 'ລາຍຮັບ - ຕົ້ນທຶນ'],
      ['ລາຍຈ່າຍນຳເຂົ້າ', summary.value.expenses, 'ລາຍຈ່າຍທັງໝົດ'],
      [''],
      ['ແນວໂນ້ມການຂາຍ 7 ວັນ'],
      ['ວັນທີ', 'ຍອດຂາຍ'],
      ...chartData.value.map(d => [formatDate(d.date), d.total])
    ]

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'BusinessSummary')

    const fileName = `business_summary_${startDate.value}_to_${endDate.value}.xlsx`
    XLSX.writeFile(wb, fileName)
    showToast('ສົ່ງອອກຂໍ້ມູນສຳເລັດ', 'success')
  } catch (e) {
    console.error('Export failed', e)
    showToast('ສົ່ງອອກຂໍ້ມູນຫຼົ້ມເຫຼວ', 'error')
  }
}

onMounted(fetchSummary)
</script>

<style scoped>
.header-icon-container {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.shadow-soft {
  box-shadow: 0 4px 20px rgba(0,0,0,0.04) !important;
}

.metric-card {
  position: relative;
  transition: transform 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-5px);
}

.decoration-shape {
  position: absolute;
  right: -20px;
  bottom: -20px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  z-index: 0;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.chart-bar {
  cursor: pointer;
}

.chart-bar:hover {
  transform: scaleX(1.05);
  filter: brightness(1.1);
}

.bar-shine {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50%;
  background: linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%);
  z-index: 1;
}

.bar-value-label {
  opacity: 0.6;
  font-size: 10px !important;
}

.chart-bar:hover + .bar-value-label,
.flex-column:hover .bar-value-label {
  opacity: 1;
  transform: translateY(-2px);
  color: #1565C0 !important;
}

.transition-all {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Donut Chart Styles */
.donut-svg {
  transform: rotate(-90deg);
}

.donut-segment {
  transition: stroke-dasharray 0.5s ease;
}
</style>
