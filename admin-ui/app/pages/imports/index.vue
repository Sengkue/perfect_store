<template>
  <div class="imports-page">
    
    <!-- ══ HEADER ════════════════════════════════════════════════════ -->
    <div class="header-section mb-6">
      <div class="d-flex align-center gap-3 flex-wrap">
        <div class="d-flex align-center gap-3">
          <div class="icon-box">
            <v-icon icon="mdi-file-check-outline" color="white" size="28" />
          </div>
          <div>
            <h1 class="text-h5 font-weight-bold mb-0">ກວດສອບ ແລະ ນໍາສິນຄ້າເຂົ້າສາງ</h1>
            <p class="text-caption text-medium-emphasis">Process Bills · ອັບເດດສະຖານະການຊຳລະ ແລະ ສັ່ງສິນຄ້າເຂົ້າສາງທັນທີ</p>
          </div>
        </div>
        <v-spacer />
        <v-btn-group variant="outlined" density="comfortable" divided rounded="lg" color="primary">
          <v-btn
            :variant="activeTab === 'search' ? 'flat' : 'outlined'"
            prepend-icon="mdi-magnify"
            @click="activeTab = 'search'"
          >ຄົ້ນຫາ & ນໍາເຂົ້າ</v-btn>
          <v-btn
            :variant="activeTab === 'history' ? 'flat' : 'outlined'"
            prepend-icon="mdi-history"
            @click="activeTab = 'history'; loadImports()"
          >ປະຫວັດການນໍາເຂົ້າ</v-btn>
        </v-btn-group>
      </div>
    </div>

    <!-- ══ TAB 1: SEARCH & PROCESS AREA ══════════════════════════════ -->
    <v-window v-model="activeTab">
      <v-window-item value="search">
        <v-row>
          <v-col cols="12" md="5">
            <v-card rounded="xl" elevation="3" class="search-card overflow-hidden">
              <v-toolbar color="primary" flat>
                <v-toolbar-title class="text-subtitle-1 font-weight-bold">ຄົ້ນຫາໃບບິນ / ເລກທີໃບສັ່ງຊື້</v-toolbar-title>
              </v-toolbar>
              <v-card-text class="pa-6">
                <v-text-field
                  v-model="searchQuery"
                  label="ປ້ອນເລກທີໃບບິນ ຫຼື ເລກທີ PO..."
                  placeholder="Ex: PO-1234..."
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  rounded="lg"
                  class="mb-4"
                  @keyup.enter="performSearch"
                />
                <v-btn
                  block
                  color="primary"
                  size="large"
                  rounded="lg"
                  :loading="searching"
                  prepend-icon="mdi-text-search"
                  @click="performSearch"
                >ຄົ້ນຫາ</v-btn>

                <div v-if="recentBills.length" class="mt-6">
                  <div class="text-caption text-medium-emphasis mb-2">ລາຍການທີ່ຫາຊອກໄວ້ບໍ່ດົນນີ້:</div>
                  <v-list density="compact" rounded="lg" class="border">
                    <v-list-item
                      v-for="b in recentBills"
                      :key="b.id"
                      :title="b.invoice_number"
                      :subtitle="b.supplier?.name"
                      link
                      @click="openDetail(b)"
                    >
                      <template #prepend>
                        <v-icon icon="mdi-history" size="18" color="grey" />
                      </template>
                      <template #append>
                        <v-chip size="x-small" :color="statusColor(b.status)" variant="tonal">
                          {{ statusLabel(b.status) }}
                        </v-chip>
                      </template>
                    </v-list-item>
                  </v-list>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="7">
            <!-- Default State -->
            <div v-if="!selectedImport && !selectedPO && !searching" class="empty-state">
              <v-icon icon="mdi-file-find-outline" size="80" color="grey-lighten-2" />
              <div class="text-h6 text-medium-emphasis">ລໍຖ້າການຄົ້ນຫາ...</div>
              <p class="text-caption text-disabled text-center">ກະລຸນາປ້ອນເລກທີໃບບິນຢູ່ດ້ານຊ້າຍເພື່ອເລີ່ມຕົ້ນການກວດສອບ</p>
            </div>

            <!-- Result State (Import) -->
            <v-fade-transition>
              <v-card v-if="selectedImport" rounded="xl" elevation="4" class="detail-card">
                <v-card-title class="pa-4 pb-0 d-flex align-center">
                  <div>
                    <div class="text-caption text-medium-emphasis">ເລກທີໃບບິນ:</div>
                    <div class="text-h6 font-weight-bold">{{ selectedImport.invoice_number }}</div>
                  </div>
                  <v-spacer />
                  <v-chip :color="statusColor(selectedImport.status)" class="me-2">{{ statusLabel(selectedImport.status) }}</v-chip>
                </v-card-title>
                
                <v-divider class="my-4 mx-4" />

                <v-card-text class="pa-4 pt-0">
                  <v-row dense>
                    <v-col cols="6">
                      <div class="text-caption text-medium-emphasis">ຜູ້ສະໜອງ:</div>
                      <div class="text-body-1 font-weight-semibold">{{ selectedImport.supplier?.name || '—' }}</div>
                    </v-col>
                    <v-col cols="6" class="text-right">
                      <div class="text-caption text-medium-emphasis">ວັນທີໄດ້ຮັບ:</div>
                      <div class="text-body-1 font-weight-semibold">{{ formatDate(selectedImport.receive_date) }}</div>
                    </v-col>
                    <v-col cols="12" class="mt-4">
                      <v-sheet rounded="lg" color="grey-lighten-4" class="pa-4 d-flex align-center">
                        <div>
                          <div class="text-caption text-medium-emphasis">ຍອດລວມທັງໝົດ:</div>
                          <div class="text-h4 font-weight-bold text-success">{{ formatCurrency(selectedImport.total_amount) }}</div>
                        </div>
                        <v-spacer />
                        <div class="text-right">
                          <div class="text-caption text-medium-emphasis">ສະຖານະການຊຳລະ:</div>
                          <v-chip :color="paymentColor(selectedImport.payment_status)" variant="flat">
                            {{ paymentLabel(selectedImport.payment_status) }}
                          </v-chip>
                        </div>
                      </v-sheet>
                    </v-col>
                  </v-row>

                  <!-- Items Table -->
                  <div class="mt-6">
                    <div class="text-subtitle-2 font-weight-bold mb-2">ລາຍການສິນຄ້າ:</div>
                    <v-table density="compact" class="border rounded-lg">
                      <thead>
                        <tr class="bg-grey-lighten-4">
                          <th>ສິນຄ້າ</th>
                          <th class="text-center">ຈໍານວນ</th>
                          <th class="text-right">ລາຄາ/ຊ.ຕ</th>
                          <th class="text-right">ລວມ</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="d in selectedImport.details" :key="d.id">
                          <td>
                            <div class="text-body-2 font-weight-medium">{{ d.product?.name }}</div>
                            <div class="text-caption text-medium-emphasis">
                              {{ [d.variant?.color, d.variant?.size].filter(Boolean).join('/') || 'Default' }}
                            </div>
                          </td>
                          <td class="text-center">{{ d.quantity }}</td>
                          <td class="text-right">{{ formatCurrency(d.unit_cost) }}</td>
                          <td class="text-right font-weight-bold">{{ formatCurrency(d.subtotal) }}</td>
                        </tr>
                      </tbody>
                    </v-table>
                  </div>
                </v-card-text>

                <v-divider />

                <!-- Process Actions -->
                <v-card-actions class="pa-6">
                  <v-btn variant="outlined" rounded="lg" color="grey" @click="selectedImport = null">ປິດ</v-btn>
                  <v-spacer />
                  
                  <template v-if="selectedImport.status !== 'completed' && selectedImport.status !== 'cancelled'">
                    <v-btn
                      color="success"
                      size="large"
                      rounded="lg"
                      variant="flat"
                      prepend-icon="mdi-check-all"
                      :loading="statusChanging"
                      @click="finalizeBill"
                    >
                      ຢືນຢັນຊຳລະ ແລະ ສັ່ງເຂົ້າສາງ
                    </v-btn>
                  </template>
                  <div v-else class="text-caption text-success font-weight-bold">
                    <v-icon icon="mdi-information-outline" size="16" class="me-1" />
                    ລາຍການນີ້ຖືກຈັດການສໍາເລັດແລ້ວ
                  </div>
                </v-card-actions>
              </v-card>
            </v-fade-transition>

            <!-- Result State (Purchase Order Found) -->
            <v-fade-transition>
              <v-card v-if="selectedPO" rounded="xl" elevation="4" class="detail-card po-detail">
                <v-toolbar density="compact" color="orange-darken-1">
                  <v-toolbar-title class="text-subtitle-2 font-weight-bold">ພົບໃບສັ່ງຊື້ (PO): {{ selectedPO.po_number }}</v-toolbar-title>
                </v-toolbar>
                
                <v-card-text class="pa-4">
                  <v-row dense>
                    <v-col cols="6">
                      <div class="text-caption text-medium-emphasis">ຜູ້ສະໜອງ:</div>
                      <div class="text-body-1 font-weight-semibold">{{ selectedPO.supplier?.name }}</div>
                    </v-col>
                    <v-col cols="6" class="text-right">
                      <div class="text-caption text-medium-emphasis">ວັນທີສັ່ງຊື້:</div>
                      <div class="text-body-1 font-weight-semibold">{{ formatDate(selectedPO.order_date) }}</div>
                    </v-col>
                    <v-col cols="12">
                      <v-alert
                        type="info"
                        variant="tonal"
                        density="compact"
                        class="mt-3 text-caption"
                        icon="mdi-information"
                      >
                        ໃບບິນນີ້ຍັງບໍ່ໄດ້ຖືກນໍາເຂົ້າສາງ. ທ່ານສາມາດຢືນຢັນເພື່ອ "ນໍາເຂົ້າສິນຄ້າ" ໄດ້ທັນທີ.
                      </v-alert>
                    </v-col>
                  </v-row>

                  <div class="mt-4">
                    <div class="text-subtitle-2 font-weight-bold mb-2">ລາຍການທີ່ຈະນໍາເຂົ້າ ({{ selectedPO.details?.length }} ລາຍການ):</div>
                    <v-table density="compact" class="border rounded-lg">
                      <thead>
                        <tr class="bg-grey-lighten-4">
                          <th>ສິນຄ້າ</th>
                          <th class="text-center" width="15%">ຈໍານວນ (PO)</th>
                          <th class="text-center" width="20%">ຈໍານວນຮັບແທ້</th>
                          <th class="text-right" width="20%">ລວມ</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="d in selectedPO.details" :key="d.id">
                          <td>
                            <div class="text-body-2 font-weight-medium">{{ d.product?.name }}</div>
                            <div class="text-caption text-medium-emphasis">
                              {{ [d.variant?.color, d.variant?.size].filter(Boolean).join('/') || 'Default' }}
                            </div>
                          </td>
                          <td class="text-center">{{ d.quantity_ordered }}</td>
                          <td>
                            <v-text-field
                              v-model.number="d.quantity_received"
                              type="number"
                              min="1"
                              variant="outlined"
                              density="compact"
                              hide-details
                              style="min-width: 80px"
                            />
                          </td>
                          <td class="text-right font-weight-bold">{{ formatCurrency((d.quantity_received || 0) * d.unit_cost) }}</td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr class="font-weight-bold bg-orange-lighten-5">
                          <td colspan="3" class="text-right">ຍອດລວມທັງໝົດ (ຮັບແທ້):</td>
                          <td class="text-right text-orange-darken-2">
                            {{ formatCurrency(selectedPO.details.reduce((sum, d) => sum + ((d.quantity_received || 0) * d.unit_cost), 0)) }}
                          </td>
                        </tr>
                      </tfoot>
                    </v-table>
                  </div>
                </v-card-text>

                <v-divider />

                <v-card-actions class="pa-6">
                  <v-btn variant="text" color="grey" @click="selectedPO = null">ຍົກເລີກ</v-btn>
                  <v-spacer />
                  <v-btn
                    color="orange-darken-1"
                    size="large"
                    rounded="lg"
                    variant="elevated"
                    prepend-icon="mdi-arrow-right-bold-box-outline"
                    :loading="statusChanging"
                    @click="importFromPO"
                  >
                    ຢືນຢັນນໍາເຂົ້າສິນຄ້າ
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-fade-transition>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- ══ TAB 2: RECENT HISTORY TABLE ════════════════════════════════ -->
      <v-window-item value="history">
        <v-card rounded="xl" elevation="2">
          <v-toolbar color="white" flat>
            <v-toolbar-title class="text-subtitle-1 font-weight-bold">ປະຫວັດການນໍາເຂົ້າສິນຄ້າ</v-toolbar-title>
            <v-spacer />
            <v-btn icon="mdi-refresh" variant="text" @click="loadImports" />
          </v-toolbar>
          <v-data-table
            :headers="headers"
            :items="imports"
            :loading="loading"
            hover
            items-per-page="15"
          >
            <template #item.invoice_number="{ item }">
              <span class="font-weight-medium text-primary cursor-pointer" @click="activeTab = 'search'; openDetail(item)">
                {{ item.invoice_number }}
              </span>
            </template>
            <template #item.supplier="{ item }"> {{ item.supplier?.name || '—' }} </template>
            <template #item.receive_date="{ item }"> {{ formatDate(item.receive_date) }} </template>
            <template #item.total_amount="{ item }">
              <span class="font-weight-bold text-success">{{ formatCurrency(item.total_amount) }}</span>
            </template>
            <template #item.payment_status="{ item }">
              <v-chip :color="paymentColor(item.payment_status)" size="x-small" variant="tonal">
                {{ paymentLabel(item.payment_status) }}
              </v-chip>
            </template>
            <template #item.status="{ item }">
              <v-chip :color="statusColor(item.status)" size="x-small" variant="tonal">
                {{ statusLabel(item.status) }}
              </v-chip>
            </template>
            <template #item.actions="{ item }">
              <v-btn icon="mdi-eye-outline" variant="text" size="small" color="primary" @click="activeTab = 'search'; openDetail(item)" />
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>
    </v-window>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const api = useApi()

// ── STATE ──────────────────────────────────────────
const activeTab = ref('search')
const imports   = ref([])
const loading   = ref(false)
const searchQuery = ref('')
const searching   = ref(false)
const selectedImport = ref(null)
const selectedPO     = ref(null)
const statusChanging = ref(false)
const recentBills   = ref([])

const snackbar = ref({ show: false, message: '', color: 'success' })

const headers = [
  { title: 'ເລກທີໃບບິນ',   key: 'invoice_number' },
  { title: 'ຜູ້ສະໜອງ',     key: 'supplier',        sortable: false },
  { title: 'ວັນທີໄດ້ຮັບ',   key: 'receive_date' },
  { title: 'ຍອດລວມ',       key: 'total_amount' },
  { title: 'ຊຳລະ',         key: 'payment_status',  sortable: false },
  { title: 'ສະຖານະ',       key: 'status',          sortable: false },
  { title: 'ຈັດການ',       key: 'actions',         sortable: false, align: 'end' }
]

// ── SEARCH ─────────────────────────────────────────
const performSearch = async () => {
  if (!searchQuery.value.trim()) return
  searching.value = true
  selectedImport.value = null
  selectedPO.value = null
  try {
    // 1. Search in purchase orders first
    const poRes = await api(`/purchase-orders?search=${searchQuery.value}`)
    if (poRes.success && poRes.data.length > 0) {
      const po = poRes.data[0]
      
      // Check if already received or completed
      if (po.status === 'received' || po.status === 'completed') {
        notify('ໃບສັ່ງຊື້ນີ້ ໄດ້ຖືກນໍາເຂົ້າສາງຮຽບຮ້ອຍແລ້ວ (Already Imported)', 'success')
        
        // Find and show the linked import record
        const impRes = await api(`/imports?purchase_order_id=${po.id}`)
        if (impRes.success && impRes.data.length > 0) {
          await openDetail(impRes.data[0])
          return
        }
      }
      
      if (po.status === 'cancelled') {
        notify('ລາຍການນີ້ຖືກຍົກເລີກແລ້ວ', 'error')
        return
      } 
      
      if (po.status === 'draft') {
        notify('ໃບສັ່ງຊື້ນີ້ຍັງຢູ່ໃນສະຖານະ "ຮ່າງ", ກະລຸນາຢືນຢັນການສັ່ງຊື້ກ່ອນ', 'warning')
        return
      }

      // If status is 'sent' or other available states, allow importing
      await openPODetail(po)
      return
    }

    // 2. Fallback to search existing imports
    const res = await api(`/imports?search=${searchQuery.value}`)
    if (res.success && res.data.length > 0) {
      await openDetail(res.data[0])
      return
    }

    notify('ບໍ່ພົບຂໍ້ມູນໃບບິນ ຫຼື PO ນີ້', 'error')
  } catch (err) {
    notify('ເກີດຂໍ້ຜິດພາດໃນການຄົ້ນຫາ', 'error')
  } finally {
    searching.value = false
  }
}

const openDetail = async (item) => {
  selectedPO.value = null
  try {
    const res = await api(`/imports/${item.id}`)
    if (res.success) {
      selectedImport.value = res.data
      updateRecent(res.data)
    }
  } catch (err) {
    notify('ບໍ່ສາມາດໂຫຼດລາຍລະອຽດໄດ້', 'error')
  }
}

const openPODetail = async (item) => {
  selectedImport.value = null
  try {
    const res = await api(`/purchase-orders/${item.id}`)
    if (res.success) {
      const data = res.data
      // Add quantity_received so users can input actual received count
      if (data.details) {
        data.details = data.details.map(d => ({
          ...d,
          quantity_received: d.quantity_ordered
        }))
      }
      selectedPO.value = data
    }
  } catch (err) {
    notify('ບໍ່ສາມາດໂຫຼດລາຍລະອຽດ PO ໄດ້', 'error')
  }
}

const updateRecent = (item) => {
  recentBills.value = [item, ...recentBills.value.filter(b => b.id !== item.id)].slice(0, 5)
}

// ── ACTIONS ────────────────────────────────────────
const finalizeBill = async () => {
  if (!selectedImport.value) return
  statusChanging.value = true
  try {
    const res = await api(`/imports/${selectedImport.value.id}`, {
      method: 'PUT',
      body: { 
        status: 'completed',
        payment_status: 'paid'
      }
    })
    if (res.success) {
      notify('ສໍາເລັດສິ້ນ! ອັບເດດສະຕ໋ອກສິນຄ້າແລ້ວ', 'success')
      selectedImport.value = res.data
      loadImports()
    } else {
      notify(res.message || 'ບໍ່ສາມາດອັບເດດໄດ້', 'error')
    }
  } catch (err) {
    notify('ເກີດຂໍ້ຜິດພາດ', 'error')
  } finally {
    statusChanging.value = false
  }
}

const importFromPO = async () => {
  if (!selectedPO.value) return
  statusChanging.value = true
  try {
    const payload = {
      purchase_order_id: selectedPO.value.id,
      supplier_id: selectedPO.value.supplier_id,
      invoice_number: selectedPO.value.po_number, // Default to PO number
      receive_date: new Date().toISOString().split('T')[0],
      payment_status: 'pending',
      items: selectedPO.value.details.map(d => ({
        product_id: d.product_id,
        variant_id: d.variant_id,
        quantity: d.quantity_received || d.quantity_ordered,
        unit_cost: d.unit_cost
      }))
    }

    const res = await api('/imports', {
      method: 'POST',
      body: payload
    })

    if (res.success) {
      notify('ນໍາເຂົ້າສິນຄ້າສໍາເລັດ! ກະລຸນາກວດສອບ ແລະ ຢືນຢັນຂັ້ນຕອນສຸດທ້າຍ', 'success')
      selectedPO.value = null
      await openDetail(res.data)
      loadImports()
    } else {
      notify(res.message || 'ບໍ່ສາມາດນໍາເຂົ້າໄດ້', 'error')
    }
  } catch (err) {
    notify('ເກີດຂໍ້ຜິດພາດໃນການນໍາເຂົ້າ', 'error')
  } finally {
    statusChanging.value = false
  }
}

// ── HELPERS ────────────────────────────────────────
const notify = (message, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

const formatCurrency = (v) =>
  v != null ? new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(v) : '—'

const formatDate = (v) =>
  v ? new Date(v).toLocaleDateString('lo-LA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const statusColor = (s) => ({ draft: 'grey', received: 'blue', completed: 'success', cancelled: 'error' }[s] ?? 'grey')
const statusLabel = (s) => ({ draft: 'ຮ່າງ', received: 'ໄດ້ຮັບແລ້ວ', completed: 'ສໍາເລັດ', cancelled: 'ຍົກເລີກ' }[s] ?? s)
const paymentColor = (s) => ({ pending: 'warning', partial: 'orange', paid: 'success' }[s] ?? 'grey')
const paymentLabel = (s) => ({ pending: 'ລໍຖ້າຊຳລະ', partial: 'ຊຳລະບາງສ່ວນ', paid: 'ຊຳລະຄົບ' }[s] ?? s)

const loadImports = async () => {
  loading.value = true
  try {
    const res = await api('/imports?pageSize=100')
    if (res.success) imports.value = res.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadImports()
  
  // Auto-search if redirected from other pages with ?search=...
  const route = useRoute()
  if (route.query.search) {
    searchQuery.value = String(route.query.search)
    performSearch()
  }
})
</script>

<style scoped>
.imports-page { width: 100%; }

.icon-box {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #43a047, #66bb6a);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-card {
  min-height: 380px;
}

.empty-state {
  height: 380px;
  display: flex;
  flex-column: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(var(--v-border-color), 0.3);
  border-radius: 24px;
}

.detail-card {
  min-height: 380px;
}

.cursor-pointer { cursor: pointer; }
</style>
