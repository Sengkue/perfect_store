<template>
  <v-container fluid class="pa-6">
    <v-row class="mb-6">
      <v-col cols="12" class="d-flex align-center flex-wrap gap-3">
        <div class="header-icon-container rounded-lg pa-3 me-3">
          <v-icon color="success" size="32">mdi-receipt</v-icon>
        </div>
        <div>
          <h1 class="text-h4 font-weight-black mb-1">ລາຍງານການຂາຍ</h1>
          <p class="text-subtitle-1 text-medium-emphasis">ກວດສອບປະຫວັດການຂາຍ ແລະ ສະຖານະການຊຳລະເງິນ</p>
        </div>
        <v-spacer></v-spacer>

        <!-- Search & Filters -->
        <v-card elevation="0" border class="rounded-lg px-4 py-2 d-flex align-center gap-3 bg-white flex-wrap">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="ຄົ້ນຫາ ເລກບິນ / Tracking"
            variant="plain"
            density="compact"
            hide-details
            clearable
            style="width: 200px"
            @update:modelValue="loadSales"
          ></v-text-field>
          <v-divider vertical class="mx-2"></v-divider>
          
          <!-- From Date Menu -->
          <v-menu v-model="menuFrom" :close-on-content-click="false">
            <template v-slot:activator="{ props }">
              <v-text-field
                v-bind="props"
                :model-value="formatDateDisplay(fromDate)"
                label="ເລີ່ມ"
                variant="plain"
                density="compact"
                hide-details
                readonly
                prepend-inner-icon="mdi-calendar"
                style="width: 140px"
                class="cursor-pointer"
              ></v-text-field>
            </template>
            <v-date-picker 
              v-model="fromDateDate" 
              color="primary"
              @update:modelValue="onFromDateSelected"
            ></v-date-picker>
          </v-menu>

          <!-- To Date Menu -->
          <v-menu v-model="menuTo" :close-on-content-click="false">
            <template v-slot:activator="{ props }">
              <v-text-field
                v-bind="props"
                :model-value="formatDateDisplay(toDate)"
                label="ສິ້ນສຸດ"
                variant="plain"
                density="compact"
                hide-details
                readonly
                prepend-inner-icon="mdi-calendar"
                style="width: 140px"
                class="cursor-pointer"
              ></v-text-field>
            </template>
            <v-date-picker 
              v-model="toDateDate" 
              color="primary"
              @update:modelValue="onToDateSelected"
            ></v-date-picker>
          </v-menu>

          <v-divider vertical class="mx-2"></v-divider>
          <v-select
            v-model="statusFilter"
            :items="statusOptions"
            label="ສະຖານະ"
            variant="plain"
            density="compact"
            hide-details
            clearable
            style="width: 120px"
            @update:modelValue="loadSales"
          ></v-select>
        </v-card>

        <!-- Export button -->
        <v-btn
          v-if="hasPermission('sales.report')"
          prepend-icon="mdi-microsoft-excel"
          color="success"
          variant="elevated"
          height="48"
          :loading="exportingExcel"
          @click="exportExcel"
          class="rounded-lg px-6 shadow-soft"
        >
          Export Excel
        </v-btn>
      </v-col>
    </v-row>

    <!-- Data Table -->
    <v-card border elevation="0" class="rounded-lg overflow-hidden shadow-soft">
      <v-data-table
        :headers="headers"
        :items="sales"
        :loading="loading"
        hover
        class="sales-table"
      >
        <!-- Sale Number -->
        <template v-slot:item.sale_number="{ item }">
          <span class="font-weight-bold text-primary">{{ item.sale_number }}</span>
        </template>

        <!-- Customer -->
        <template v-slot:item.customer="{ item }">
          <div v-if="item.customer" class="d-flex align-center py-2">
            <v-avatar size="32" color="blue-lighten-4" class="me-2">
              <span class="text-caption font-weight-bold text-blue-darken-2">{{ item.customer.first_name[0] }}</span>
            </v-avatar>
            <div class="d-flex flex-column">
              <span class="text-subtitle-2">{{ item.customer.first_name }} {{ item.customer.last_name }}</span>
              <span class="text-caption text-grey">{{ item.customer.phone || '—' }}</span>
            </div>
          </div>
          <span v-else class="text-medium-emphasis text-caption">—</span>
        </template>

        <!-- Employee -->
        <template v-slot:item.user="{ item }">
          <v-chip size="x-small" variant="tonal" prepend-icon="mdi-account" v-if="item.user">
            {{ item.user.profile ? `${item.user.profile.first_name} ${item.user.profile.last_name}` : item.user.username }}
          </v-chip>
          <span v-else class="text-medium-emphasis text-caption">—</span>
        </template>

        <!-- Total -->
        <template v-slot:item.total_amount="{ item }">
          <span class="font-weight-black text-subtitle-1">{{ formatCurrency(item.total_amount) }}</span>
        </template>

        <!-- Date -->
        <template v-slot:item.sale_date="{ item }">
          <div class="d-flex flex-column">
            <span>{{ formatDate(item.sale_date) }}</span>
            <span class="text-caption text-grey">{{ formatTime(item.sale_date) }}</span>
          </div>
        </template>

        <!-- Status chips -->
        <template v-slot:item.sale_status="{ item }">
          <v-chip :color="statusColor(item.sale_status)" size="small" variant="flat" class="text-uppercase font-weight-bold">
            {{ item.sale_status }}
          </v-chip>
        </template>

        <template v-slot:item.payment_status="{ item }">
          <v-chip :color="paymentColor(item.payment_status)" size="small" variant="tonal" class="text-uppercase font-weight-bold">
            {{ item.payment_status }}
          </v-chip>
        </template>

        <!-- Actions -->
        <template v-slot:item.actions="{ item }">
          <v-btn icon="mdi-eye-outline" variant="tonal" size="small" color="primary" class="rounded-lg" @click="openDetail(item)"></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- ── Sale Detail Dialog ── -->
    <v-dialog v-model="detailDialog" max-width="720">
      <v-card v-if="detailSale" rounded="xl" class="pa-4">
        <v-card-title class="d-flex align-center pb-4">
          <v-icon icon="mdi-receipt-text-outline" class="me-3" color="primary" size="32"></v-icon>
          <div>
            <div class="text-h5 font-weight-black">ບິນເລກທີ {{ detailSale.sale_number }}</div>
            <div class="text-caption text-grey">ວັນທີ: {{ formatDateFull(detailSale.sale_date) }}</div>
          </div>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="detailDialog = false"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        
        <v-card-text class="pa-6 bg-grey-lighten-5 rounded-lg my-4">
          <v-row dense>
            <v-col cols="12" md="6" class="mb-4">
              <div class="text-caption text-grey mb-1 text-uppercase">ຂໍ້ມູນລູກຄ້າ</div>
              <div class="text-subtitle-1 font-weight-bold">
                {{ detailSale.customer ? `${detailSale.customer.first_name} ${detailSale.customer.last_name}` : 'ລູກຄ້າທົ່ວໄປ (Walk-in)' }}
              </div>
              <div class="text-caption text-grey">{{ detailSale.customer?.phone || '-' }}</div>
            </v-col>
            <v-col cols="12" md="6" class="mb-4 text-md-right">
              <div class="text-caption text-grey mb-1 text-uppercase">ພະນັກງານຂາຍ</div>
              <div class="text-subtitle-1 font-weight-bold">
                {{ detailSale.user?.profile ? `${detailSale.user.profile.first_name} ${detailSale.user.profile.last_name}` : detailSale.user?.username || '—' }}
              </div>
              <div class="text-caption text-grey">Role: {{ detailSale.user?.role }}</div>
            </v-col>
            
            <v-col cols="12"><v-divider class="mb-4"></v-divider></v-col>

            <v-col cols="6" md="3" class="mb-2">
              <div class="text-caption text-grey mb-1">ສະຖານະການຂາຍ</div>
              <v-chip :color="statusColor(detailSale.sale_status)" size="small" variant="flat">{{ detailSale.sale_status }}</v-chip>
            </v-col>
            <v-col cols="6" md="3" class="mb-2">
              <div class="text-caption text-grey mb-1">ການຊຳລະເງິນ</div>
              <v-chip :color="paymentColor(detailSale.payment_status)" size="small" variant="tonal">{{ detailSale.payment_status }}</v-chip>
            </v-col>
            <v-col cols="6" md="3" class="mb-2">
              <div class="text-caption text-grey mb-1">ຮູບແບບການຊຳລະ</div>
              <div class="text-subtitle-2 font-weight-bold text-uppercase">{{ detailSale.payment_method }}</div>
            </v-col>
            <v-col cols="6" md="3" class="mb-2 text-md-right">
              <div class="text-caption text-grey mb-1">ປະເພດການຂາຍ</div>
              <div class="text-subtitle-2 font-weight-bold">{{ detailSale.sale_type }}</div>
            </v-col>
          </v-row>
        </v-card-text>

        <div class="pa-4 bg-primary-lighten-5 rounded-lg border-primary">
          <v-row dense class="align-center">
            <v-col cols="6">
              <div class="text-subtitle-1 font-weight-bold">ຍອດລວມທັງໝົດ</div>
            </v-col>
            <v-col cols="6" class="text-right">
              <div class="text-h4 font-weight-black text-primary">{{ formatCurrency(detailSale.total_amount) }}</div>
            </v-col>
          </v-row>
        </div>

        <v-card-actions class="pa-4 mt-2">
          <v-btn block color="primary" variant="tonal" size="large" class="rounded-lg" @click="detailDialog = false">ປິດໜ້າຈໍ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast } from '~/composables/useToast'
import * as XLSX from 'xlsx'

const api = useApi()
const { hasPermission } = usePermissions()

// ── State ────────────────────────────────────────────────────
const sales         = ref([])
const loading       = ref(false)
const search        = ref('')
const todayStr      = new Date().toISOString().split('T')[0]
const fromDate      = ref(todayStr)
const toDate        = ref(todayStr)
const fromDateDate  = ref(new Date())
const toDateDate    = ref(new Date())
const menuFrom      = ref(false)
const menuTo        = ref(false)
const statusFilter  = ref(null)
const exportingExcel = ref(false)

// Detail dialog
const detailDialog = ref(false)
const detailSale   = ref(null)

// ── Constants ─────────────────────────────────────────────────
const statusOptions = ['pending', 'processing', 'completed', 'cancelled', 'refunded']

const headers = [
  { title: 'ເລກບິນ',     key: 'sale_number' },
  { title: 'ວັນທີ',        key: 'sale_date' },
  { title: 'ລູກຄ້າ',    key: 'customer',        sortable: false },
  { title: 'ພະນັກງານ',    key: 'user',            sortable: false },
  { title: 'ຍອດລວມ',       key: 'total_amount' },
  { title: 'ສະຖານະຂາຍ',      key: 'sale_status' },
  { title: 'ສະຖານະເງິນ',     key: 'payment_status' },
  { title: 'ຈັດການ',     key: 'actions',         sortable: false, align: 'end' }
]

// ── Helpers ───────────────────────────────────────────────────
const formatCurrency = (val) =>
  val != null
    ? new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK', maximumFractionDigits: 0 }).format(val)
    : '—'

const formatDateDisplay = (val) =>
  val ? new Date(val).toLocaleDateString('lo-LA', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'ເລືອກວັນທີ'

const formatDate = (val) =>
  val ? new Date(val).toLocaleDateString('lo-LA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const formatTime = (val) =>
  val ? new Date(val).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' }) : ''

const formatDateFull = (val) =>
  val ? new Date(val).toLocaleString('lo-LA', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : '—'

const statusColor  = (s) => ({ pending: 'orange', processing: 'blue', completed: 'green', cancelled: 'red', refunded: 'purple' }[s] ?? 'grey')
const paymentColor = (s) => ({ paid: 'green', partial: 'orange', pending: 'red', refunded: 'purple' }[s] ?? 'grey')

// Flat rows for export
const toExportRows = () =>
  sales.value.map((s, i) => ({
    '#':             i + 1,
    'Sale Number':   s.sale_number ?? '',
    'Date':          s.sale_date ? new Date(s.sale_date).toLocaleString() : '',
    'Type':          s.sale_type ?? '',
    'Customer':      s.customer  ? `${s.customer.first_name} ${s.customer.last_name}` : '',
    'Employee':      s.user      ? (s.user.profile ? `${s.user.profile.first_name} ${s.user.profile.last_name}` : s.user.username) : '',
    'Subtotal':      Number(s.subtotal       ?? 0),
    'Tax':           Number(s.tax_amount     ?? 0),
    'Discount':      Number(s.discount_amount ?? 0),
    'Total (LAK)':   Number(s.total_amount   ?? 0),
    'Sale Status':   s.sale_status    ?? '',
    'Payment Status':s.payment_status ?? '',
    'Payment Method':s.payment_method ?? ''
  }))

// ── Load data ─────────────────────────────────────────────────
const onFromDateSelected = (val) => {
  if (val) {
    fromDate.value = new Date(val).toISOString().split('T')[0]
    menuFrom.value = false
    loadSales()
  }
}

const onToDateSelected = (val) => {
  if (val) {
    toDate.value = new Date(val).toISOString().split('T')[0]
    menuTo.value = false
    loadSales()
  }
}

const loadSales = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({ pageSize: 1000 })
    if (search.value)       params.set('search',      search.value)
    if (fromDate.value)     params.set('from_date',   fromDate.value)
    if (toDate.value)       params.set('to_date',     toDate.value)
    if (statusFilter.value) params.set('sale_status', statusFilter.value)

    const res = await api(`/sales?${params.toString()}`)
    if (res.success) sales.value = res.data
  } catch (err) {
    console.error(err)
    showToast('Failed to load sales', 'error')
  } finally {
    loading.value = false
  }
}

// ── Detail dialog ─────────────────────────────────────────────
const openDetail = (item) => {
  detailSale.value  = item
  detailDialog.value = true
}

// ── Export: Excel ─────────────────────────────────────────────
const exportExcel = async () => {
  if (!sales.value.length) { showToast('No data to export', 'warning'); return }
  exportingExcel.value = true
  try {
    const rows = toExportRows()
    const ws   = XLSX.utils.json_to_sheet(rows)

    // Column widths
    ws['!cols'] = [
      { wch: 4 }, { wch: 16 }, { wch: 20 }, { wch: 10 },
      { wch: 20 }, { wch: 20 }, { wch: 14 }, { wch: 12 },
      { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 16 }
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sales')

    const fileName = `sales_export_${new Date().toISOString().slice(0, 10)}.xlsx`
    XLSX.writeFile(wb, fileName)
    showToast(`Exported ${rows.length} records to ${fileName}`, 'success')
  } catch (err) {
    console.error(err)
    showToast('Excel export failed', 'error')
  } finally {
    exportingExcel.value = false
  }
}

// ── Init ──────────────────────────────────────────────────────
onMounted(loadSales)
</script>

<style scoped>
.header-icon-container {
  background-color: rgba(76, 175, 80, 0.1);
}

.shadow-soft {
  box-shadow: 0 4px 20px rgba(0,0,0,0.04) !important;
}

.sales-table :deep(th) {
  font-weight: bold !important;
  color: #555 !important;
  background-color: #FAFAFA !important;
}

.bg-primary-lighten-5 {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.border-primary {
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}
</style>
