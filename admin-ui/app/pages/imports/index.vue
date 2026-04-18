<template>
  <v-card rounded="lg" elevation="2">
    <!-- Header -->
    <v-card-title class="d-flex align-center py-3 px-4 flex-wrap gap-2">
      <div class="d-flex align-center">
        <v-icon icon="mdi-package-down" color="primary" class="me-2" />
        <span class="text-h6 font-weight-bold">Stock Imports</span>
      </div>
      <v-spacer />

      <!-- Filters -->
      <v-text-field
        v-model="filters.search"
        placeholder="Search invoice…"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        style="max-width:200px"
        @update:model-value="loadImports"
      />
      <v-select
        v-model="filters.status"
        :items="statusOptions"
        label="Status"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        style="max-width:160px"
        @update:model-value="loadImports"
      />
      <v-btn color="primary" prepend-icon="mdi-plus" to="/imports/create">
        New Import
      </v-btn>
    </v-card-title>
    <v-divider />

    <!-- Table -->
    <v-data-table
      :headers="headers"
      :items="imports"
      :loading="loading"
      hover
      items-per-page="15"
    >
      <!-- Invoice number -->
      <template #item.invoice_number="{ item }">
        <span class="font-weight-medium text-primary" style="cursor:pointer" @click="openDetail(item)">
          {{ item.invoice_number }}
        </span>
      </template>

      <!-- Supplier -->
      <template #item.supplier="{ item }">
        {{ item.supplier?.name ?? '—' }}
      </template>

      <!-- Receive date -->
      <template #item.receive_date="{ item }">
        {{ item.receive_date ? new Date(item.receive_date).toLocaleDateString() : '—' }}
      </template>

      <!-- Total amount -->
      <template #item.total_amount="{ item }">
        <span class="font-weight-medium">{{ formatCurrency(item.total_amount) }}</span>
      </template>

      <!-- Payment status chip -->
      <template #item.payment_status="{ item }">
        <v-chip :color="paymentColor(item.payment_status)" size="small" variant="tonal">
          {{ item.payment_status }}
        </v-chip>
      </template>

      <!-- Status chip -->
      <template #item.status="{ item }">
        <v-chip :color="statusColor(item.status)" size="small" variant="tonal">
          {{ item.status }}
        </v-chip>
      </template>

      <!-- Created by -->
      <template #item.employee="{ item }">
        {{ item.employee ? `${item.employee.first_name} ${item.employee.last_name}` : '—' }}
      </template>

      <!-- Actions -->
      <template #item.actions="{ item }">
        <div class="d-flex align-center justify-end gap-1">
          <v-btn icon="mdi-eye" variant="text" size="small" color="primary" @click="openDetail(item)" />
          <v-menu v-if="item.status !== 'completed' && item.status !== 'cancelled'">
            <template #activator="{ props }">
              <v-btn icon="mdi-chevron-down" variant="text" size="small" v-bind="props" />
            </template>
            <v-list density="compact">
              <v-list-item
                v-for="opt in nextStatuses(item.status)"
                :key="opt.value"
                :prepend-icon="opt.icon"
                :title="opt.label"
                @click="changeStatus(item, opt.value)"
              />
            </v-list>
          </v-menu>
          <v-btn
            v-if="item.status === 'draft'"
            icon="mdi-delete"
            variant="text"
            size="small"
            color="error"
            @click="openDeleteDialog(item)"
          />
        </div>
      </template>
    </v-data-table>

    <!-- ── Detail Dialog ── -->
    <v-dialog v-model="detailDialog" max-width="760" scrollable>
      <v-card rounded="lg" v-if="selectedImport">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-file-document-outline" color="primary" class="me-2" />
          Import Detail — {{ selectedImport.invoice_number }}
          <v-spacer />
          <v-chip :color="statusColor(selectedImport.status)" size="small" variant="tonal">
            {{ selectedImport.status }}
          </v-chip>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <!-- Meta info -->
          <v-row class="mb-4" dense>
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Supplier</div>
              <div class="font-weight-medium">{{ selectedImport.supplier?.name ?? '—' }}</div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Receive Date</div>
              <div class="font-weight-medium">{{ selectedImport.receive_date ? new Date(selectedImport.receive_date).toLocaleDateString() : '—' }}</div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Payment</div>
              <v-chip :color="paymentColor(selectedImport.payment_status)" size="x-small" variant="tonal">
                {{ selectedImport.payment_status }}
              </v-chip>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Total Amount</div>
              <div class="text-h6 font-weight-bold text-primary">{{ formatCurrency(selectedImport.total_amount) }}</div>
            </v-col>
          </v-row>

          <!-- Line items -->
          <v-table density="compact" class="rounded-lg">
            <thead>
              <tr>
                <th>Product</th>
                <th>Variant</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Unit Cost</th>
                <th class="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in selectedImport.details ?? []" :key="d.id">
                <td>{{ d.product?.name ?? '—' }}</td>
                <td>
                  <span v-if="d.variant" class="text-caption text-medium-emphasis">
                    {{ [d.variant.color, d.variant.size].filter(Boolean).join(' / ') }}
                  </span>
                  <span v-else>—</span>
                </td>
                <td class="text-right">{{ d.quantity }}</td>
                <td class="text-right">{{ formatCurrency(d.unit_cost) }}</td>
                <td class="text-right font-weight-medium">{{ formatCurrency(d.subtotal) }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="detailDialog = false">Close</v-btn>
          <v-btn
            v-for="opt in nextStatuses(selectedImport.status)"
            :key="opt.value"
            :color="opt.color"
            variant="elevated"
            :prepend-icon="opt.icon"
            :loading="statusChanging"
            @click="changeStatus(selectedImport, opt.value)"
          >
            {{ opt.label }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Delete Dialog ── -->
    <v-dialog v-model="deleteDialog" max-width="400" persistent>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-alert-circle-outline" color="error" class="me-2" />
          Confirm Delete
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          Delete import <strong>{{ selectedImport?.invoice_number }}</strong>? This action cannot be undone.
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false" :disabled="deleting">Cancel</v-btn>
          <v-btn color="error" variant="elevated" :loading="deleting" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="bottom right">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" icon="mdi-close" @click="snackbar.show = false" />
      </template>
    </v-snackbar>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const api = useApi()

// ── State ──────────────────────────────────────────
const imports   = ref([])
const loading   = ref(false)
const filters   = ref({ search: '', status: null })

const detailDialog  = ref(false)
const deleteDialog  = ref(false)
const selectedImport = ref(null)
const statusChanging = ref(false)
const deleting       = ref(false)

const snackbar = ref({ show: false, message: '', color: 'success' })

// ── Table headers ──────────────────────────────────
const headers = [
  { title: 'Invoice #',       key: 'invoice_number' },
  { title: 'Supplier',        key: 'supplier',        sortable: false },
  { title: 'Receive Date',    key: 'receive_date' },
  { title: 'Total',           key: 'total_amount' },
  { title: 'Payment',         key: 'payment_status',  sortable: false },
  { title: 'Status',          key: 'status',          sortable: false },
  { title: 'Created By',      key: 'employee',        sortable: false },
  { title: 'Actions',         key: 'actions',         sortable: false, align: 'end' }
]

const statusOptions = ['draft', 'received', 'completed', 'cancelled']

// ── Helpers ────────────────────────────────────────
const notify = (message, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

const formatCurrency = (v) =>
  v != null ? `$${Number(v).toFixed(2)}` : '—'

const statusColor = (s) =>
  ({ draft: 'grey', received: 'blue', completed: 'success', cancelled: 'error' }[s] ?? 'grey')

const paymentColor = (s) =>
  ({ pending: 'warning', partial: 'orange', paid: 'success' }[s] ?? 'grey')

const nextStatuses = (current) => {
  const map = {
    draft:    [{ value: 'received',  label: 'Mark Received',  icon: 'mdi-truck-check',    color: 'blue'    },
               { value: 'cancelled', label: 'Cancel Import',  icon: 'mdi-cancel',         color: 'error'   }],
    received: [{ value: 'completed', label: 'Complete & Add to Stock', icon: 'mdi-check-circle', color: 'success' },
               { value: 'cancelled', label: 'Cancel Import',  icon: 'mdi-cancel',         color: 'error'   }],
  }
  return map[current] ?? []
}

// ── Data loading ───────────────────────────────────
const loadImports = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({ pageSize: 200 })
    if (filters.value.status) params.set('status', filters.value.status)
    const res = await api(`/imports?${params}`)
    if (res.success) imports.value = res.data
  } catch (err) {
    console.error(err)
    notify('Failed to load imports', 'error')
  } finally {
    loading.value = false
  }
}

// ── Detail ─────────────────────────────────────────
const openDetail = async (item) => {
  try {
    const res = await api(`/imports/${item.id}`)
    if (res.success) {
      selectedImport.value = res.data
      detailDialog.value = true
    }
  } catch (err) {
    console.error(err)
    notify('Failed to load import details', 'error')
  }
}

// ── Status change ──────────────────────────────────
const changeStatus = async (item, newStatus) => {
  statusChanging.value = true
  try {
    const res = await api(`/imports/${item.id}/status`, {
      method: 'PUT',
      body: { status: newStatus }
    })
    if (res.success) {
      notify(`Import ${newStatus === 'completed' ? 'completed — stock updated!' : 'status updated'}`, 'success')
      detailDialog.value = false
      loadImports()
    } else {
      notify(res.message || 'Update failed', 'error')
    }
  } catch (err) {
    console.error(err)
    notify('An error occurred', 'error')
  } finally {
    statusChanging.value = false
  }
}

// ── Delete ─────────────────────────────────────────
const openDeleteDialog = (item) => {
  selectedImport.value = item
  deleteDialog.value = true
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    const res = await api(`/imports/${selectedImport.value.id}`, { method: 'DELETE' })
    if (res.success) {
      notify('Import deleted')
      deleteDialog.value = false
      loadImports()
    } else {
      notify(res.message || 'Delete failed', 'error')
    }
  } catch (err) {
    console.error(err)
    notify('An error occurred', 'error')
  } finally {
    deleting.value = false
  }
}

// ── Init ───────────────────────────────────────────
onMounted(loadImports)
</script>
