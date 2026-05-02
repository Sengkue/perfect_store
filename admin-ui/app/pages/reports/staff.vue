<template>
  <v-container fluid class="pa-6">
    <v-row class="mb-6">
      <v-col cols="12" class="d-flex align-center">
        <v-btn icon="mdi-arrow-left" variant="tonal" class="rounded-lg me-4" to="/reports"></v-btn>
        <div class="header-icon-container rounded-xl pa-3 me-4">
          <v-icon color="deep-purple-darken-2" size="32">mdi-account-tie</v-icon>
        </div>
        <div>
          <h1 class="text-h4 font-weight-black mb-1">ລາຍງານປະສິດທິພາບພະນັກງານ</h1>
          <p class="text-subtitle-1 text-medium-emphasis">ຕິດຕາມຍອດຂາຍ ແລະ ຜົນງານຂອງພະນັກງານແຕ່ລະຄົນ</p>
        </div>
        <v-spacer></v-spacer>
        <v-btn
          color="deep-purple-darken-2"
          variant="elevated"
          prepend-icon="mdi-refresh"
          @click="fetchStaff"
          :loading="loading"
          class="rounded-lg px-6"
        >
          ໂຫຼດໃໝ່
        </v-btn>
      </v-col>
    </v-row>

    <!-- Top 3 Staff Podium -->
    <v-row v-if="staff.length >= 1">
      <!-- Gold (Rank 1) -->
      <v-col cols="12" md="4" class="order-md-2">
        <v-card border elevation="4" class="rounded-xl overflow-hidden trophy-card gold text-center pa-6">
          <v-avatar size="80" color="amber-lighten-4" class="mb-3 border-gold">
            <v-icon icon="mdi-account" color="amber-darken-4" size="40"></v-icon>
          </v-avatar>
          <div class="text-h5 font-weight-black mb-1">{{ staff[0].user?.username }}</div>
          <div class="text-subtitle-2 text-amber-darken-4 font-weight-bold mb-4">
            <v-icon icon="mdi-trophy" class="me-1"></v-icon>ອັນດັບ 1
          </div>
          <v-divider class="mb-4"></v-divider>
          <div class="d-flex justify-space-around">
            <div>
              <div class="text-caption text-grey">ຍອດຂາຍ</div>
              <div class="text-h6 font-weight-black text-success">{{ formatCurrency(staff[0].totalSales) }}</div>
            </div>
            <div>
              <div class="text-caption text-grey">ອໍເດີ</div>
              <div class="text-h6 font-weight-black">{{ staff[0].totalOrders }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
      
      <!-- Silver (Rank 2) -->
      <v-col cols="12" md="4" v-if="staff.length >= 2" class="order-md-1">
        <v-card border elevation="0" class="rounded-xl overflow-hidden trophy-card silver text-center pa-6 mt-md-10">
          <v-avatar size="64" color="blue-grey-lighten-4" class="mb-3">
            <v-icon icon="mdi-account" color="blue-grey-darken-2" size="32"></v-icon>
          </v-avatar>
          <div class="text-h6 font-weight-bold mb-1">{{ staff[1].user?.username }}</div>
          <div class="text-subtitle-2 text-blue-grey-darken-1 font-weight-bold mb-4">ອັນດັບ 2</div>
          <v-divider class="mb-4"></v-divider>
          <div class="d-flex justify-space-around">
            <div>
              <div class="text-caption text-grey">ຍອດຂາຍ</div>
              <div class="text-subtitle-1 font-weight-bold">{{ formatCurrency(staff[1].totalSales) }}</div>
            </div>
            <div>
              <div class="text-caption text-grey">ອໍເດີ</div>
              <div class="text-subtitle-1 font-weight-bold">{{ staff[1].totalOrders }}</div>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Bronze (Rank 3) -->
      <v-col cols="12" md="4" v-if="staff.length >= 3" class="order-md-3">
        <v-card border elevation="0" class="rounded-xl overflow-hidden trophy-card bronze text-center pa-6 mt-md-10">
          <v-avatar size="64" color="orange-lighten-4" class="mb-3">
            <v-icon icon="mdi-account" color="orange-darken-3" size="32"></v-icon>
          </v-avatar>
          <div class="text-h6 font-weight-bold mb-1">{{ staff[2].user?.username }}</div>
          <div class="text-subtitle-2 text-orange-darken-3 font-weight-bold mb-4">ອັນດັບ 3</div>
          <v-divider class="mb-4"></v-divider>
          <div class="d-flex justify-space-around">
            <div>
              <div class="text-caption text-grey">ຍອດຂາຍ</div>
              <div class="text-subtitle-1 font-weight-bold">{{ formatCurrency(staff[2].totalSales) }}</div>
            </div>
            <div>
              <div class="text-caption text-grey">ອໍເດີ</div>
              <div class="text-subtitle-1 font-weight-bold">{{ staff[2].totalOrders }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="!staff.length && !loading">
      <v-col cols="12" class="text-center pa-10">
        <v-icon icon="mdi-account-off-outline" size="64" color="grey-lighten-1" class="mb-4"></v-icon>
        <div class="text-h6 text-grey">ບໍ່ມີຂໍ້ມູນຍອດຂາຍຂອງພະນັກງານ</div>
      </v-col>
    </v-row>

    <!-- Leaderboard Table -->
    <v-row v-if="staff.length" class="mt-6">
      <v-col cols="12">
        <v-card border elevation="0" class="rounded-xl">
          <v-card-title class="pa-6 font-weight-bold">ລາຍລະອຽດຜົນງານ</v-card-title>
          <v-divider></v-divider>
          <v-table>
            <thead>
              <tr>
                <th class="text-left">ພະນັກງານ</th>
                <th class="text-center">ຈຳນວນອໍເດີ</th>
                <th class="text-right">ຍອດຂາຍທັງໝົດ</th>
                <th class="text-right">ສະເລ່ຍຕໍ່ອໍເດີ</th>
                <th class="text-right">ສ່ວນແບ່ງຍອດຂາຍ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in staff" :key="s.user_id">
                <td class="font-weight-bold">{{ s.user?.username }}</td>
                <td class="text-center">{{ s.totalOrders }}</td>
                <td class="text-right font-weight-bold">{{ formatCurrency(s.totalSales) }}</td>
                <td class="text-right">{{ formatCurrency(s.totalSales / s.totalOrders) }}</td>
                <td class="text-right">
                  <v-chip size="x-small" variant="tonal" color="success">
                    {{ ((s.totalSales / totalSalesAll) * 100).toFixed(1) }}%
                  </v-chip>
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
const staff = ref([])

const maxSales = computed(() => {
  const totals = staff.value.map(s => Number(s.totalSales))
  return Math.max(...totals, 1)
})

const totalSalesAll = computed(() => {
  return staff.value.reduce((sum, s) => sum + Number(s.totalSales), 0)
})

const fetchStaff = async () => {
  loading.value = true
  try {
    const res = await api('/reports/staff')
    if (res.success) {
      staff.value = res.data
    }
  } catch (e) {
    console.error('Failed to fetch staff report', e)
  } finally {
    loading.value = false
  }
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK', maximumFractionDigits: 0 }).format(val)
}

const getRoleColor = (role) => {
  switch (role?.toLowerCase()) {
    case 'root': return 'purple'
    case 'admin': return 'red'
    case 'manager': return 'orange'
    case 'staff': return 'blue'
    default: return 'grey'
  }
}

onMounted(() => {
  fetchStaff()
})
</script>

<style scoped>
.header-icon-container {
  background-color: rgba(103, 58, 183, 0.1);
}

.trophy-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.trophy-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.12) !important;
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

.border-gold {
  border: 3px solid #FFD54F;
}
</style>
