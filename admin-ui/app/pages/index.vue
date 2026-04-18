<template>
  <v-row>
    <v-col cols="12">
      <h1 class="text-h4 font-weight-bold mb-4">Dashboard</h1>
    </v-col>
    
    <!-- Summary Cards -->
    <v-col cols="12" sm="6" md="3">
      <v-card color="primary" theme="dark" elevation="2" rounded="lg">
        <v-card-text>
          <div class="text-subtitle-1 mb-1">Total Revenue</div>
          <div class="text-h4 font-weight-bold">$ {{ todaySales }}</div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="3">
      <v-card color="success" theme="dark" elevation="2" rounded="lg">
        <v-card-text>
          <div class="text-subtitle-1 mb-1">Total Orders</div>
          <div class="text-h4 font-weight-bold">{{ totalOrders }}</div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="3">
      <v-card color="warning" theme="dark" elevation="2" rounded="lg">
        <v-card-text>
          <div class="text-subtitle-1 mb-1">Products</div>
          <div class="text-h4 font-weight-bold">{{ totalProducts }}</div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="3">
      <v-card color="info" theme="dark" elevation="2" rounded="lg">
        <v-card-text>
          <div class="text-subtitle-1 mb-1">Customers</div>
          <div class="text-h4 font-weight-bold">{{ totalCustomers }}</div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const api = useApi()

const todaySales = ref(0)
const totalOrders = ref(0)
const totalProducts = ref(0)
const totalCustomers = ref(0)

onMounted(async () => {
  try {
    // Fetch summary stats
    const reportRes = await api('/sales/report/summary')
    if (reportRes.success && reportRes.data.summary.length > 0) {
      // Very basic aggregate check for demonstration
      totalOrders.value = reportRes.data.summary.reduce((acc, curr) => acc + Number(curr.total_transactions), 0)
      todaySales.value = reportRes.data.summary.reduce((acc, curr) => acc + Number(curr.total_revenue), 0).toFixed(2)
    }

    // You could fetch other endpoints to get counts...
    // e.g., Products total
    const prodRes = await api('/products?page=1&pageSize=1')
    if (prodRes.success && prodRes.pagination) {
      totalProducts.value = prodRes.pagination.total
    }

    const custRes = await api('/customers?page=1&pageSize=1')
    if (custRes.success && custRes.pagination) {
      totalCustomers.value = custRes.pagination.total
    }

  } catch (err) {
    console.error('Failed to load dashboard data', err)
  }
})
</script>
