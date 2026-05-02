<template>
  <v-container fluid class="pa-6">
    <v-row class="mb-6">
      <v-col cols="12" class="d-flex align-center flex-wrap gap-3">
        <v-btn icon="mdi-arrow-left" variant="tonal" class="rounded-lg me-2" to="/reports"></v-btn>
        <div class="header-icon-container rounded-xl pa-3 me-3">
          <v-icon color="red-darken-3" size="32">mdi-cash-minus</v-icon>
        </div>
        <div>
          <h1 class="text-h4 font-weight-black mb-1">ລາຍງານລາຍຈ່າຍ</h1>
          <p class="text-subtitle-1 text-medium-emphasis">ຕິດຕາມລາຍຈ່າຍຈາກການນຳເຂົ້າສິນຄ້າ ແລະ ຕົ້ນທຶນ</p>
        </div>
        <v-spacer></v-spacer>

        <!-- Date Filters -->
        <v-card elevation="0" border class="rounded-xl px-4 py-2 d-flex align-center gap-3 bg-white">
          <v-text-field
            v-model="startDate"
            type="date"
            label="ແຕ່ວັນທີ"
            variant="plain"
            density="compact"
            hide-details
            style="width: 140px"
            @update:modelValue="fetchExpenses"
          ></v-text-field>
          <v-text-field
            v-model="endDate"
            type="date"
            label="ເຖິງວັນທີ"
            variant="plain"
            density="compact"
            hide-details
            style="width: 140px"
            @update:modelValue="fetchExpenses"
          ></v-text-field>
        </v-card>
      </v-col>
    </v-row>

    <!-- Expense Stats -->
    <v-row class="mb-6">
      <v-col cols="12" md="4">
        <v-card border elevation="0" class="rounded-xl overflow-hidden shadow-soft">
          <div class="pa-5 d-flex align-center">
            <v-avatar color="red-lighten-5" rounded="lg" size="48" class="me-4">
              <v-icon color="red-darken-2">mdi-cash-multiple</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-grey font-weight-bold text-uppercase">ລາຍຈ່າຍລວມ</div>
              <div class="text-h5 font-weight-black text-red-darken-2">{{ formatCurrency(totalExpenses) }}</div>
            </div>
          </div>
          <v-divider></v-divider>
          <div class="px-5 py-2 bg-red-lighten-5 text-caption text-red-darken-4">
            ອີງຕາມລາຍການນຳເຂົ້າທັງໝົດ
          </div>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card border elevation="0" class="rounded-xl overflow-hidden shadow-soft">
          <div class="pa-5 d-flex align-center">
            <v-avatar color="blue-lighten-5" rounded="lg" size="48" class="me-4">
              <v-icon color="blue-darken-2">mdi-file-document-multiple-outline</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-grey font-weight-bold text-uppercase">ຈຳນວນລາຍການ</div>
              <div class="text-h5 font-weight-black text-blue-darken-2">{{ expenses.length }} ບິນ</div>
            </div>
          </div>
          <v-divider></v-divider>
          <div class="px-5 py-2 bg-blue-lighten-5 text-caption text-blue-darken-4">
            ຂໍ້ມູນຈາກການນຳເຂົ້າສິນຄ້າ
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Expenses Table -->
    <v-card border elevation="0" class="rounded-xl overflow-hidden shadow-soft">
      <v-data-table
        :headers="headers"
        :items="expenses"
        :loading="loading"
        hover
      >
        <!-- Date -->
        <template v-slot:item.receive_date="{ item }">
          {{ formatDate(item.receive_date) }}
        </template>

        <!-- Invoice Number -->
        <template v-slot:item.invoice_number="{ item }">
          <v-btn
            variant="text"
            color="primary"
            class="font-weight-bold px-0 text-none"
            @click="openDetail(item)"
          >
            {{ item.invoice_number }}
          </v-btn>
        </template>

        <!-- Supplier -->
        <template v-slot:item.supplier="{ item }">
          <div class="font-weight-bold">{{ item.supplier?.name || 'ທົ່ວໄປ' }}</div>
          <div class="text-caption text-grey">{{ item.supplier?.phone || '-' }}</div>
        </template>

        <!-- Amount -->
        <template v-slot:item.total_amount="{ item }">
          <span class="font-weight-black text-red-darken-2">{{ formatCurrency(item.total_amount) }}</span>
        </template>

        <!-- User -->
        <template v-slot:item.user="{ item }">
          <v-chip size="x-small" variant="tonal" prepend-icon="mdi-account">
            {{ item.user?.username }}
          </v-chip>
        </template>

        <!-- Status -->
        <template v-slot:item.status="{ item }">
          <v-chip color="success" size="x-small" variant="flat">ສຳເລັດ</v-chip>
        </template>
      </v-data-table>
    </v-card>

    <!-- Detail Dialog -->
    <v-dialog v-model="detailDialog" max-width="800">
      <v-card rounded="xl" v-if="selectedImport">
        <v-card-title class="pa-6 d-flex align-center">
          <v-icon icon="mdi-file-document-outline" class="me-3" color="primary"></v-icon>
          <div>
            <div class="text-h6 font-weight-black">ລາຍລະອຽດໃບນຳເຂົ້າ {{ selectedImport.invoice_number }}</div>
            <div class="text-caption text-grey">ວັນທີ: {{ formatDate(selectedImport.receive_date) }} | ຜູ້ບັນທຶກ: {{ selectedImport.user?.username }}</div>
          </div>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="detailDialog = false"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-0">
          <v-table>
            <thead class="bg-grey-lighten-4">
              <tr>
                <th class="text-left">ສິນຄ້າ</th>
                <th class="text-center">ຈຳນວນ</th>
                <th class="text-right">ຕົ້ນທຶນ/ໜ່ວຍ</th>
                <th class="text-right">ຍອດລວມ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in selectedImport.details" :key="d.id">
                <td>
                  <div class="font-weight-bold">{{ d.product?.name }}</div>
                  <div class="text-caption text-grey" v-if="d.variant">
                    {{ d.variant.color }} {{ d.variant.size }}
                  </div>
                </td>
                <td class="text-center">{{ d.quantity }}</td>
                <td class="text-right">{{ formatCurrency(d.unit_cost) }}</td>
                <td class="text-right font-weight-bold">{{ formatCurrency(d.subtotal) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="bg-grey-lighten-4">
                <td colspan="3" class="text-right font-weight-black">ຍອດລວມທັງໝົດ:</td>
                <td class="text-right font-weight-black text-h6 text-red-darken-2">
                  {{ formatCurrency(selectedImport.total_amount) }}
                </td>
              </tr>
            </tfoot>
          </v-table>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="tonal" color="primary" class="rounded-xl px-8" @click="detailDialog = false">ປິດ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const api = useApi()
const loading = ref(false)
const expenses = ref([])

const detailDialog = ref(false)
const selectedImport = ref(null)

const startDate = ref(new Date(new Date().setDate(1)).toISOString().substr(0, 10)) // 1st of month
const endDate = ref(new Date().toISOString().substr(0, 10))

const headers = [
  { title: 'ວັນທີຮັບ', key: 'receive_date' },
  { title: 'ເລກທີໃບນຳເຂົ້າ', key: 'invoice_number' },
  { title: 'ຜູ້ສະໜອງ', key: 'supplier' },
  { title: 'ພະນັກງານບັນທຶກ', key: 'user' },
  { title: 'ຍອດເງິນທີ່ຈ່າຍ', key: 'total_amount', align: 'end' },
  { title: 'ສະຖານະ', key: 'status', align: 'center' }
]

const totalExpenses = computed(() => {
  return expenses.value.reduce((sum, e) => sum + Number(e.total_amount), 0)
})

const fetchExpenses = async () => {
  loading.value = true
  try {
    const res = await api('/reports/expenses', {
      params: { startDate: startDate.value, endDate: endDate.value }
    })
    if (res.success) {
      expenses.value = res.data
    }
  } catch (e) {
    console.error('Failed to fetch expense report', e)
  } finally {
    loading.value = false
  }
}

const openDetail = async (item) => {
  loading.value = true
  try {
    const res = await api(`/imports/${item.id}`)
    if (res.success) {
      selectedImport.value = res.data
      detailDialog.value = true
    }
  } catch (e) {
    console.error('Failed to fetch import detail', e)
  } finally {
    loading.value = false
  }
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK', maximumFractionDigits: 0 }).format(val)
}

const formatDate = (val) => {
  return val ? new Date(val).toLocaleDateString('lo-LA', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
}

onMounted(fetchExpenses)
</script>

<style scoped>
.header-icon-container {
  background-color: rgba(211, 47, 47, 0.1);
}

.shadow-soft {
  box-shadow: 0 4px 20px rgba(0,0,0,0.04) !important;
}
</style>
