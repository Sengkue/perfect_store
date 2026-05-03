<template>
  <v-container fluid class="pa-2 container-border">
    <v-row class="mb-2">
      <v-col cols="12" class="d-flex align-center flex-wrap gap-2">
        <div class="header-icon-container rounded-lg pa-2 me-3">
          <v-icon color="deep-orange" size="20">mdi-backspace-reverse-outline</v-icon>
        </div>
        <div>
          <h1 class="text-h5 font-weight-bold mb-0">ລາຍງານການຄືນເງິນ</h1>
          <div class="text-caption text-medium-emphasis">ກວດສອບລາຍການຄືນສິນຄ້າ ແລະ ຄືນເງິນໃຫ້ລູກຄ້າ</div>
        </div>
        <v-spacer></v-spacer>

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
            <v-date-picker v-model="startDateValue" color="deep-orange" @update:model-value="menuStart = false"></v-date-picker>
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
            <v-date-picker v-model="endDateValue" color="deep-orange" @update:model-value="menuEnd = false"></v-date-picker>
          </v-menu>

          <v-divider vertical class="mx-2"></v-divider>
          <v-btn color="deep-orange" variant="elevated" size="small" class="rounded-lg mr-2" @click="fetchData" :loading="loading">ຄົ້ນຫາ</v-btn>
          <v-btn color="success" variant="tonal" size="small" prepend-icon="mdi-file-excel" @click="exportToExcel">Export</v-btn>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="refundData" class="mb-4">
      <v-col cols="12" sm="6" md="4">
        <v-card border elevation="0" class="rounded-lg overflow-hidden shadow-soft">
          <div class="pa-3 d-flex align-center">
            <v-avatar color="deep-orange-lighten-5" rounded="lg" size="36" class="me-4">
              <v-icon color="deep-orange-darken-2" size="20">mdi-cash-refund</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-grey font-weight-bold text-uppercase" style="font-size: 0.7rem">ຍອດຄືນເງິນທັງໝົດ</div>
              <div class="text-h6 font-weight-bold text-deep-orange-darken-2">{{ formatCurrency(refundData.summary?.totalAmount || 0) }}</div>
            </div>
          </div>
          <v-divider></v-divider>
          <div class="px-3 py-1 bg-deep-orange-lighten-5 text-caption text-deep-orange-darken-4">
            ຈຳນວນ {{ refundData.summary?.count || 0 }} ລາຍການທີ່ອະນຸມັດແລ້ວ
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card border elevation="0" class="rounded-lg overflow-hidden shadow-soft">
          <div class="pa-3 d-flex align-center">
            <v-avatar color="grey-lighten-4" rounded="lg" size="36" class="me-4">
              <v-icon color="grey-darken-2" size="20">mdi-information-outline</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-grey font-weight-bold text-uppercase" style="font-size: 0.7rem">ໝາຍເຫດ</div>
              <div class="text-subtitle-2 text-medium-emphasis">ລາຍງານຜົນກະທົບຕໍ່ກຳໄລ</div>
            </div>
          </div>
          <v-divider></v-divider>
          <div class="px-3 py-1 bg-grey-lighten-5 text-caption text-grey-darken-4">
            ການຄືນເງິນມີຜົນກະທົບຕໍ່ກຳໄລສຸດທິ
          </div>
        </v-card>
      </v-col>

      <v-col cols="12">
        <v-card border elevation="0" class="rounded-lg overflow-hidden shadow-soft">
          <v-data-table
            :headers="headers"
            :items="refundData.refunds"
            :loading="loading"
            density="compact"
            hover
          >
            <template v-slot:item.refund_date="{ item }">
              {{ formatDate(item.refund_date) }}
            </template>
            <template v-slot:item.refund_amount="{ item }">
              <span class="font-weight-bold text-deep-orange">{{ formatCurrency(item.refund_amount) }}</span>
            </template>
            <template v-slot:item.sale_id="{ item }">
              <v-chip size="small" variant="tonal" color="primary">#{{ item.sale_id }}</v-chip>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
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

const startDateValue = ref(new Date())
const endDateValue = ref(new Date())

const startDateFormatted = computed(() => formatDateDisplay(startDateValue.value))
const endDateFormatted = computed(() => formatDateDisplay(endDateValue.value))

const startDate = computed(() => toISODate(startDateValue.value))
const endDate = computed(() => toISODate(endDateValue.value))

const refundData = ref(null)

function formatDateDisplay(date) {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-GB').format(date)
}

function toISODate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

const headers = [
  { title: 'ວັນທີຄືນ', key: 'refund_date' },
  { title: 'ເລກບິນຂາຍ', key: 'sale_id' },
  { title: 'ເຫດຜົນ', key: 'reason' },
  { title: 'ຈຳນວນເງິນ', key: 'refund_amount', align: 'end' },
  { title: 'ຜູ້ເຮັດລາຍການ', key: 'user.username' }
]

const fetchData = async () => {
  loading.value = true
  try {
    const res = await api('/reports/refunds', { params: { startDate: startDate.value, endDate: endDate.value } })
    if (res.success) refundData.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const formatCurrency = (val) => new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK', maximumFractionDigits: 0 }).format(val)

const formatDate = (val) => new Date(val).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const exportToExcel = () => {
  if (!refundData.value?.refunds) return
  try {
    const data = refundData.value.refunds.map(r => ({
      'ວັນທີຄືນ': formatDate(r.refund_date),
      'ເລກບິນຂາຍ': r.sale_id,
      'ເຫດຜົນ': r.reason,
      'ຈຳນວນເງິນ': r.refund_amount,
      'ຜູ້ເຮັດລາຍການ': r.user?.username
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Refunds')
    XLSX.writeFile(wb, `refund_report_${startDate.value}_to_${endDate.value}.xlsx`)
    showToast('ສົ່ງອອກຂໍ້ມູນສຳເລັດ', 'success')
  } catch (e) {
    console.error(e)
    showToast('ສົ່ງອອກຂໍ້ມູນຫຼົ້ມເຫຼວ', 'error')
  }
}

onMounted(fetchData)
</script>

<style scoped>
.header-icon-container { background-color: rgba(255, 87, 34, 0.1); }
.container-border {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  background-color: rgb(var(--v-theme-surface));
  margin-top: 8px;
}
.shadow-soft { box-shadow: 0 4px 20px rgba(0,0,0,0.04) !important; }
</style>
