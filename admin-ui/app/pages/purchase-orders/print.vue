<template>
  <div class="print-page pa-2 ma-2">
  <div class="print-container pa-10" v-if="po">
    <!-- Header: Store Info (Centered for professional receipt look) -->
    <div class="text-center mb-6">
      <h1 class="text-h3 font-weight-bold mb-1">{{ settings.shop_name || 'PERFECT STORE' }}</h1>
      <p class="mb-0 text-body-1">{{ settings.address }}</p>
      <p class="mb-0 text-body-1">Tel: {{ settings.phone }}</p>
      <p class="mb-0 text-body-1" v-if="settings.tax_number">Tax ID: {{ settings.tax_number }}</p>
      <div class="header-line my-4"></div>
      <h2 class="text-h4 font-weight-bold text-uppercase color-primary">ໃບສັ່ງຊື້ສິນຄ້າ</h2>
      <div class="d-flex justify-center gap-6 mt-2">
        <span class="text-h6">No: <b>#{{ po.po_number }}</b></span>
        <span class="text-h6">Date: <b>{{ formatDate(po.order_date) }}</b></span>
      </div>
    </div>

    <v-divider class="mb-6" />

    <!-- Info Section: Supplier & Metadata -->
    <v-row class="mb-8">
      <v-col cols="6">
        <div class="info-box pa-4 rounded-lg">
          <p class="text-caption text-uppercase font-weight-bold mb-1 opacity-60">ຜູ້ສະໜອງ:</p>
          <p class="text-body-1 font-weight-bold mb-0">{{ po.supplier?.name }}</p>
          <p class="text-body-2 mb-0">{{ po.supplier?.address || '—' }}</p>
          <p class="text-body-2 mb-0" v-if="po.supplier?.phone">Tel: {{ po.supplier?.phone }}</p>
        </div>
      </v-col>
      <v-col cols="6">
        <div class="info-box pa-4 rounded-lg">
          <p class="text-caption text-uppercase font-weight-bold mb-1 opacity-60">ສະຖານະ:</p>
          <v-chip size="small" :color="statusColor(po.status)" class="font-weight-bold">
            {{ statusLabel(po.status) }}
          </v-chip>
          <p class="text-caption text-uppercase font-weight-bold mt-3 mb-1 opacity-60">ໝາຍເຫດ:</p>
          <p class="text-body-2 mb-0 italic">{{ po.notes || '—' }}</p>
        </div>
      </v-col>
    </v-row>

    <!-- Table Section -->
    <v-table class="print-table mb-8" density="comfortable">
      <thead>
        <tr>
          <th class="text-left">#</th>
          <th class="text-left">ລາຍການສິນຄ້າ</th>
          <th class="text-center">ຈໍານວນ</th>
          <th class="text-right">ລາຄາ/ຫົວໜ່ວຍ</th>
          <th class="text-right">ລວມ</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, idx) in po.details" :key="item.id">
          <td>{{ idx + 1 }}</td>
          <td>
            <div class="font-weight-bold">{{ item.product?.name }}</div>
            <div class="text-caption" v-if="item.variant">
              {{ item.variant.color || '' }} {{ item.variant.size || '' }}
            </div>
            <div class="text-caption text-grey" v-if="item.product?.sku || item.product?.barcode">
              SKU: {{ item.product?.sku || item.product?.barcode }}
            </div>
          </td>
          <td class="text-center">{{ item.quantity_ordered }}</td>
          <td class="text-right">{{ formatCurrency(item.unit_cost) }}</td>
          <td class="text-right font-weight-bold">{{ formatCurrency(item.subtotal) }}</td>
        </tr>
      </tbody>
    </v-table>

    <!-- Summary Section -->
    <div class="d-flex justify-end">
      <div style="width: 300px">
        <div class="d-flex justify-space-between mb-2">
          <span class="text-body-1">ລວມຈໍານວນສິນຄ້າ:</span>
          <span class="text-body-1 font-weight-medium">{{ totalQty }} ລາຍການ</span>
        </div>
        <v-divider class="my-2" />
        <div class="d-flex justify-space-between align-center">
          <span class="text-h6 font-weight-bold">ມູນຄ່າລວມທັງໝົດ:</span>
          <span class="text-h5 font-weight-bold color-primary">{{ formatCurrency(po.total_amount) }}</span>
        </div>
      </div>
    </div>

    <!-- Footer: Signatures -->
    <div class="print-footer mt-16 pt-16">
      <v-row>
        <v-col cols="4" class="text-center">
          <div class="signature-line mx-4 mb-2"></div>
          <p class="text-body-2">ຜູ້ຈັດຊື້ (Purchaser)</p>
          <p class="text-caption text-grey">ວັນທີ: ____/____/____</p>
        </v-col>
        <v-col cols="4"></v-col>
        <v-col cols="4" class="text-center">
          <div class="signature-line mx-4 mb-2"></div>
          <p class="text-body-2">ຜູ້ອະນຸມັດ (Approver)</p>
          <p class="text-caption text-grey">ວັນທີ: ____/____/____</p>
        </v-col>
      </v-row>
    </div>

    <!-- Print instructions (only visible on screen) -->
    <div class="no-print mt-10 pa-4 bg-yellow-lighten-4 rounded-lg d-flex align-center">
      <v-icon icon="mdi-printer" class="mr-2" />
      <span>The print dialog should open automatically. If not, press <b>Ctrl + P</b>.</span>
      <v-spacer />
      <v-btn color="primary" @click="doPrint">Print Now</v-btn>
    </div>
  </div>

  <div v-else-if="loading" class="d-flex flex-column align-center justify-center fill-height" style="height: 100vh">
    <v-progress-circular indeterminate color="primary" size="64" />
    <p class="mt-4 text-h6">ກໍາລັງໂຫຼດຂໍ້ມູນ...</p>
  </div>

  <div v-else class="d-flex flex-column align-center justify-center fill-height" style="height: 100vh">
    <v-icon icon="mdi-alert-circle-outline" color="error" size="64" />
    <p class="mt-4 text-h6">ບໍ່ພົບຂໍ້ມູນໃບສັ່ງຊື້</p>
    <v-btn class="mt-4" to="/purchase-orders">ກັບຄືນ</v-btn>
  </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const api = useApi()

definePageMeta({
  layout: false
})

const po = ref(null)
const settings = ref({})
const loading = ref(true)

const loadData = async () => {
  const poId = route.query.id
  if (!poId) {
    loading.value = false
    return
  }

  try {
    const [poRes, setRes] = await Promise.all([
      api(`/purchase-orders/${poId}`),
      api('/shop-settings')
    ])

    if (poRes.success) po.value = poRes.data
    if (setRes.success) settings.value = setRes.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
    if (po.value) {
      // Delay to ensure Vuetify components are rendered
      setTimeout(() => {
        window.print()
      }, 1000)
    }
  }
}

const totalQty = computed(() => {
  if (!po.value?.details) return 0
  return po.value.details.reduce((sum, item) => sum + item.quantity_ordered, 0)
})

const doPrint = () => window.print()

const formatDate = (val) =>
  val ? new Date(val).toLocaleDateString('lo-LA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const formatCurrency = (val) =>
  val != null
    ? new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(val)
    : '—'

const statusColor = (s) => ({
  draft: 'grey', received: 'blue', completed: 'green', cancelled: 'red'
}[s] ?? 'grey')

const statusLabel = (s) => ({
  draft: 'ຮ່າງ (Draft)', received: 'ຮັບສິນຄ້າ (Received)', cancelled: 'ຍົກເລີກ (Cancelled)'
}[s] ?? s)

onMounted(loadData)
</script>

<style scoped>
.print-page {
  font-family: "Noto Sans Lao", sans-serif !important;
}

.print-container {
  max-width: 900px;
  margin: 0 auto;
  background: white;
  min-height: 100vh;
  color: #1e293b;
  font-family: "Noto Sans Lao", sans-serif !important;
}

/* Ensure all Vuetify classes inherit the font */
:deep(*) {
  font-family: "Noto Sans Lao", sans-serif !important;
}

.header-line {
  height: 2px;
  background: #1e293b;
  width: 100%;
}

.info-box {
  background: white;
  border: 1px solid #000;
  border-radius: 4px !important;
}

.color-primary {
  color: #1a56db;
}

.italic {
  font-style: italic;
}

.print-table {
  border: 1.5px solid #000;
  border-radius: 0;
  overflow: hidden;
}

.print-table :deep(th) {
  background: #f1f5f9 !important;
  color: #000 !important;
  font-weight: 800 !important;
  text-transform: uppercase;
  font-size: 11px;
  border-bottom: 1.5px solid #000 !important;
}

.print-table :deep(td) {
  border-bottom: 1px solid #eee;
  color: #000 !important;
}

.signature-line {
  border-bottom: 1px solid #94a3b8;
  height: 40px;
}

@media print {
  @page {
    size: auto;
    margin: 0mm; /* This removes the date, URL, and page numbers */
  }

  body {
    margin: 0;
    padding: 15mm !important; /* Internal page margins for content */
  }

  .no-print {
    display: none !important;
  }

  .print-page {
    padding: 0 !important;
    margin: 0 !important;
  }

  .print-container {
    padding: 0 !important;
    max-width: 100% !important;
    box-shadow: none !important;
  }

  /* Force background colors to print */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .info-box {
    background: #f8fafc !important;
    border: 1px solid #e2e8f0 !important;
  }

  .print-table :deep(th) {
    background: #f1f5f9 !important;
  }
}
</style>
