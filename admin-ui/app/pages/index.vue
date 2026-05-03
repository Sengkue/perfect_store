<template>
  <v-container fluid class="pa-2 container-border" v-if="hasPermission('dashboard.view')">
    <!-- ── Header Section ── -->
    <v-row class="mb-2" dense>
      <v-col cols="12" class="d-flex align-center flex-wrap gap-2">
        <div class="header-icon-container rounded-lg pa-2 me-2">
          <v-icon color="primary" size="20">mdi-view-dashboard</v-icon>
        </div>
        <div>
          <h1 class="text-h5 font-weight-black mb-0">ພາບລວມລະບົບ</h1>
          <p class="text-caption text-medium-emphasis mb-0">ສະຖິຕິການຂາຍ ແລະ ການເຄື່ອນໄຫວລວມຂອງຮ້ານ</p>
        </div>
      </v-col>
    </v-row>

    <!-- Summary Cards -->
    <v-row class="mb-2">
      <v-col cols="12" sm="6" md="3">
        <v-card border elevation="0" class="rounded-lg pa-3 shadow-soft h-100 border-primary-lighten-4">
          <div class="d-flex align-center mb-2">
            <v-avatar color="primary-lighten-5" size="40" rounded="lg">
              <v-icon color="primary" size="24">mdi-cash-multiple</v-icon>
            </v-avatar>
            <div class="ms-3">
              <div class="text-caption font-weight-bold text-grey-darken-1 text-uppercase">ລາຍຮັບທັງໝົດ</div>
              <div class="text-h6 font-weight-black text-primary">{{ formatCurrency(todayRevenue) }}</div>
            </div>
          </div>
          <div class="text-caption text-medium-emphasis">ລວມຍອດຂາຍທີ່ສຳເລັດແລ້ວ</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card border elevation="0" class="rounded-lg pa-3 shadow-soft h-100 border-success-lighten-4">
          <div class="d-flex align-center mb-2">
            <v-avatar color="success-lighten-5" size="40" rounded="lg">
              <v-icon color="success" size="24">mdi-receipt</v-icon>
            </v-avatar>
            <div class="ms-3">
              <div class="text-caption font-weight-bold text-grey-darken-1 text-uppercase">ຈຳນວນບິນ</div>
              <div class="text-h6 font-weight-black text-success">{{ totalOrders }}</div>
            </div>
          </div>
          <div class="text-caption text-medium-emphasis">ລາຍການທຸລະກຳທີ່ສຳເລັດ</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card border elevation="0" class="rounded-lg pa-3 shadow-soft h-100 border-warning-lighten-4">
          <div class="d-flex align-center mb-2">
            <v-avatar color="warning-lighten-5" size="40" rounded="lg">
              <v-icon color="warning" size="24">mdi-package-variant-closed</v-icon>
            </v-avatar>
            <div class="ms-3">
              <div class="text-caption font-weight-bold text-grey-darken-1 text-uppercase">ສິນຄ້າທັງໝົດ</div>
              <div class="text-h6 font-weight-black text-warning">{{ totalProducts }}</div>
            </div>
          </div>
          <div class="text-caption text-medium-emphasis">ລາຍການສິນຄ້າໃນລະບົບ</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card border elevation="0" class="rounded-lg pa-3 shadow-soft h-100 border-info-lighten-4">
          <div class="d-flex align-center mb-2">
            <v-avatar color="info-lighten-5" size="40" rounded="lg">
              <v-icon color="info" size="24">mdi-account-group</v-icon>
            </v-avatar>
            <div class="ms-3">
              <div class="text-caption font-weight-bold text-grey-darken-1 text-uppercase">ລູກຄ້າ</div>
              <div class="text-h6 font-weight-black text-info">{{ totalCustomers }}</div>
            </div>
          </div>
          <div class="text-caption text-medium-emphasis">ຈຳນວນລູກຄ້າທີ່ລົງທະບຽນ</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-row class="mb-2">
      <v-col cols="12">
        <v-card border elevation="0" class="rounded-lg shadow-soft pa-3">
          <div class="text-body-2 font-weight-black mb-2 d-flex align-center">
            <v-icon icon="mdi-lightning-bolt" color="amber-darken-2" class="me-2" size="20" />
            ເມນູລັດ (Quick Actions)
          </div>
          <div class="d-flex flex-wrap gap-2">
            <v-btn v-if="hasPermission('sales.create')" color="primary" variant="elevated" rounded="lg" size="small" class="px-4 font-weight-bold shadow-soft" prepend-icon="mdi-cash-register" to="/pos">
              ເປີດໜ້າ POS
            </v-btn>
            <v-btn v-if="hasPermission('imports.create')" color="success" variant="tonal" rounded="lg" size="small" class="px-4 font-weight-bold" prepend-icon="mdi-package-down" to="/imports">
              ນໍາສິນຄ້າເຂົ້າ
            </v-btn>
            <v-btn v-if="hasPermission('purchases.view')" color="warning" variant="tonal" rounded="lg" size="small" class="px-4 font-weight-bold" prepend-icon="mdi-truck-delivery-outline" to="/purchase-orders">
              ໃບສັ່ງຊື້ (PO)
            </v-btn>
            <v-btn v-if="hasPermission('customers.view')" color="info" variant="tonal" rounded="lg" size="small" class="px-4 font-weight-bold" prepend-icon="mdi-account-plus" to="/customers">
              ລູກຄ້າ
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Bottom Stats Row -->
    <v-row class="mb-2">
      <!-- Revenue by Type -->
      <v-col cols="12" md="6">
        <v-card rounded="lg" border elevation="0" class="shadow-soft h-100">
          <v-card-title class="text-body-2 font-weight-black pa-2 px-3">
            <v-icon icon="mdi-chart-pie" class="me-2" color="primary" size="18" />
            Revenue by Sale Type
          </v-card-title>
          <v-divider />
          <v-list v-if="salesSummary.length" density="compact" class="pa-1">
            <v-list-item
              v-for="s in salesSummary"
              :key="s.sale_type"
              :prepend-icon="s.sale_type === 'in_shop' ? 'mdi-store' : 'mdi-web'"
              class="rounded-lg mb-1"
            >
              <template #title>
                <span class="text-capitalize font-weight-medium text-body-2">{{ s.sale_type?.replace('_', ' ') || '—' }}</span>
              </template>
              <template #subtitle>
                <span class="text-caption">{{ s.total_transactions }} transactions</span>
              </template>
              <template #append>
                <span class="font-weight-black text-success text-body-2">{{ formatCurrency(s.total_revenue) }}</span>
              </template>
            </v-list-item>
          </v-list>
          <div v-else class="pa-12 text-center text-medium-emphasis">
            <v-icon size="48" color="grey-lighten-3">mdi-chart-line-variant</v-icon>
            <div class="mt-2">No sales data yet</div>
          </div>
        </v-card>
      </v-col>

      <!-- Extra stats -->
      <v-col cols="12" md="6">
        <v-card rounded="lg" border elevation="0" class="shadow-soft h-100">
          <v-card-title class="text-body-2 font-weight-black pa-2 px-3">
            <v-icon icon="mdi-information-outline" class="me-2" color="primary" size="18" />
            Store Overview
          </v-card-title>
          <v-divider />
          <v-list density="compact" class="pa-1">
            <v-list-item prepend-icon="mdi-package-variant-closed" title="Total Products" class="rounded-lg mb-0">
              <template #title><span class="text-body-2">Total Products</span></template>
              <template #append><v-chip size="x-small" color="warning" variant="flat" class="font-weight-bold">{{ totalProducts }}</v-chip></template>
            </v-list-item>
            <v-list-item prepend-icon="mdi-account-group" title="Total Customers" class="rounded-lg mb-0">
              <template #title><span class="text-body-2">Total Customers</span></template>
              <template #append><v-chip size="x-small" color="info" variant="flat" class="font-weight-bold">{{ totalCustomers }}</v-chip></template>
            </v-list-item>
            <v-list-item prepend-icon="mdi-receipt" title="Completed Sales" class="rounded-lg mb-0">
              <template #title><span class="text-body-2">Completed Sales</span></template>
              <template #append><v-chip size="x-small" color="success" variant="flat" class="font-weight-bold">{{ totalOrders }}</v-chip></template>
            </v-list-item>
            <v-list-item prepend-icon="mdi-truck-supplier" title="Suppliers" class="rounded-lg">
              <template #title><span class="text-body-2">Suppliers</span></template>
              <template #append><v-chip size="x-small" color="primary" variant="flat" class="font-weight-bold">{{ totalSuppliers }}</v-chip></template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <v-container v-else class="fill-height d-flex flex-column align-center justify-center py-12">
    <v-icon size="120" color="grey-lighten-2" class="mb-6">mdi-lock-outline</v-icon>
    <h2 class="text-h4 font-weight-bold text-grey-darken-1 mb-2">Access Restricted</h2>
    <p class="text-body-1 text-grey text-center mb-6">
      ທ່ານບໍ່ມີສິດເຂົ້າເຖິງໜ້າ Dashboard. <br/>
      ກະລຸນາເລືອກເມນູອື່ນຈາກແຖບດ້ານຂ້າງ.
    </p>
    <v-btn v-if="hasPermission('pos.access')" to="/pos" color="primary" size="large" rounded="pill" prepend-icon="mdi-cash-register">
      ໄປທີ່ລະບົບຂາຍ (POS)
    </v-btn>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const api = useApi()
const { hasPermission } = usePermissions()

const todayRevenue    = ref(0)
const totalOrders     = ref(0)
const totalProducts   = ref(0)
const totalCustomers  = ref(0)
const totalSuppliers  = ref(0)
const salesSummary    = ref([])
const loadingStats    = ref(false)

const formatCurrency = (val) =>
  new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(val || 0)

onMounted(async () => {
  loadingStats.value = true
  try {
    // Sales report
    const reportRes = await api('/sales/report/summary').catch(() => null)
    if (reportRes?.success && reportRes.data.summary?.length) {
      salesSummary.value = reportRes.data.summary
      totalOrders.value = salesSummary.value.reduce((acc, s) => acc + Number(s.total_transactions || 0), 0)
      todayRevenue.value = salesSummary.value.reduce((acc, s) => acc + Number(s.total_revenue || 0), 0)
    }

    // Products count
    const prodRes = await api('/products?page=1&pageSize=1').catch(() => null)
    if (prodRes?.success && prodRes.pagination) {
      totalProducts.value = prodRes.pagination.total
    }

    // Customers count
    const custRes = await api('/customers?page=1&pageSize=1').catch(() => null)
    if (custRes?.success && custRes.pagination) {
      totalCustomers.value = custRes.pagination.total
    }

    // Suppliers count
    const suppRes = await api('/suppliers?page=1&pageSize=1').catch(() => null)
    if (suppRes?.success && suppRes.pagination) {
      totalSuppliers.value = suppRes.pagination.total
    }
  } catch (err) {
    console.error('Failed to load dashboard data', err)
  } finally {
    loadingStats.value = false
  }
})
</script>

<style scoped>
.header-icon-container {
  background-color: rgba(var(--v-theme-primary), 0.1);
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

.border-primary-lighten-4 { border-left: 4px solid rgba(var(--v-theme-primary), 0.6) !important; }
.border-success-lighten-4 { border-left: 4px solid rgba(var(--v-theme-success), 0.6) !important; }
.border-warning-lighten-4 { border-left: 4px solid rgba(var(--v-theme-warning), 0.6) !important; }
.border-info-lighten-4    { border-left: 4px solid rgba(var(--v-theme-info), 0.6) !important; }
</style>
