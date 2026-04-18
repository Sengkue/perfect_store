<template>
  <v-card rounded="lg" elevation="2">
    <!-- ── Header ── -->
    <v-card-title class="d-flex align-center py-3 px-4 flex-wrap gap-2">
      <div class="d-flex align-center">
        <v-icon icon="mdi-shield-account" color="primary" class="me-2" />
        <span class="text-h6 font-weight-bold">User Management</span>
      </div>
      <v-spacer />

      <!-- Filters -->
      <v-text-field
        v-model="filters.search"
        placeholder="Search username…"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        style="max-width:200px"
        @update:model-value="debouncedLoad"
      />
      <v-select
        v-model="filters.role"
        :items="roleFilterOptions"
        label="Role"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        style="max-width:140px"
        @update:model-value="loadUsers"
      />
      <v-select
        v-model="filters.is_active"
        :items="activeFilterOptions"
        label="Status"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        style="max-width:130px"
        @update:model-value="loadUsers"
      />
      <v-btn color="primary" prepend-icon="mdi-account-plus" @click="openAddDialog">
        Add User
      </v-btn>
    </v-card-title>
    <v-divider />

    <!-- ── Stats strip ── -->
    <div class="d-flex px-4 py-2 gap-4 border-b" style="background:rgba(var(--v-theme-surface-variant),.25)">
      <div v-for="s in stats" :key="s.label" class="d-flex align-center gap-2">
        <v-icon :icon="s.icon" :color="s.color" size="18" />
        <span class="text-caption font-weight-medium">{{ s.label }}:</span>
        <v-chip :color="s.color" size="x-small" variant="tonal">{{ s.value }}</v-chip>
      </div>
    </div>

    <!-- ── Data Table ── -->
    <v-data-table
      :headers="headers"
      :items="users"
      :loading="loading"
      hover
      items-per-page="15"
    >
      <!-- Avatar + username -->
      <template #item.username="{ item }">
        <div class="d-flex align-center gap-3 py-1">
          <v-avatar :color="avatarColor(item.role)" size="34">
            <span class="text-caption font-weight-bold text-white">
              {{ item.username.slice(0,2).toUpperCase() }}
            </span>
          </v-avatar>
          <div>
            <div class="font-weight-medium">{{ item.username }}</div>
            <div class="text-caption text-medium-emphasis" v-if="item.employee">
              {{ item.employee.first_name }} {{ item.employee.last_name }}
            </div>
          </div>
        </div>
      </template>

      <!-- Role chip -->
      <template #item.role="{ item }">
        <v-chip :color="roleColor(item.role)" size="small" variant="tonal" :prepend-icon="roleIcon(item.role)">
          {{ item.role }}
        </v-chip>
      </template>

      <!-- Active status -->
      <template #item.is_active="{ item }">
        <v-chip
          :color="item.is_active ? 'success' : 'error'"
          size="small"
          variant="tonal"
          :prepend-icon="item.is_active ? 'mdi-check-circle' : 'mdi-close-circle'"
        >
          {{ item.is_active ? 'Active' : 'Inactive' }}
        </v-chip>
      </template>

      <!-- Last login -->
      <template #item.last_login="{ item }">
        <span class="text-caption text-medium-emphasis">
          {{ item.last_login ? formatDateTime(item.last_login) : 'Never' }}
        </span>
      </template>

      <!-- Actions -->
      <template #item.actions="{ item }">
        <div class="d-flex align-center justify-end gap-1">
          <!-- Edit -->
          <v-tooltip text="Edit User" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-pencil" variant="text" size="small" color="primary" @click="openEditDialog(item)" />
            </template>
          </v-tooltip>

          <!-- Toggle active -->
          <v-tooltip :text="item.is_active ? 'Deactivate' : 'Activate'" location="top">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                :icon="item.is_active ? 'mdi-account-off' : 'mdi-account-check'"
                variant="text"
                size="small"
                :color="item.is_active ? 'warning' : 'success'"
                @click="toggleActive(item)"
              />
            </template>
          </v-tooltip>

          <!-- Reset password -->
          <v-tooltip text="Reset Password" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-lock-reset" variant="text" size="small" color="orange" @click="openResetDialog(item)" />
            </template>
          </v-tooltip>

          <!-- Delete -->
          <v-tooltip text="Delete User" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-delete" variant="text" size="small" color="error" @click="openDeleteDialog(item)" />
            </template>
          </v-tooltip>
        </div>
      </template>
    </v-data-table>

    <!-- ══════════════ ADD / EDIT DIALOG ══════════════ -->
    <v-dialog v-model="formDialog" max-width="520" persistent>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon :icon="isEditing ? 'mdi-account-edit' : 'mdi-account-plus'" class="me-2" color="primary" />
          {{ isEditing ? 'Edit User' : 'Create New User' }}
        </v-card-title>
        <v-divider />

        <v-card-text class="pa-4">
          <v-form ref="formRef">
            <v-row dense>
              <!-- Username -->
              <v-col cols="12">
                <v-text-field
                  v-model="form.username"
                  label="Username *"
                  prepend-inner-icon="mdi-account-outline"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Username is required', v => v.length >= 3 || 'Min 3 characters']"
                  :disabled="isEditing"
                  hint="Cannot be changed after creation"
                  :persistent-hint="isEditing"
                />
              </v-col>

              <!-- Password (new user only) -->
              <v-col cols="12" v-if="!isEditing">
                <v-text-field
                  v-model="form.password"
                  label="Password *"
                  prepend-inner-icon="mdi-lock-outline"
                  :append-inner-icon="showPwd ? 'mdi-eye-off' : 'mdi-eye'"
                  :type="showPwd ? 'text' : 'password'"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Password is required', v => v.length >= 6 || 'Min 6 characters']"
                  @click:append-inner="showPwd = !showPwd"
                />
              </v-col>

              <!-- Role -->
              <v-col cols="12" sm="6">
                <v-select
                  v-model="form.role"
                  :items="roleOptions"
                  item-title="label"
                  item-value="value"
                  label="Role *"
                  prepend-inner-icon="mdi-shield-outline"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Role is required']"
                />
              </v-col>

              <!-- Link to employee -->
              <v-col cols="12" sm="6">
                <v-autocomplete
                  v-model="form.employee_id"
                  :items="employees"
                  :item-title="e => `${e.first_name} ${e.last_name}`"
                  item-value="id"
                  label="Linked Employee"
                  prepend-inner-icon="mdi-badge-account-outline"
                  variant="outlined"
                  density="comfortable"
                  clearable
                  :loading="loadingEmployees"
                  hint="Optional"
                  persistent-hint
                />
              </v-col>

              <!-- Active toggle (edit only) -->
              <v-col cols="12" v-if="isEditing">
                <v-switch
                  v-model="form.is_active"
                  label="Account Active"
                  color="success"
                  hide-details
                  inset
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
            {{ isEditing ? 'Save Changes' : 'Create User' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ══════════════ RESET PASSWORD DIALOG ══════════════ -->
    <v-dialog v-model="resetDialog" max-width="420" persistent>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-lock-reset" class="me-2" color="orange" />
          Reset Password
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <p class="text-body-2 mb-4">
            Set a new password for <strong>{{ selectedUser?.username }}</strong>.
          </p>
          <v-form ref="resetFormRef">
            <v-text-field
              v-model="newPassword"
              label="New Password *"
              prepend-inner-icon="mdi-lock-outline"
              :append-inner-icon="showNewPwd ? 'mdi-eye-off' : 'mdi-eye'"
              :type="showNewPwd ? 'text' : 'password'"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'Required', v => v.length >= 6 || 'Min 6 characters']"
              @click:append-inner="showNewPwd = !showNewPwd"
            />
            <v-text-field
              v-model="confirmPassword"
              label="Confirm Password *"
              prepend-inner-icon="mdi-lock-check-outline"
              :type="showNewPwd ? 'text' : 'password'"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'Required', v => v === newPassword || 'Passwords do not match']"
            />
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="resetDialog = false" :disabled="resetting">Cancel</v-btn>
          <v-btn color="orange" variant="elevated" :loading="resetting" @click="confirmReset">
            Reset Password
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ══════════════ DELETE DIALOG ══════════════ -->
    <v-dialog v-model="deleteDialog" max-width="400" persistent>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-alert-circle-outline" color="error" class="me-2" />
          Confirm Delete
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <p>
            Are you sure you want to delete user
            <strong>{{ selectedUser?.username }}</strong>?
            This action cannot be undone.
          </p>
          <v-alert type="warning" variant="tonal" density="compact" class="mt-3">
            The user will lose all access immediately.
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
import { ref, computed, onMounted } from 'vue'

const api = useApi()

// ── State ──────────────────────────────────────────────
const users   = ref([])
const loading = ref(false)
const filters = ref({ search: '', role: null, is_active: null })

// Form dialog
const formDialog = ref(false)
const isEditing  = ref(false)
const saving     = ref(false)
const formRef    = ref(null)
const editingId  = ref(null)
const showPwd    = ref(false)
const form       = ref(emptyForm())

// Reset password dialog
const resetDialog    = ref(false)
const resetting      = ref(false)
const resetFormRef   = ref(null)
const newPassword    = ref('')
const confirmPassword = ref('')
const showNewPwd     = ref(false)

// Delete dialog
const deleteDialog = ref(false)
const deleting     = ref(false)

// Shared selected user
const selectedUser = ref(null)

// Snackbar
const snackbar = ref({ show: false, message: '', color: 'success' })

// Employees list for autocomplete
const employees        = ref([])
const loadingEmployees = ref(false)

// ── Table headers ──────────────────────────────────────
const headers = [
  { title: 'User',       key: 'username',   minWidth: 180 },
  { title: 'Role',       key: 'role',       sortable: false },
  { title: 'Status',     key: 'is_active',  sortable: false },
  { title: 'Last Login', key: 'last_login' },
  { title: 'Actions',    key: 'actions',    sortable: false, align: 'end' }
]

// ── Form options ───────────────────────────────────────
const roleOptions = [
  { label: 'Admin',   value: 'admin'   },
  { label: 'Manager', value: 'manager' },
  { label: 'Staff',   value: 'staff'   }
]

const roleFilterOptions = ['admin', 'manager', 'staff']

const activeFilterOptions = [
  { title: 'Active',   value: 'true'  },
  { title: 'Inactive', value: 'false' }
]

// ── Stats ──────────────────────────────────────────────
const stats = computed(() => [
  { label: 'Total',    value: users.value.length,                                   icon: 'mdi-account-multiple', color: 'primary' },
  { label: 'Admins',   value: users.value.filter(u => u.role === 'admin').length,   icon: 'mdi-shield-crown',     color: 'error'   },
  { label: 'Managers', value: users.value.filter(u => u.role === 'manager').length, icon: 'mdi-shield-half-full', color: 'warning' },
  { label: 'Staff',    value: users.value.filter(u => u.role === 'staff').length,   icon: 'mdi-account',          color: 'info'    },
  { label: 'Inactive', value: users.value.filter(u => !u.is_active).length,         icon: 'mdi-account-off',      color: 'grey'    }
])

// ── Helpers ────────────────────────────────────────────
function emptyForm () {
  return { username: '', password: '', role: 'staff', employee_id: null, is_active: true }
}

const notify = (message, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

const formatDateTime = (val) =>
  new Date(val).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

const roleColor  = (r) => ({ admin: 'error', manager: 'warning', staff: 'info' }[r] ?? 'grey')
const roleIcon   = (r) => ({ admin: 'mdi-shield-crown', manager: 'mdi-shield-half-full', staff: 'mdi-account' }[r] ?? 'mdi-account')
const avatarColor = (r) => ({ admin: '#E53935', manager: '#FB8C00', staff: '#1E88E5' }[r] ?? '#78909C')

// Debounced search
let searchTimer = null
const debouncedLoad = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(loadUsers, 350)
}

// ── Data Loading ───────────────────────────────────────
const loadUsers = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({ pageSize: 200 })
    if (filters.value.search)    params.set('search', filters.value.search)
    if (filters.value.role)      params.set('role', filters.value.role)
    if (filters.value.is_active) params.set('is_active', filters.value.is_active)

    const res = await api(`/users?${params}`)
    if (res.success) users.value = res.data
  } catch (err) {
    console.error(err)
    notify('Failed to load users', 'error')
  } finally {
    loading.value = false
  }
}

const loadEmployees = async () => {
  loadingEmployees.value = true
  try {
    const res = await api('/employees?pageSize=500')
    if (res.success) employees.value = res.data
  } catch (e) { console.error(e) } finally { loadingEmployees.value = false }
}

// ── Add / Edit ─────────────────────────────────────────
const openAddDialog = () => {
  form.value   = emptyForm()
  isEditing.value  = false
  editingId.value  = null
  showPwd.value    = false
  formDialog.value = true
}

const openEditDialog = (item) => {
  form.value = {
    username:    item.username,
    password:    '',
    role:        item.role,
    employee_id: item.employee_id ?? null,
    is_active:   item.is_active
  }
  isEditing.value  = true
  editingId.value  = item.id
  showPwd.value    = false
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
    let res
    if (isEditing.value) {
      res = await api(`/users/${editingId.value}`, {
        method: 'PUT',
        body: {
          role:        form.value.role,
          is_active:   form.value.is_active,
          employee_id: form.value.employee_id || null
        }
      })
    } else {
      res = await api('/users', {
        method: 'POST',
        body: {
          username:    form.value.username,
          password:    form.value.password,
          role:        form.value.role,
          employee_id: form.value.employee_id || null
        }
      })
    }

    if (res.success) {
      notify(isEditing.value ? 'User updated successfully' : 'User created successfully')
      closeFormDialog()
      loadUsers()
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

// ── Toggle active ──────────────────────────────────────
const toggleActive = async (item) => {
  try {
    const res = await api(`/users/${item.id}`, {
      method: 'PUT',
      body: { is_active: !item.is_active }
    })
    if (res.success) {
      notify(`User ${!item.is_active ? 'activated' : 'deactivated'}`)
      loadUsers()
    } else {
      notify(res.message || 'Update failed', 'error')
    }
  } catch (err) {
    console.error(err)
    notify('An error occurred', 'error')
  }
}

// ── Reset password ─────────────────────────────────────
const openResetDialog = (item) => {
  selectedUser.value  = item
  newPassword.value   = ''
  confirmPassword.value = ''
  showNewPwd.value    = false
  resetDialog.value   = true
}

const confirmReset = async () => {
  const { valid } = await resetFormRef.value.validate()
  if (!valid) return

  resetting.value = true
  try {
    const res = await api(`/users/${selectedUser.value.id}/reset-password`, {
      method: 'PUT',
      body: { new_password: newPassword.value }
    })
    if (res.success) {
      notify('Password reset successfully', 'success')
      resetDialog.value = false
    } else {
      notify(res.message || 'Reset failed', 'error')
    }
  } catch (err) {
    console.error(err)
    notify('An error occurred', 'error')
  } finally {
    resetting.value = false
  }
}

// ── Delete ─────────────────────────────────────────────
const openDeleteDialog = (item) => {
  selectedUser.value = item
  deleteDialog.value = true
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    const res = await api(`/users/${selectedUser.value.id}`, { method: 'DELETE' })
    if (res.success) {
      notify('User deleted successfully')
      deleteDialog.value = false
      loadUsers()
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

// ── Init ───────────────────────────────────────────────
onMounted(() => {
  loadUsers()
  loadEmployees()
})
</script>
