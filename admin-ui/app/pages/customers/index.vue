<template>
  <v-card rounded="lg" elevation="2">
    <!-- Header -->
    <v-card-title class="d-flex align-center py-3 px-4 flex-wrap gap-2">
      <span class="text-h6 font-weight-bold">Customers</span>
      <v-spacer></v-spacer>

      <!-- Search -->
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Search"
        variant="outlined"
        density="compact"
        hide-details
        style="max-width: 240px"
        clearable
        @update:modelValue="loadCustomers"
      ></v-text-field>

      <!-- Tier filter -->
      <v-select
        v-model="tierFilter"
        :items="tierOptions"
        label="Tier"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        style="max-width: 150px"
        @update:modelValue="loadCustomers"
      ></v-select>

      <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">Add Customer</v-btn>
    </v-card-title>
    <v-divider></v-divider>

    <!-- Data Table -->
    <v-data-table
      :headers="headers"
      :items="customers"
      :loading="loading"
      hover
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
        <v-btn icon="mdi-pencil" variant="text" size="small" color="primary" @click="openEditDialog(item)"></v-btn>
        <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="openDeleteDialog(item)"></v-btn>
      </template>
    </v-data-table>

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

    <!-- ── Snackbar ── -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="bottom right">
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" icon="mdi-close" @click="snackbar.show = false"></v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const api = useApi()

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
const deleteDialog      = ref(false)
const deleting          = ref(false)
const selectedCustomer  = ref(null)

// Snackbar
const snackbar = ref({ show: false, message: '', color: 'success' })

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
  snackbar.value = { show: true, message, color }
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
    console.error(err)
    notify('Failed to load customers', 'error')
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
    } else {
      notify(res.message || 'Operation failed', 'error')
    }
  } catch (err) {
    console.error(err)
    notify('An unexpected error occurred', 'error')
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
    } else {
      notify(res.message || 'Failed to delete customer', 'error')
    }
  } catch (err) {
    console.error(err)
    notify('An unexpected error occurred', 'error')
  } finally {
    deleting.value = false
  }
}

// ── Init ───────────────────────────────────────────────
onMounted(loadCustomers)
</script>
