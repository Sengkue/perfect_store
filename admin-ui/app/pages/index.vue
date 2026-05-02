<template>
  <v-row v-if="hasPermission('dashboard.view')">
    <v-col cols="12">
      <h1 class="text-h4 font-weight-bold mb-4">Dashboard</h1>
    </v-col>

    <!-- Summary Cards -->
    <v-col cols="12" sm="6" md="3">
      <v-card color="primary" theme="dark" elevation="2" rounded="lg" :loading="loadingStats">
        <v-card-text>
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="text-subtitle-2 opacity-80">Total Revenue</div>
            <v-icon size="28" opacity="0.7">mdi-cash-multiple</v-icon>
          </div>
          <div class="text-h5 font-weight-bold">{{ formatCurrency(todayRevenue) }}</div>
          <div class="text-caption opacity-70 mt-1">All completed sales</div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="3">
      <v-card color="success" theme="dark" elevation="2" rounded="lg" :loading="loadingStats">
        <v-card-text>
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="text-subtitle-2 opacity-80">Total Orders</div>
            <v-icon size="28" opacity="0.7">mdi-receipt</v-icon>
          </div>
          <div class="text-h5 font-weight-bold">{{ totalOrders }}</div>
          <div class="text-caption opacity-70 mt-1">Completed transactions</div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="3">
      <v-card color="warning" theme="dark" elevation="2" rounded="lg" :loading="loadingStats">
        <v-card-text>
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="text-subtitle-2 opacity-80">Products</div>
            <v-icon size="28" opacity="0.7">mdi-package-variant-closed</v-icon>
          </div>
          <div class="text-h5 font-weight-bold">{{ totalProducts }}</div>
          <div class="text-caption opacity-70 mt-1">Active items in catalog</div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="3">
      <v-card color="info" theme="dark" elevation="2" rounded="lg" :loading="loadingStats">
        <v-card-text>
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="text-subtitle-2 opacity-80">Customers</div>
            <v-icon size="28" opacity="0.7">mdi-account-group</v-icon>
          </div>
          <div class="text-h5 font-weight-bold">{{ totalCustomers }}</div>
          <div class="text-caption opacity-70 mt-1">Registered customers</div>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Quick Actions -->
    <v-col cols="12">
      <v-card rounded="lg" elevation="1">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-4">Quick Actions</v-card-title>
        <v-divider />
        <v-card-text>
          <div class="d-flex flex-wrap gap-3">
            <v-btn v-if="hasPermission('sales.create')" color="primary" prepend-icon="mdi-cash-register" to="/pos" variant="elevated" rounded="lg">
              Open POS
            </v-btn>
            <v-btn v-if="hasPermission('imports.create')" color="success" prepend-icon="mdi-package-down" to="/imports" variant="tonal" rounded="lg">
              Record Import
            </v-btn>
            <v-btn v-if="hasPermission('purchases.view')" color="warning" prepend-icon="mdi-truck-delivery-outline" to="/purchase-orders" variant="tonal" rounded="lg">
              Purchase Orders
            </v-btn>
            <v-btn v-if="hasPermission('customers.view')" color="info" prepend-icon="mdi-account-plus" to="/customers" variant="tonal" rounded="lg">
              Manage Customers
            </v-btn>
            <v-btn v-if="hasPermission('sales.view')" color="secondary" prepend-icon="mdi-chart-bar" to="/sales" variant="tonal" rounded="lg">
              View Sales
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Revenue by Type -->
    <v-col cols="12" md="6">
      <v-card rounded="lg" elevation="1">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-4">
          <v-icon icon="mdi-chart-pie" class="me-2" color="primary" />
          Revenue by Sale Type
        </v-card-title>
        <v-divider />
        <v-list v-if="salesSummary.length" density="compact">
          <v-list-item
            v-for="s in salesSummary"
            :key="s.sale_type"
            :prepend-icon="s.sale_type === 'in_shop' ? 'mdi-store' : 'mdi-web'"
          >
            <template #title>
              <span class="text-capitalize">{{ s.sale_type?.replace('_', ' ') || '—' }}</span>
            </template>
            <template #subtitle>
              {{ s.total_transactions }} transactions
            </template>
            <template #append>
              <span class="font-weight-bold text-success">{{ formatCurrency(s.total_revenue) }}</span>
            </template>
          </v-list-item>
        </v-list>
        <div v-else class="pa-6 text-center text-medium-emphasis text-body-2">
          No sales data yet
        </div>
      </v-card>
    </v-col>

    <!-- Extra stats -->
    <v-col cols="12" md="6">
      <v-card rounded="lg" elevation="1">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-4">
          <v-icon icon="mdi-information-outline" class="me-2" color="primary" />
          Store Overview
        </v-card-title>
        <v-divider />
        <v-list density="compact">
          <v-list-item prepend-icon="mdi-package-variant-closed" title="Total Products">
            <template #append><v-chip size="small" color="warning" variant="tonal">{{ totalProducts }}</v-chip></template>
          </v-list-item>
          <v-list-item prepend-icon="mdi-account-group" title="Total Customers">
            <template #append><v-chip size="small" color="info" variant="tonal">{{ totalCustomers }}</v-chip></template>
          </v-list-item>
          <v-list-item prepend-icon="mdi-receipt" title="Completed Sales">
            <template #append><v-chip size="small" color="success" variant="tonal">{{ totalOrders }}</v-chip></template>
          </v-list-item>
          <v-list-item prepend-icon="mdi-truck-supplier" title="Suppliers">
            <template #append><v-chip size="small" color="primary" variant="tonal">{{ totalSuppliers }}</v-chip></template>
          </v-list-item>
        </v-list>
      </v-card>
    </v-col>
  </v-row>
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
