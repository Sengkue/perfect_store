<template>
  <v-container fluid class="pa-2 container-border">
    <v-row class="mb-4">
      <v-col cols="12" class="d-flex align-center flex-wrap gap-3">
        <div class="header-icon-container rounded-lg pa-2 me-3">
          <v-icon color="red-darken-3" size="20">mdi-cash-minus</v-icon>
        </div>
        <div>
          <h1 class="text-h5 font-weight-bold mb-0">ລາຍງານລາຍຈ່າຍ</h1>
          <div class="text-caption text-medium-emphasis">ຕິດຕາມລາຍຈ່າຍຈາກການນຳເຂົ້າສິນຄ້າ ແລະ ຕົ້ນທຶນ</div>
        </div>
        <v-spacer></v-spacer>

        <!-- Date Filters -->
        <v-card elevation="0" border class="rounded-lg px-4 py-2 d-flex align-center gap-3 bg-white shadow-soft">
          <!-- Start Date -->
          <v-menu v-model="menuStart" :close-on-content-click="false">
            <template v-slot:activator="{ props }">
              <v-text-field
                v-bind="props"
                v-model="startDateFormatted"
                label="ເລີ່ມ"
                variant="plain"
                density="compact"
                hide-details
                readonly
                prepend-inner-icon="mdi-calendar"
                style="width: 150px"
              ></v-text-field>
            </template>
            <v-date-picker v-model="startDateValue" color="red-darken-3" @update:model-value="menuStart = false"></v-date-picker>
          </v-menu>

          <v-icon icon="mdi-arrow-right" color="grey"></v-icon>

          <!-- End Date -->
          <v-menu v-model="menuEnd" :close-on-content-click="false">
            <template v-slot:activator="{ props }">
              <v-text-field
                v-bind="props"
                v-model="endDateFormatted"
                label="ສິ້ນສຸດ"
                variant="plain"
                density="compact"
                hide-details
                readonly
                prepend-inner-icon="mdi-calendar"
                style="width: 150px"
              ></v-text-field>
            </template>
            <v-date-picker v-model="endDateValue" color="red-darken-3" @update:model-value="menuEnd = false"></v-date-picker>
          </v-menu>

          <v-divider vertical class="mx-2"></v-divider>
          <v-btn color="red-darken-3" variant="elevated" size="small" class="rounded-lg mr-2" @click="fetchExpenses" :loading="loading">ຄຳນວນ</v-btn>
          <v-btn color="success" variant="tonal" size="small" prepend-icon="mdi-file-excel" @click="exportToExcel">Export</v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Expense Stats -->
    <v-row class="mb-6">
      <v-col cols="12" md="4">
        <v-card border elevation="0" class="rounded-lg overflow-hidden shadow-soft">
          <div class="pa-3 d-flex align-center">
            <v-avatar color="red-lighten-5" rounded="lg" size="36" class="me-4">
              <v-icon color="red-darken-2" size="20">mdi-cash-multiple</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-grey font-weight-bold text-uppercase" style="font-size: 0.7rem">ລາຍຈ່າຍລວມ</div>
              <div class="text-h6 font-weight-bold text-red-darken-2">{{ formatCurrency(totalExpenses) }}</div>
            </div>
          </div>
          <v-divider></v-divider>
          <div class="px-3 py-1 bg-red-lighten-5 text-caption text-red-darken-4">
            ອີງຕາມລາຍການນຳເຂົ້າທັງໝົດ
          </div>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card border elevation="0" class="rounded-lg overflow-hidden shadow-soft">
          <div class="pa-3 d-flex align-center">
            <v-avatar color="blue-lighten-5" rounded="lg" size="36" class="me-4">
              <v-icon color="blue-darken-2" size="20">mdi-file-document-multiple-outline</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-grey font-weight-bold text-uppercase" style="font-size: 0.7rem">ຈຳນວນລາຍການ</div>
              <div class="text-h6 font-weight-bold text-blue-darken-2">{{ expenses.length }} ບິນ</div>
            </div>
          </div>
          <v-divider></v-divider>
          <div class="px-3 py-1 bg-blue-lighten-5 text-caption text-blue-darken-4">
            ຂໍ້ມູນຈາກການນຳເຂົ້າສິນຄ້າ
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Expenses Table -->
    <v-card border elevation="0" class="rounded-lg overflow-hidden shadow-soft">
      <v-data-table
        :headers="headers"
        :items="expenses"
        :loading="loading"
        density="compact"
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

        <!-- Actions -->
        <template v-slot:item.actions="{ item }">
          <v-btn icon="mdi-eye-outline" variant="tonal" size="small" color="primary" class="rounded-lg" @click="openDetail(item)"></v-btn>
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
          <v-table density="compact">
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
          <v-btn variant="tonal" color="primary" class="rounded-lg px-8" @click="detailDialog = false">ປິດ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import * as XLSX from 'xlsx'
import { showToast } from '~/composables/useToast'
const api = useApi()

const loading = ref(false)
const menuStart = ref(false)
const menuEnd = ref(false)

// Internal Date objects
const startDateValue = ref(new Date())
const endDateValue = ref(new Date())

// Formatted for display
const startDateFormatted = computed(() => formatDate(startDateValue.value))
const endDateFormatted = computed(() => formatDate(endDateValue.value))

// API format (YYYY-MM-DD)
const startDate = computed(() => toISODate(startDateValue.value))
const endDate = computed(() => toISODate(endDateValue.value))

const expenses = ref([])
const totalExpenses = ref(0)
const selectedImport = ref(null)
const detailDialog = ref(false)

// Helpers
function formatDate(date) {
  if (!date) return '-'
  return new Intl.DateTimeFormat('lo-LA', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date))
}

function toISODate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

const headers = [
  { title: 'ວັນທີ', key: 'receive_date' },
  { title: 'ເລກບິນ', key: 'invoice_number' },
  { title: 'ຜູ້ສະໜອງ', key: 'supplier.name' },
  { title: 'ຍອດລວມ', key: 'total_amount', align: 'end' },
  { title: 'ລາຍລະອຽດ', key: 'actions', sortable: false, align: 'end' }
]

const fetchExpenses = async () => {
  loading.value = true
  try {
    const res = await api('/reports/expenses', {
      params: { startDate: startDate.value, endDate: endDate.value }
    })
    if (res.success) {
      expenses.value = res.data || []
      totalExpenses.value = (res.data || []).reduce((acc, item) => acc + Number(item.total_amount || 0), 0)
    }
  } catch (e) {
    console.error(e)
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



const exportToExcel = () => {
  if (!expenses.value.length) return
  try {
    const wsData = [
      ['ລາຍງານລາຍຈ່າຍ'],
      ['ໄລຍະເວລາ:', `${startDate.value} ຫາ ${endDate.value}`],
      [''],
      ['ວັນທີຮັບ', 'ເລກທີໃບນຳເຂົ້າ', 'ຜູ້ສະໜອງ', 'ພະນັກງານບັນທຶກ', 'ຍອດເງິນທີ່ຈ່າຍ', 'ສະຖານະ']
    ]
    expenses.value.forEach(e => {
      wsData.push([
        formatDate(e.receive_date),
        e.invoice_number,
        e.supplier?.name || 'ທົ່ວໄປ',
        e.user?.username,
        e.total_amount,
        'ສຳເລັດ'
      ])
    })
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses')
    XLSX.writeFile(wb, `expense_report_${startDate.value}_to_${endDate.value}.xlsx`)
    showToast('ສົ່ງອອກຂໍ້ມູນສຳເລັດ', 'success')
  } catch (e) {
    showToast('ສົ່ງອອກຂໍ້ມູນຫຼົ້ມເຫຼວ', 'error')
  }
}

onMounted(fetchExpenses)
</script>

<style scoped>
.header-icon-container { background-color: rgba(198, 40, 40, 0.1); }
.container-border {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  background-color: rgb(var(--v-theme-surface));
  margin-top: 8px;
}
.shadow-soft { box-shadow: 0 4px 20px rgba(0,0,0,0.04) !important; }
.border-red-darken-2 { border-left: 4px solid #D32F2F !important; }
</style>
