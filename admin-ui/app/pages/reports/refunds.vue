<template>
  <v-container fluid class="pa-6">
    <v-row class="mb-6">
      <v-col cols="12" class="d-flex align-center flex-wrap gap-3">
        <div class="header-icon-container rounded-lg pa-3 me-3">
          <v-icon color="deep-orange" size="32">mdi-backspace-reverse-outline</v-icon>
        </div>
        <div>
          <h1 class="text-h4 font-weight-black mb-1">ລາຍງານການຄືນເງິນ</h1>
          <p class="text-subtitle-1 text-medium-emphasis">ກວດສອບລາຍການຄືນສິນຄ້າ ແລະ ຄືນເງິນໃຫ້ລູກຄ້າ</p>
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
          <v-btn color="deep-orange" variant="elevated" class="rounded-lg mr-2" @click="fetchData" :loading="loading">ຄົ້ນຫາ</v-btn>
          <v-btn color="success" variant="tonal" prepend-icon="mdi-file-excel" @click="exportToExcel">Export</v-btn>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="refundData">
      <v-col cols="12" md="6">
        <v-card border elevation="0" class="rounded-lg pa-6 h-100 bg-deep-orange-lighten-5 shadow-soft border-deep-orange-lighten-4">
          <div class="text-overline text-deep-orange">ຍອດຄືນເງິນທັງໝົດ</div>
          <div class="text-h3 font-weight-black text-deep-orange mt-2">{{ formatCurrency(refundData.summary?.totalAmount || 0) }}</div>
          <div class="text-subtitle-2 mt-2">ຈຳນວນ {{ refundData.summary?.count || 0 }} ລາຍການທີ່ອະນຸມັດແລ້ວ</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card border elevation="0" class="rounded-lg pa-6 h-100 shadow-soft">
          <div class="text-overline text-grey">ໝາຍເຫດ</div>
          <div class="text-subtitle-1 mt-2">ການຄືນເງິນຈະມີຜົນກະທົບຕໍ່ກຳໄລສຸດທິ ແລະ ຈຳນວນສິນຄ້າໃນສາງ (ຖ້າສິນຄ້າຖືກນຳກັບເຂົ້າສາງ).</div>
        </v-card>
      </v-col>

      <v-col cols="12">
        <v-card border elevation="0" class="rounded-lg overflow-hidden shadow-soft">
          <v-data-table
            :headers="headers"
            :items="refundData.refunds"
            :loading="loading"
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
.shadow-soft { box-shadow: 0 4px 20px rgba(0,0,0,0.04) !important; }
</style>
