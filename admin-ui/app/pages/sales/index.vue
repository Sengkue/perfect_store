<template>
  <v-card rounded="lg" elevation="2" v-if="hasPermission('sales.view')">
    <!-- Header -->
    <v-card-title class="d-flex align-center py-3 px-4 flex-wrap gap-2">
      <span class="text-h6 font-weight-bold">Sales</span>
      <v-spacer></v-spacer>

      <!-- Search -->
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Search sale / tracking"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        style="max-width: 220px"
        @update:modelValue="loadSales"
      ></v-text-field>

      <!-- Date From -->
      <v-text-field
        v-model="fromDate"
        type="date"
        label="From"
        variant="outlined"
        density="compact"
        hide-details
        style="max-width: 160px"
        @update:modelValue="loadSales"
      ></v-text-field>

      <!-- Date To -->
      <v-text-field
        v-model="toDate"
        type="date"
        label="To"
        variant="outlined"
        density="compact"
        hide-details
        style="max-width: 160px"
        @update:modelValue="loadSales"
      ></v-text-field>

      <!-- Status filter -->
      <v-select
        v-model="statusFilter"
        :items="statusOptions"
        label="Status"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        style="max-width: 140px"
        @update:modelValue="loadSales"
      ></v-select>

      <!-- Export buttons -->
      <v-btn-group variant="outlined" density="comfortable" divided v-if="hasPermission('sales.report')">
        <v-btn
          prepend-icon="mdi-microsoft-excel"
          color="success"
          :loading="exportingExcel"
          @click="exportExcel"
        >Excel</v-btn>
        <v-btn
          prepend-icon="mdi-microsoft-word"
          color="primary"
          :loading="exportingWord"
          @click="exportWord"
        >Word</v-btn>
      </v-btn-group>
    </v-card-title>
    <v-divider></v-divider>

    <!-- Data Table -->
    <v-data-table
      :headers="headers"
      :items="sales"
      :loading="loading"
      hover
    >
      <!-- Customer -->
      <template v-slot:item.customer="{ item }">
        <span v-if="item.customer">
          {{ item.customer.first_name }} {{ item.customer.last_name }}
        </span>
        <span v-else class="text-medium-emphasis text-caption">—</span>
      </template>

      <!-- Employee -->
      <template v-slot:item.employee="{ item }">
        <span v-if="item.employee">
          {{ item.employee.first_name }} {{ item.employee.last_name }}
        </span>
        <span v-else class="text-medium-emphasis text-caption">—</span>
      </template>

      <!-- Total -->
      <template v-slot:item.total_amount="{ item }">
        {{ formatCurrency(item.total_amount) }}
      </template>

      <!-- Date -->
      <template v-slot:item.sale_date="{ item }">
        {{ formatDate(item.sale_date) }}
      </template>

      <!-- Status chips -->
      <template v-slot:item.sale_status="{ item }">
        <v-chip :color="statusColor(item.sale_status)" size="small" variant="tonal">
          {{ item.sale_status }}
        </v-chip>
      </template>

      <template v-slot:item.payment_status="{ item }">
        <v-chip :color="paymentColor(item.payment_status)" size="small" variant="tonal">
          {{ item.payment_status }}
        </v-chip>
      </template>

      <!-- Actions -->
      <template v-slot:item.actions="{ item }">
        <v-btn icon="mdi-eye" variant="text" size="small" color="primary" @click="openDetail(item)"></v-btn>
      </template>
    </v-data-table>

    <!-- ── Sale Detail Dialog ── -->
    <v-dialog v-model="detailDialog" max-width="680">
      <v-card v-if="detailSale" rounded="lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-receipt-text-outline" class="me-2" color="primary"></v-icon>
          Sale {{ detailSale.sale_number }}
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-4">
          <v-row dense>
            <v-col cols="6"><strong>Date:</strong> {{ formatDate(detailSale.sale_date) }}</v-col>
            <v-col cols="6"><strong>Type:</strong> {{ detailSale.sale_type }}</v-col>
            <v-col cols="6">
              <strong>Customer:</strong>
              {{ detailSale.customer ? `${detailSale.customer.first_name} ${detailSale.customer.last_name}` : '—' }}
            </v-col>
            <v-col cols="6">
              <strong>Employee:</strong>
              {{ detailSale.employee ? `${detailSale.employee.first_name} ${detailSale.employee.last_name}` : '—' }}
            </v-col>
            <v-col cols="6">
              <strong>Sale Status:</strong>
              <v-chip :color="statusColor(detailSale.sale_status)" size="small" variant="tonal" class="ms-1">
                {{ detailSale.sale_status }}
              </v-chip>
            </v-col>
            <v-col cols="6">
              <strong>Payment:</strong>
              <v-chip :color="paymentColor(detailSale.payment_status)" size="small" variant="tonal" class="ms-1">
                {{ detailSale.payment_status }}
              </v-chip>
            </v-col>
            <v-col cols="6"><strong>Subtotal:</strong> {{ formatCurrency(detailSale.subtotal) }}</v-col>
            <v-col cols="6"><strong>Tax:</strong> {{ formatCurrency(detailSale.tax_amount) }}</v-col>
            <v-col cols="6"><strong>Discount:</strong> {{ formatCurrency(detailSale.discount_amount) }}</v-col>
            <v-col cols="6"><strong>Total:</strong> <span class="text-primary font-weight-bold">{{ formatCurrency(detailSale.total_amount) }}</span></v-col>
          </v-row>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="detailDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast } from '~/composables/useToast'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, WidthType
} from 'docx'

const api = useApi()
const { hasPermission } = usePermissions()

// ── State ────────────────────────────────────────────────────
const sales         = ref([])
const loading       = ref(false)
const search        = ref('')
const fromDate      = ref('')
const toDate        = ref('')
const statusFilter  = ref(null)
const exportingExcel = ref(false)
const exportingWord  = ref(false)

// Detail dialog
const detailDialog = ref(false)
const detailSale   = ref(null)

// ── Constants ─────────────────────────────────────────────────
const statusOptions = ['pending', 'processing', 'completed', 'cancelled', 'refunded']

const headers = [
  { title: 'Sale No',     key: 'sale_number' },
  { title: 'Date',        key: 'sale_date' },
  { title: 'Type',        key: 'sale_type' },
  { title: 'Customer',    key: 'customer',        sortable: false },
  { title: 'Employee',    key: 'employee',        sortable: false },
  { title: 'Total',       key: 'total_amount' },
  { title: 'Status',      key: 'sale_status' },
  { title: 'Payment',     key: 'payment_status' },
  { title: 'Actions',     key: 'actions',         sortable: false, align: 'end' }
]

// ── Helpers ───────────────────────────────────────────────────
const formatCurrency = (val) =>
  val != null
    ? new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(val)
    : '—'

const formatDate = (val) =>
  val ? new Date(val).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
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
    'Employee':      s.employee  ? `${s.employee.first_name} ${s.employee.last_name}` : '',
    'Subtotal':      Number(s.subtotal       ?? 0),
    'Tax':           Number(s.tax_amount     ?? 0),
    'Discount':      Number(s.discount_amount ?? 0),
    'Total (LAK)':   Number(s.total_amount   ?? 0),
    'Sale Status':   s.sale_status    ?? '',
    'Payment Status':s.payment_status ?? '',
    'Payment Method':s.payment_method ?? ''
  }))

// ── Load data ─────────────────────────────────────────────────
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

// ── Export: Word ──────────────────────────────────────────────
const exportWord = async () => {
  if (!sales.value.length) { showToast('No data to export', 'warning'); return }
  exportingWord.value = true
  try {
    const rows = toExportRows()
    const colKeys = Object.keys(rows[0])

    // Header row
    const headerCells = colKeys.map(k =>
      new TableCell({
        shading: { fill: '2563EB' },
        children: [new Paragraph({
          children: [new TextRun({ text: k, bold: true, color: 'FFFFFF', size: 18 })]
        })]
      })
    )

    // Data rows
    const dataRows = rows.map((row) =>
      new TableRow({
        children: colKeys.map(k =>
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: String(row[k]), size: 18 })]
            })]
          })
        )
      })
    )

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: headerCells, tableHeader: true }),
        ...dataRows
      ]
    })

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            text: 'Sales Report',
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Generated: ${new Date().toLocaleString()}`, size: 20, color: '555555' })
            ],
            spacing: { after: 300 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Total records: ${rows.length}`, size: 20, bold: true })
            ],
            spacing: { after: 400 }
          }),
          table
        ]
      }]
    })

    const blob     = await Packer.toBlob(doc)
    const fileName = `sales_report_${new Date().toISOString().slice(0, 10)}.docx`
    saveAs(blob, fileName)
    showToast(`Exported ${rows.length} records to ${fileName}`, 'success')
  } catch (err) {
    console.error(err)
    showToast('Word export failed', 'error')
  } finally {
    exportingWord.value = false
  }
}

// ── Init ──────────────────────────────────────────────────────
onMounted(loadSales)
</script>
