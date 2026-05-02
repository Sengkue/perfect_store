<template>
  <v-container fluid class="pa-6">
    <!-- ── Header Section ── -->
    <v-row class="mb-6">
      <v-col cols="12" class="d-flex align-center flex-wrap gap-3">
        <div class="header-icon-container rounded-xl pa-3 me-3">
          <v-icon color="primary" size="32">mdi-account-group</v-icon>
        </div>
        <div>
          <h1 class="text-h4 font-weight-black mb-1">ຈັດການລູກຄ້າ</h1>
          <p class="text-subtitle-1 text-medium-emphasis">ລາຍຊື່ລູກຄ້າ, ລະດັບສະມາຊິກ ແລະ ຄະແນນສະສົມ</p>
        </div>
        <v-spacer></v-spacer>
        <v-btn 
          v-if="hasPermission('customers.manage')" 
          color="primary" 
          variant="elevated" 
          size="large"
          class="rounded-xl px-6 font-weight-bold shadow-soft" 
          prepend-icon="mdi-account-plus" 
          @click="openAddDialog"
        >
          ເພີ່ມລູກຄ້າໃໝ່
        </v-btn>
      </v-col>
    </v-row>

    <!-- ── Search & Filters Section ── -->
    <v-card border elevation="0" class="rounded-xl mb-6 shadow-soft pa-4">
      <v-row dense align="center">
        <v-col cols="12" md="4">
          <v-text-field
            v-model="search"
            placeholder="ຄົ້ນຫາຊື່, ເບີໂທ, ອີເມວ..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            hide-details
            rounded="lg"
            clearable
            @update:model-value="loadCustomers"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="tierFilter"
            :items="tierOptions"
            label="ລະດັບສະມາຊິກ"
            variant="outlined"
            density="comfortable"
            hide-details
            rounded="lg"
            clearable
            @update:model-value="loadCustomers"
          />
        </v-col>
        <v-spacer></v-spacer>
        <v-col cols="12" md="auto">
          <div class="d-flex align-center gap-2 px-4 py-2 rounded-lg bg-grey-lighten-4">
            <v-icon icon="mdi-account-star" color="amber-darken-1" size="20"></v-icon>
            <span class="text-caption font-weight-bold text-grey-darken-2">ລູກຄ້າທັງໝົດ:</span>
            <v-chip color="primary" size="small" variant="flat" class="font-weight-black">
              {{ customers.length }}
            </v-chip>
          </div>
        </v-col>
      </v-row>
    </v-card>

    <!-- ── Data Table Section ── -->
    <v-card border elevation="0" class="rounded-xl overflow-hidden shadow-soft">
      <v-data-table
        :headers="headers"
        :items="customers"
        :loading="loading"
        hover
        class="custom-table"
      >
      <!-- Tier chip -->
      <template v-slot:item.customer_tier="{ item }">
        <v-chip
          v-if="item.customer_tier"
          :color="tierColor(item.customer_tier)"
          size="small"
          variant="tonal"
        >
          {{ item.customer_tier }}
        </v-chip>
        <span v-else class="text-medium-emphasis text-caption">—</span>
      </template>

      <!-- Total spent -->
      <template v-slot:item.total_spent="{ item }">
        {{ formatCurrency(item.total_spent) }}
      </template>

      <!-- Actions -->
      <template v-slot:item.actions="{ item }">
        <v-btn v-if="hasPermission('customers.manage')" icon="mdi-pencil" variant="text" size="small" color="primary" @click="openEditDialog(item)"></v-btn>
        <v-btn v-if="hasPermission('customers.manage')" icon="mdi-delete" variant="text" size="small" color="error" @click="openDeleteDialog(item)"></v-btn>
      </template>
    </v-data-table>
  </v-card>

  <!-- ── Add / Edit Dialog ── -->
    <v-dialog v-model="formDialog" max-width="560" persistent>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon :icon="isEditing ? 'mdi-account-edit' : 'mdi-account-plus'" class="me-2" color="primary"></v-icon>
          {{ isEditing ? 'Edit Customer' : 'Add Customer' }}
        </v-card-title>
        <v-divider></v-divider>

        <v-card-text class="pa-4">
          <v-form ref="formRef" @submit.prevent="submitForm">
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.first_name"
                  label="First Name *"
                  prepend-inner-icon="mdi-account-outline"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'First name is required']"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.last_name"
                  label="Last Name *"
                  prepend-inner-icon="mdi-account-outline"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Last name is required']"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.phone"
                  label="Phone"
                  prepend-inner-icon="mdi-phone-outline"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.email"
                  label="Email"
                  prepend-inner-icon="mdi-email-outline"
                  variant="outlined"
                  density="comfortable"
                  type="email"
                  :rules="[v => !v || /.+@.+\..+/.test(v) || 'Invalid email']"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="form.customer_tier"
                  :items="tierOptions"
                  label="Customer Tier"
                  prepend-inner-icon="mdi-star-outline"
                  variant="outlined"
                  density="comfortable"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="form.loyalty_points"
                  label="Loyalty Points"
                  prepend-inner-icon="mdi-gift-outline"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                  min="0"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="form.password"
                  :label="isEditing ? 'New Password (leave blank to keep)' : 'Password'"
                  prepend-inner-icon="mdi-lock-outline"
                  variant="outlined"
                  density="comfortable"
                  :type="showPassword ? 'text' : 'password'"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showPassword = !showPassword"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeFormDialog" :disabled="saving">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" :loading="saving" @click="submitForm">
            {{ isEditing ? 'Save Changes' : 'Add Customer' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Delete Confirmation Dialog ── -->
    <v-dialog v-model="deleteDialog" max-width="400" persistent>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-alert-circle-outline" color="error" class="me-2"></v-icon>
          Confirm Delete
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-4">
          Are you sure you want to delete
          <strong>{{ selectedCustomer?.first_name }} {{ selectedCustomer?.last_name }}</strong>?
          This action cannot be undone.
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false" :disabled="deleting">Cancel</v-btn>
          <v-btn color="error" variant="elevated" :loading="deleting" @click="confirmDelete">Delete</v-btn>
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
const customers  = ref([])
const loading    = ref(false)
const search     = ref('')
const tierFilter = ref(null)

// Form dialog
const formDialog  = ref(false)
const isEditing   = ref(false)
const saving      = ref(false)
const formRef     = ref(null)
const showPassword = ref(false)
const editingId   = ref(null)
const form        = ref(emptyForm())

// Delete dialog
const selectedCustomer  = ref(null)

// ── Constants ──────────────────────────────────────────
const tierOptions = ['Bronze', 'Silver', 'Gold', 'Platinum']

const headers = [
  { title: 'ID',          key: 'id',              width: 70 },
  { title: 'First Name',  key: 'first_name' },
  { title: 'Last Name',   key: 'last_name' },
  { title: 'Phone',       key: 'phone' },
  { title: 'Email',       key: 'email' },
  { title: 'Tier',        key: 'customer_tier' },
  { title: 'Points',      key: 'loyalty_points' },
  { title: 'Total Spent', key: 'total_spent' },
  { title: 'Actions',     key: 'actions',         sortable: false, align: 'end' }
]

// ── Helpers ────────────────────────────────────────────
function emptyForm () {
  return {
    first_name:     '',
    last_name:      '',
    phone:          '',
    email:          '',
    customer_tier:  null,
    loyalty_points: 0,
    password:       ''
  }
}

const tierColor = (tier) => ({
  Bronze:   'brown',
  Silver:   'blue-grey',
  Gold:     'amber',
  Platinum: 'teal'
}[tier] ?? 'grey')

const formatCurrency = (val) =>
  val != null
    ? new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(val)
    : '—'

const notify = (message, color = 'success') => {
  showToast(message, color)
}

const resetForm = () => {
  form.value   = emptyForm()
  editingId.value = null
  showPassword.value = false
  formRef.value?.reset()
}

// ── CRUD ───────────────────────────────────────────────
const loadCustomers = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({ pageSize: 1000 })
    if (search.value)     params.set('search', search.value)
    if (tierFilter.value) params.set('tier', tierFilter.value)

    const res = await api(`/customers?${params.toString()}`)
    if (res.success) customers.value = res.data
  } catch (err) {
    // Error is handled globally by useApi
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  resetForm()
  isEditing.value = false
  formDialog.value = true
}

const openEditDialog = (item) => {
  resetForm()
  isEditing.value = true
  editingId.value = item.id
  form.value = {
    first_name:     item.first_name    ?? '',
    last_name:      item.last_name     ?? '',
    phone:          item.phone         ?? '',
    email:          item.email         ?? '',
    customer_tier:  item.customer_tier ?? null,
    loyalty_points: item.loyalty_points ?? 0,
    password:       ''
  }
  formDialog.value = true
}

const closeFormDialog = () => {
  formDialog.value = false
  resetForm()
}

const submitForm = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  saving.value = true
  try {
    const payload = { ...form.value }
    if (!payload.password)       delete payload.password
    if (!payload.customer_tier)  delete payload.customer_tier

    let res
    if (isEditing.value) {
      res = await api(`/customers/${editingId.value}`, { method: 'PUT', body: payload })
    } else {
      res = await api('/customers', { method: 'POST', body: payload })
    }

    if (res.success) {
      notify(isEditing.value ? 'Customer updated successfully' : 'Customer created successfully')
      closeFormDialog()
      loadCustomers()
    }
  } catch (err) {
    // Error is handled globally by useApi
  } finally {
    saving.value = false
  }
}

const openDeleteDialog = (item) => {
  selectedCustomer.value = item
  deleteDialog.value     = true
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    const res = await api(`/customers/${selectedCustomer.value.id}`, { method: 'DELETE' })
    if (res.success) {
      notify('Customer deleted successfully')
      deleteDialog.value = false
      loadCustomers()
    }
  } catch (err) {
    // Error is handled globally by useApi
  } finally {
    deleting.value = false
  }
}

// ── Init ───────────────────────────────────────────────
onMounted(loadCustomers)
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
