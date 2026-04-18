<template>
  <v-card rounded="lg" elevation="2">
    <!-- Header -->
    <v-card-title class="d-flex align-center py-3 px-4 flex-wrap gap-2">
      <span class="text-h6 font-weight-bold">Employees</span>
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
        @update:modelValue="loadEmployees"
      ></v-text-field>

      <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">Add Employee</v-btn>
    </v-card-title>
    <v-divider></v-divider>

    <!-- Data Table -->
    <v-data-table
      :headers="headers"
      :items="employees"
      :loading="loading"
      hover
    >
      <!-- Hire Date -->
      <template v-slot:item.hire_date="{ item }">
        {{ item.hire_date ? formatDate(item.hire_date) : '—' }}
      </template>

      <!-- Salary -->
      <template v-slot:item.salary="{ item }">
        {{ item.salary != null ? formatCurrency(item.salary) : '—' }}
      </template>

      <!-- Actions -->
      <template v-slot:item.actions="{ item }">
        <v-btn icon="mdi-pencil" variant="text" size="small" color="primary" @click="openEditDialog(item)"></v-btn>
        <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="openDeleteDialog(item)"></v-btn>
      </template>
    </v-data-table>

    <!-- ── Add / Edit Dialog ── -->
    <v-dialog v-model="formDialog" max-width="600" persistent>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon :icon="isEditing ? 'mdi-account-edit' : 'mdi-account-plus'" class="me-2" color="primary"></v-icon>
          {{ isEditing ? 'Edit Employee' : 'Add Employee' }}
        </v-card-title>
        <v-divider></v-divider>

        <v-card-text class="pa-4">
          <v-form ref="formRef" @submit.prevent="submitForm">
            <v-row dense>
              <!-- First Name -->
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

              <!-- Last Name -->
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

              <!-- Phone -->
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.phone"
                  label="Phone"
                  prepend-inner-icon="mdi-phone-outline"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
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
                ></v-text-field>
              </v-col>

              <!-- Hire Date -->
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.hire_date"
                  label="Hire Date"
                  prepend-inner-icon="mdi-calendar-outline"
                  variant="outlined"
                  density="comfortable"
                  type="date"
                ></v-text-field>
              </v-col>

              <!-- Salary -->
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="form.salary"
                  label="Salary"
                  prepend-inner-icon="mdi-cash-outline"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                  min="0"
                  suffix="LAK"
                ></v-text-field>
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
                ></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeFormDialog" :disabled="saving">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" :loading="saving" @click="submitForm">
            {{ isEditing ? 'Save Changes' : 'Add Employee' }}
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
          <strong>{{ selectedEmployee?.first_name }} {{ selectedEmployee?.last_name }}</strong>?
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
const employees = ref([])
const loading   = ref(false)
const search    = ref('')

// Form dialog
const formDialog = ref(false)
const isEditing  = ref(false)
const saving     = ref(false)
const formRef    = ref(null)
const editingId  = ref(null)
const form       = ref(emptyForm())

// Delete dialog
const deleteDialog     = ref(false)
const deleting         = ref(false)
const selectedEmployee = ref(null)

// Snackbar
const snackbar = ref({ show: false, message: '', color: 'success' })

// ── Table headers ──────────────────────────────────────
const headers = [
  { title: 'ID',         key: 'id',        width: 70 },
  { title: 'First Name', key: 'first_name' },
  { title: 'Last Name',  key: 'last_name' },
  { title: 'Phone',      key: 'phone' },
  { title: 'Email',      key: 'email' },
  { title: 'Hire Date',  key: 'hire_date' },
  { title: 'Salary',     key: 'salary' },
  { title: 'Actions',    key: 'actions',   sortable: false, align: 'end' }
]

// ── Helpers ────────────────────────────────────────────
function emptyForm () {
  return {
    first_name: '',
    last_name:  '',
    phone:      '',
    email:      '',
    hire_date:  '',
    salary:     null,
    address:    ''
  }
}

const formatDate = (val) =>
  new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const formatCurrency = (val) =>
  new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(val)

const notify = (message, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

const resetForm = () => {
  form.value    = emptyForm()
  editingId.value = null
  formRef.value?.reset()
}

// ── CRUD ───────────────────────────────────────────────
const loadEmployees = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({ pageSize: 100 })
    if (search.value) params.set('search', search.value)

    const res = await api(`/employees?${params.toString()}`)
    if (res.success) employees.value = res.data
  } catch (err) {
    console.error(err)
    notify('Failed to load employees', 'error')
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  resetForm()
  isEditing.value  = false
  formDialog.value = true
}

const openEditDialog = (item) => {
  resetForm()
  isEditing.value = true
  editingId.value = item.id
  form.value = {
    first_name: item.first_name ?? '',
    last_name:  item.last_name  ?? '',
    phone:      item.phone      ?? '',
    email:      item.email      ?? '',
    hire_date:  item.hire_date  ?? '',
    salary:     item.salary     ?? null,
    address:    item.address    ?? ''
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
    // Strip empty optional fields
    const payload = Object.fromEntries(
      Object.entries(form.value).filter(([, v]) => v !== '' && v !== null)
    )

    let res
    if (isEditing.value) {
      res = await api(`/employees/${editingId.value}`, { method: 'PUT', body: payload })
    } else {
      res = await api('/employees', { method: 'POST', body: payload })
    }

    if (res.success) {
      notify(isEditing.value ? 'Employee updated successfully' : 'Employee created successfully')
      closeFormDialog()
      loadEmployees()
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
  selectedEmployee.value = item
  deleteDialog.value     = true
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    const res = await api(`/employees/${selectedEmployee.value.id}`, { method: 'DELETE' })
    if (res.success) {
      notify('Employee deleted successfully')
      deleteDialog.value = false
      loadEmployees()
    } else {
      notify(res.message || 'Failed to delete employee', 'error')
    }
  } catch (err) {
    console.error(err)
    notify('An unexpected error occurred', 'error')
  } finally {
    deleting.value = false
  }
}

// ── Init ───────────────────────────────────────────────
onMounted(loadEmployees)
</script>
