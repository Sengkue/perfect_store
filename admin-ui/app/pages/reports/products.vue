<template>
  <v-container fluid class="pa-6">
    <v-row class="mb-6">
      <v-col cols="12" class="d-flex align-center">
        <v-btn icon="mdi-arrow-left" variant="tonal" class="rounded-lg me-4" to="/reports"></v-btn>
        <div class="header-icon-container rounded-xl pa-3 me-4">
          <v-icon color="orange-darken-3" size="32">mdi-fire</v-icon>
        </div>
        <div>
          <h1 class="text-h4 font-weight-black mb-1">ສິນຄ້າຂາຍດີ</h1>
          <p class="text-subtitle-1 text-medium-emphasis">ວິເຄາະສິນຄ້າທີ່ສ້າງລາຍຮັບ ແລະ ຈຳນວນຂາຍສູງສຸດ</p>
        </div>
        <v-spacer></v-spacer>
        <v-btn
          color="orange-darken-3"
          variant="elevated"
          prepend-icon="mdi-refresh"
          @click="fetchProducts"
          :loading="loading"
          class="rounded-lg px-6"
        >
          ໂຫຼດໃໝ່
        </v-btn>
      </v-col>
    </v-row>

    <!-- Top 3 Trophy Cards -->
    <v-row v-if="products.length >= 3">
      <v-col cols="12" md="4" class="order-md-2">
        <v-card border elevation="4" class="rounded-xl overflow-hidden trophy-card gold text-center pa-6">
          <v-icon icon="mdi-trophy" color="amber" size="64" class="mb-2"></v-icon>
          <div class="text-h5 font-weight-black mb-1">{{ products[0].product?.name }}</div>
          <div class="text-subtitle-1 text-amber-darken-4 font-weight-bold mb-4">ອັນດັບ 1</div>
          <v-divider class="mb-4"></v-divider>
          <div class="d-flex justify-space-around">
            <div>
              <div class="text-caption text-grey">ຈຳນວນຂາຍ</div>
              <div class="text-h6">{{ products[0].totalQuantity }}</div>
            </div>
            <div>
              <div class="text-caption text-grey">ລາຍຮັບ</div>
              <div class="text-h6 text-success">{{ formatCurrency(products[0].totalRevenue) }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4" class="order-md-1">
        <v-card border elevation="0" class="rounded-xl overflow-hidden trophy-card silver text-center pa-6 mt-md-8">
          <v-icon icon="mdi-trophy-outline" color="blue-grey-lighten-2" size="48" class="mb-2"></v-icon>
          <div class="text-h6 font-weight-bold mb-1">{{ products[1].product?.name }}</div>
          <div class="text-subtitle-2 text-blue-grey-darken-1 font-weight-bold mb-4">ອັນດັບ 2</div>
          <v-divider class="mb-4"></v-divider>
          <div class="d-flex justify-space-around">
            <div>
              <div class="text-caption text-grey">ຈຳນວນ</div>
              <div class="text-subtitle-1 font-weight-bold">{{ products[1].totalQuantity }}</div>
            </div>
            <div>
              <div class="text-caption text-grey">ລາຍຮັບ</div>
              <div class="text-subtitle-1 font-weight-bold">{{ formatCurrency(products[1].totalRevenue) }}</div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4" class="order-md-3">
        <v-card border elevation="0" class="rounded-xl overflow-hidden trophy-card bronze text-center pa-6 mt-md-8">
          <v-icon icon="mdi-trophy-outline" color="orange-lighten-2" size="48" class="mb-2"></v-icon>
          <div class="text-h6 font-weight-bold mb-1">{{ products[2].product?.name }}</div>
          <div class="text-subtitle-2 text-orange-darken-3 font-weight-bold mb-4">ອັນດັບ 3</div>
          <v-divider class="mb-4"></v-divider>
          <div class="d-flex justify-space-around">
            <div>
              <div class="text-caption text-grey">ຈຳນວນ</div>
              <div class="text-subtitle-1 font-weight-bold">{{ products[2].totalQuantity }}</div>
            </div>
            <div>
              <div class="text-caption text-grey">ລາຍຮັບ</div>
              <div class="text-subtitle-1 font-weight-bold">{{ formatCurrency(products[2].totalRevenue) }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Products Table -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card border elevation="0" class="rounded-xl overflow-hidden">
          <v-card-title class="pa-6 d-flex align-center">
            <span class="font-weight-black">ລາຍການສິນຄ້າ 20 ອັນດັບທຳອິດ</span>
            <v-spacer></v-spacer>
            <v-chip color="orange" variant="tonal" size="small">ຈັດລຽງຕາມຈຳນວນຂາຍ</v-chip>
          </v-card-title>
          <v-divider></v-divider>
          
          <v-table hover>
            <thead>
              <tr>
                <th class="text-center" width="80">ອັນດັບ</th>
                <th class="text-left">ສິນຄ້າ</th>
                <th class="text-center">Barcode</th>
                <th class="text-center">ຈຳນວນທີ່ຂາຍໄດ້</th>
                <th class="text-right">ລາຄາຂາຍ/ໜ່ວຍ</th>
                <th class="text-right">ລາຍຮັບລວມ</th>
                <th class="text-right" width="200">ຄວາມນິຍົມ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, index) in products" :key="p.product_id">
                <td class="text-center font-weight-bold">
                  <v-avatar size="28" :color="index < 3 ? 'orange' : 'grey-lighten-3'" :class="index < 3 ? 'text-white' : ''">
                    {{ index + 1 }}
                  </v-avatar>
                </td>
                <td class="font-weight-bold">{{ p.product?.name }}</td>
                <td class="text-center text-caption text-grey">{{ p.product?.barcode || '-' }}</td>
                <td class="text-center">
                  <v-chip size="small" variant="flat" color="blue-lighten-5" class="text-blue-darken-2 font-weight-bold">
                    {{ p.totalQuantity }}
                  </v-chip>
                </td>
                <td class="text-right">{{ formatCurrency(p.product?.selling_price) }}</td>
                <td class="text-right font-weight-black text-orange-darken-3">{{ formatCurrency(p.totalRevenue) }}</td>
                <td class="text-right">
                  <v-progress-linear
                    :model-value="(p.totalQuantity / maxQuantity * 100)"
                    color="orange"
                    height="8"
                    rounded
                  ></v-progress-linear>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const api = useApi()
const loading = ref(false)
const products = ref([])

const maxQuantity = computed(() => {
  if (products.value.length === 0) return 1
  return Math.max(...products.value.map(p => Number(p.totalQuantity)))
})

const fetchProducts = async () => {
  loading.value = true
  try {
    const res = await api('/reports/top-products')
    if (res.success) {
      products.value = res.data
    }
  } catch (e) {
    console.error('Failed to fetch top products', e)
  } finally {
    loading.value = false
  }
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK', maximumFractionDigits: 0 }).format(val)
}

onMounted(fetchProducts)
</script>

<script>
export default {
  name: 'TopProductsReport'
}
</script>

<style scoped>
.header-icon-container {
  background-color: rgba(255, 152, 0, 0.1);
}

.trophy-card {
  transition: transform 0.3s ease;
}

.trophy-card:hover {
  transform: translateY(-5px);
}

.trophy-card.gold {
  background: linear-gradient(to bottom, #FFFDE7, #FFF9C4);
  border: 2px solid #FFD54F !important;
}

.trophy-card.silver {
  background: linear-gradient(to bottom, #F5F5F5, #EEEEEE);
}

.trophy-card.bronze {
  background: linear-gradient(to bottom, #FFF3E0, #FFE0B2);
}
</style>
