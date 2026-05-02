<template>
  <v-container fluid class="pa-6" v-if="hasPermission('suppliers.view')">
    <!-- ── Header Section ── -->
    <v-row class="mb-6">
      <v-col cols="12" class="d-flex align-center flex-wrap gap-3">
        <div class="header-icon-container rounded-xl pa-3 me-3">
          <v-icon color="primary" size="32">mdi-handshake</v-icon>
        </div>
        <div>
          <h1 class="text-h4 font-weight-black mb-1">ຈັດການຜູ້ສະໜອງ</h1>
          <p class="text-subtitle-1 text-medium-emphasis">ລາຍຊື່ ແລະ ຂໍ້ມູນຕິດຕໍ່ຂອງບໍລິສັດຜູ້ສະໜອງສິນຄ້າ</p>
        </div>
        <v-spacer></v-spacer>
        <v-btn 
          v-if="hasPermission('suppliers.create')" 
          color="primary" 
          variant="elevated" 
          size="large"
          class="rounded-xl px-6 font-weight-bold shadow-soft" 
          prepend-icon="mdi-plus" 
          @click="openAddDialog"
        >
          ເພີ່ມຜູ້ສະໜອງໃໝ່
        </v-btn>
      </v-col>
    </v-row>

    <!-- ── Search & Stats Section ── -->
    <v-card border elevation="0" class="rounded-xl mb-6 shadow-soft pa-4">
      <v-row dense align="center">
        <v-col cols="12" md="4">
          <v-text-field
            v-model="search"
            placeholder="ຄົ້ນຫາຜູ້ສະໜອງ..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            hide-details
            rounded="lg"
            clearable
            @update:model-value="debouncedLoad"
          />
        </v-col>
        <v-spacer></v-spacer>
        <v-col cols="12" md="auto">
          <div class="d-flex align-center gap-2 px-4 py-2 rounded-lg bg-grey-lighten-4">
            <v-icon icon="mdi-account-group" color="grey-darken-1" size="20"></v-icon>
            <span class="text-caption font-weight-bold text-grey-darken-2">ຜູ້ສະໜອງທັງໝົດ:</span>
            <v-chip color="primary" size="small" variant="flat" class="font-weight-black">
              {{ pagination.total || suppliers.length }}
            </v-chip>
          </div>
        </v-col>
      </v-row>
    </v-card>

    <!-- ── Data Table Section ── -->
    <v-card border elevation="0" class="rounded-xl overflow-hidden shadow-soft">
      <v-data-table
        :headers="headers"
        :items="suppliers"
        :loading="loading"
        hover
        items-per-page="15"
        class="custom-table"
      >
      <!-- Supplier name with initial avatar -->
      <template #item.name="{ item }">
        <div class="d-flex align-center gap-3 py-1">
          <v-avatar color="primary" size="36" variant="tonal">
            <span class="text-caption font-weight-bold">
              {{ item.name.slice(0,2).toUpperCase() }}
            </span>
          </v-avatar>
          <div>
            <div class="font-weight-medium">{{ item.name }}</div>
            <div class="text-caption text-medium-emphasis" v-if="item.contact_person">
              <v-icon size="12" class="me-1">mdi-account-outline</v-icon>
              {{ item.contact_person }}
            </div>
          </div>
        </div>
      </template>

      <!-- Contact -->
      <template #item.contact="{ item }">
        <div class="text-caption">
          <v-icon size="12" class="me-1" color="grey">mdi-phone</v-icon>
          {{ item.phone || '—' }}
        </div>
        <div class="text-caption text-medium-emphasis" v-if="item.email">
          <v-icon size="12" class="me-1" color="grey">mdi-email</v-icon>
          {{ item.email }}
        </div>
      </template>

      <!-- Actions -->
      <template #item.actions="{ item }">
        <div class="d-flex align-center justify-end gap-1">
          <v-tooltip text="Edit Supplier" location="top">
            <template #activator="{ props }">
            <v-btn v-if="hasPermission('suppliers.edit')" v-bind="props" icon="mdi-pencil" variant="text" size="small" color="primary" @click="openEditDialog(item)" />
          </template>
        </v-tooltip>
        <v-tooltip v-if="hasPermission('suppliers.delete')" text="Delete Supplier" location="top">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon="mdi-delete" variant="text" size="small" color="error" @click="openDeleteDialog(item)" />
            </template>
          </v-tooltip>
        </div>
      </template>

      <!-- Empty state -->
      <template #no-data>
        <div class="text-center py-8">
          <v-icon size="64" color="grey-lighten-2">mdi-handshake</v-icon>
          <div class="text-h6 text-grey mt-3">No suppliers found</div>
          <div class="text-body-2 text-medium-emphasis mb-4">Add your first supplier to get started</div>
          <v-btn v-if="hasPermission('suppliers.create')" color="primary" prepend-icon="mdi-plus" @click="openAddDialog">Add Supplier</v-btn>
        </div>
      </template>
    </v-data-table>
  </v-card>

  <!-- ══════════════ ADD / EDIT DIALOG ══════════════ -->
    <v-dialog v-model="formDialog" max-width="560" persistent>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon :icon="isEditing ? 'mdi-pencil' : 'mdi-plus'" class="me-2" color="primary" />
          {{ isEditing ? 'Edit Supplier' : 'Add Supplier' }}
        </v-card-title>
        <v-divider />

        <v-card-text class="pa-4">
          <v-form ref="formRef">
            <v-row dense>
              <!-- Company Name -->
              <v-col cols="12">
                <v-text-field
                  v-model="form.name"
                  label="Company / Supplier Name *"
                  prepend-inner-icon="mdi-domain"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Name is required']"
                />
              </v-col>

              <!-- Contact Person -->
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.contact_person"
                  label="Contact Person"
                  prepend-inner-icon="mdi-account-outline"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <!-- Phone -->
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.phone"
                  label="Phone"
                  prepend-inner-icon="mdi-phone-outline"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <!-- Email -->
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.email"
                  label="Email"
                  prepend-inner-icon="mdi-email-outline"
                  variant="outlined"
                  density="comfortable"
                  type="email"
                  :rules="[v => !v || /.+@.+\..+/.test(v) || 'Invalid email']"
                />
              </v-col>

              <!-- Tax Number -->
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.tax_number"
                  label="Tax / VAT Number"
                  prepend-inner-icon="mdi-file-certificate-outline"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <!-- Address -->
              <v-col cols="12">
                <v-textarea
                  v-model="form.address"
                  label="Address"
                  prepend-inner-icon="mdi-map-marker-outline"
                  variant="outlined"
                  density="comfortable"
                  rows="2"
                  auto-grow
                />
              </v-col>

              <!-- Notes -->
              <v-col cols="12">
                <v-textarea
                  v-model="form.notes"
                  label="Notes"
                  prepend-inner-icon="mdi-note-text-outline"
                  variant="outlined"
                  density="comfortable"
                  rows="2"
                  auto-grow
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="closeFormDialog" :disabled="saving">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" :loading="saving" @click="submitForm">
            {{ isEditing ? 'Save Changes' : 'Add Supplier' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ══════════════ DELETE DIALOG ══════════════ -->
    <v-dialog v-model="deleteDialog" max-width="420" persistent>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-alert-circle-outline" color="error" class="me-2" />
          Confirm Delete
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <p>
            Are you sure you want to delete supplier
            <strong>{{ selectedSupplier?.name }}</strong>?
          </p>
          <v-alert type="warning" variant="tonal" density="compact" class="mt-3">
            Products and imports linked to this supplier may be affected.
          </v-alert>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false" :disabled="deleting">Cancel</v-btn>
          <v-btn color="error" variant="elevated" :loading="deleting" @click="confirmDelete">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast } from '~/composables/useToast'

const api = useApi()
const { hasPermission } = usePermissions()

// ── State ──────────────────────────────────────────────
const suppliers  = ref([])
const loading    = ref(false)
const search     = ref('')
const pagination = ref({ total: 0, page: 1, pageSize: 50 })

// Form dialog
const formDialog = ref(false)
const isEditing  = ref(false)
const saving     = ref(false)
const formRef    = ref(null)
const editingId  = ref(null)
const form       = ref(emptyForm())

// Delete dialog
const deleteDialog = ref(false)
const deleting     = ref(false)
const selectedSupplier  = ref(null)

// ── Table headers ──────────────────────────────────────
const headers = [
  { title: 'Supplier',       key: 'name',    minWidth: 220 },
  { title: 'Contact',        key: 'contact', sortable: false },
  { title: 'Address',        key: 'address', sortable: false },
  { title: 'Tax Number',     key: 'tax_number', sortable: false },
  { title: 'Actions',        key: 'actions', sortable: false, align: 'end' }
]

// ── Helpers ────────────────────────────────────────────
function emptyForm () {
  return {
    name: '', contact_person: '', phone: '',
    email: '', address: '', tax_number: '', notes: ''
  }
}

const notify = (message, color = 'success') => {
  showToast(message, color)
}

let searchTimer = null
const debouncedLoad = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(loadSuppliers, 350)
}

// ── Data Loading ───────────────────────────────────────
const loadSuppliers = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({ pageSize: '200' })
    if (search.value) params.set('search', search.value)

    const res = await api(`/suppliers?${params}`)
    if (res.success) {
      suppliers.value = res.data
      if (res.pagination) pagination.value = res.pagination
    }
  } catch (err) {
    // Error is handled globally by useApi
  } finally {
    loading.value = false
  }
}

// ── CRUD ───────────────────────────────────────────────
const openAddDialog = () => {
  form.value   = emptyForm()
  isEditing.value  = false
  editingId.value  = null
  formDialog.value = true
}

const openEditDialog = (item) => {
  form.value = {
    name:           item.name           ?? '',
    contact_person: item.contact_person ?? '',
    phone:          item.phone          ?? '',
    email:          item.email          ?? '',
    address:        item.address        ?? '',
    tax_number:     item.tax_number     ?? '',
    notes:          item.notes          ?? ''
  }
  isEditing.value  = true
  editingId.value  = item.id
  formDialog.value = true
}

const closeFormDialog = () => {
  formDialog.value = false
  formRef.value?.reset()
}

const submitForm = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  saving.value = true
  try {
    const payload = Object.fromEntries(
      Object.entries(form.value).filter(([, v]) => v !== '' && v !== null)
    )

    let res
    if (isEditing.value) {
      res = await api(`/suppliers/${editingId.value}`, { method: 'PUT', body: payload })
    } else {
      res = await api('/suppliers', { method: 'POST', body: payload })
    }

    if (res.success) {
      notify(isEditing.value ? 'Supplier updated successfully' : 'Supplier added successfully')
      closeFormDialog()
      loadSuppliers()
    }
  } catch (err) {
    // Error is handled globally by useApi
  } finally {
    saving.value = false
  }
}

const openDeleteDialog = (item) => {
  selectedSupplier.value = item
  deleteDialog.value     = true
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    const res = await api(`/suppliers/${selectedSupplier.value.id}`, { method: 'DELETE' })
    if (res.success) {
      notify('Supplier deleted successfully')
      deleteDialog.value = false
      loadSuppliers()
    }
  } catch (err) {
    // Error is handled globally by useApi
  } finally {
    deleting.value = false
  }
}

// ── Init ───────────────────────────────────────────────
onMounted(loadSuppliers)
</script>

<style scoped>
.header-icon-container {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.shadow-soft {
  box-shadow: 0 4px 20px rgba(0,0,0,0.04) !important;
}

.custom-table :deep(th) {
  font-weight: bold !important;
  color: #555 !important;
  background-color: #FAFAFA !important;
  text-transform: uppercase;
  font-size: 0.75rem !important;
  letter-spacing: 0.05em;
}
</style>
