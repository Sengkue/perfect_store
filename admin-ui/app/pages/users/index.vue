<template>
  <v-container fluid class="pa-2 container-border" v-if="hasPermission('users.view')">
    <!-- ── Header Section ── -->
    <v-row class="mb-2">
      <v-col cols="12" class="d-flex align-center flex-wrap gap-2">
        <div class="header-icon-container rounded-lg pa-2 me-2">
          <v-icon color="primary" size="24">mdi-shield-account</v-icon>
        </div>
        <div>
          <h1 class="text-h5 font-weight-black mb-1">ຈັດການຜູ້ໃຊ້ງານ</h1>
          <p class="text-caption text-medium-emphasis">ກວດສອບ ແລະ ຕັ້ງຄ່າສິດການເຂົ້າເຖິງຂອງພະນັກງານ</p>
        </div>
        <v-spacer></v-spacer>
        <v-btn 
          v-if="hasPermission('users.create')" 
          color="primary" 
          variant="elevated" 
          size="small"
          class="rounded-lg px-4 font-weight-bold shadow-soft" 
          prepend-icon="mdi-account-plus" 
          @click="openAddDialog"
        >
          ເພີ່ມຜູ້ໃຊ້ໃໝ່
        </v-btn>
      </v-col>
    </v-row>

    <!-- ── Stats Grid ── -->
    <v-row class="mb-2">
      <v-col v-for="s in stats" :key="s.label" cols="12" sm="4" md="2" class="flex-grow-1">
        <v-card border elevation="0" class="rounded-lg pa-2 h-100 shadow-soft">
          <div class="d-flex align-center mb-1">
            <v-avatar :color="s.color + '-lighten-5'" size="28" rounded="lg" class="me-2">
              <v-icon :icon="s.icon" :color="s.color" size="16"></v-icon>
            </v-avatar>
            <span class="text-caption font-weight-bold text-grey-darken-1 text-uppercase" style="font-size: 0.65rem !important; letter-spacing: 0.05em;">{{ s.label }}</span>
          </div>
          <div class="text-h6 font-weight-black" :class="'text-' + s.color" style="line-height: 1.2">{{ s.value }}</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Search & Filters Section ── -->
    <v-card border elevation="0" class="rounded-lg mb-2 shadow-soft pa-2">
      <v-row dense align="center">
        <v-col cols="12" md="4">
          <v-text-field
            v-model="filters.search"
            placeholder="ຄົ້ນຫາຊື່ຜູ້ໃຊ້..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
            clearable
            @update:model-value="debouncedLoad"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="filters.role"
            :items="roleFilterOptions"
            label="ຕຳແໜ່ງ"
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
            clearable
            @update:model-value="loadUsers"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="filters.is_active"
            :items="activeFilterOptions"
            label="ສະຖານະ"
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
            clearable
            @update:model-value="loadUsers"
          />
        </v-col>
      </v-row>
    </v-card>

    <!-- ── Data Table Section ── -->
    <v-card border elevation="0" class="rounded-lg overflow-hidden shadow-soft">
      <v-data-table
        :headers="headers"
        :items="users"
        :loading="loading"
        density="compact"
        hover
        items-per-page="15"
        class="custom-table"
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
            <div class="text-caption text-medium-emphasis" v-if="item.profile">
              {{ item.profile.first_name }} {{ item.profile.last_name }}
            </div>
            <div class="text-caption text-medium-emphasis text-grey" v-else>
              No profile set
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

      <!-- Profile info -->
      <template #item.profile="{ item }">
        <div v-if="item.profile">
          <div class="text-caption">{{ item.profile.email || '—' }}</div>
          <div class="text-caption text-medium-emphasis">{{ item.profile.phone || '—' }}</div>
        </div>
        <span v-else class="text-caption text-grey">—</span>
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
          <v-tooltip v-if="hasPermission('users.edit')" text="Edit User" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-pencil" variant="text" size="small" color="primary" @click="openEditDialog(item)" />
            </template>
          </v-tooltip>

          <!-- Toggle active -->
          <v-tooltip v-if="hasPermission('users.edit')" :text="item.is_active ? 'Deactivate' : 'Activate'" location="top">
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
          <v-tooltip v-if="hasPermission('users.edit')" text="Reset Password" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-lock-reset" variant="text" size="small" color="orange" @click="openResetDialog(item)" />
            </template>
          </v-tooltip>

          <!-- Delete -->
          <v-tooltip v-if="hasPermission('users.delete')" text="Delete User" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-delete" variant="text" size="small" color="error" @click="openDeleteDialog(item)" />
            </template>
          </v-tooltip>
        </div>
      </template>
    </v-data-table>
  </v-card>

  <!-- ══════════════ ADD / EDIT DIALOG ══════════════ -->
  <v-dialog v-model="formDialog" max-width="560" persistent>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon :icon="isEditing ? 'mdi-account-edit' : 'mdi-account-plus'" class="me-2" color="primary" />
          {{ isEditing ? 'Edit User' : 'Create New User' }}
        </v-card-title>
        <v-divider />

        <v-card-text class="pa-4">
          <v-form ref="formRef">
            <!-- ── Account Credentials ── -->
            <div class="text-subtitle-2 text-medium-emphasis mb-3 text-uppercase tracking-wide">
              Account Credentials
            </div>
            <v-row dense>
              <!-- Username -->
              <v-col cols="12" sm="7">
                <v-text-field
                  v-model="form.username"
                  label="Username *"
                  prepend-inner-icon="mdi-account-outline"
                  variant="outlined"
                  density="compact"
                  :rules="[v => !!v || 'Username is required', v => v.length >= 3 || 'Min 3 characters']"
                  :disabled="isEditing"
                  hint="Cannot be changed after creation"
                  :persistent-hint="isEditing"
                />
              </v-col>

              <!-- Role -->
              <v-col cols="12" sm="5">
                <v-select
                  v-model="form.role"
                  :items="roleOptions"
                  item-title="label"
                  item-value="value"
                  label="Role *"
                  prepend-inner-icon="mdi-shield-outline"
                  variant="outlined"
                  density="compact"
                  :rules="[v => !!v || 'Role is required']"
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
                  density="compact"
                  :rules="[v => !!v || 'Password is required', v => v.length >= 6 || 'Min 6 characters']"
                  @click:append-inner="showPwd = !showPwd"
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

            <!-- ── Profile Info (optional) ── -->
            <v-divider class="my-4" />
            <div class="text-subtitle-2 text-medium-emphasis mb-3 text-uppercase">
              Profile Info <span class="text-caption font-weight-regular">(optional)</span>
            </div>
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.first_name"
                  label="First Name"
                  prepend-inner-icon="mdi-badge-account-outline"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.last_name"
                  label="Last Name"
                  prepend-inner-icon="mdi-badge-account-outline"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.phone"
                  label="Phone"
                  prepend-inner-icon="mdi-phone-outline"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.email"
                  label="Email"
                  prepend-inner-icon="mdi-email-outline"
                  variant="outlined"
                  density="compact"
                  type="email"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.hire_date"
                  label="Hire Date"
                  prepend-inner-icon="mdi-calendar-outline"
                  variant="outlined"
                  density="compact"
                  type="date"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="form.salary"
                  label="Salary"
                  prepend-inner-icon="mdi-cash-outline"
                  variant="outlined"
                  density="compact"
                  type="number"
                  suffix="LAK"
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
              density="compact"
              :rules="[v => !!v || 'Required', v => v.length >= 6 || 'Min 6 characters']"
              @click:append-inner="showNewPwd = !showNewPwd"
            />
            <v-text-field
              v-model="confirmPassword"
              label="Confirm Password *"
              prepend-inner-icon="mdi-lock-check-outline"
              :type="showNewPwd ? 'text' : 'password'"
              variant="outlined"
              density="compact"
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

  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { showToast } from '~/composables/useToast'

const api = useApi()
const { hasPermission, isRoot } = usePermissions()

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

// ── Table headers ──────────────────────────────────────
const headers = [
  { title: 'User',       key: 'username',   minWidth: 200 },
  { title: 'Role',       key: 'role',       sortable: false },
  { title: 'Status',     key: 'is_active',  sortable: false },
  { title: 'Profile',    key: 'profile',    sortable: false },
  { title: 'Last Login', key: 'last_login' },
  { title: 'Actions',   key: 'actions',    sortable: false, align: 'end' }
]

// ── Form options ───────────────────────────────────────
const roleOptions = computed(() => {
  const base = [
    { label: 'Admin',   value: 'admin'   },
    { label: 'Manager', value: 'manager' },
    { label: 'Staff',   value: 'staff'   }
  ]
  if (isRoot.value) {
    base.unshift({ label: 'Root (SuperAdmin)', value: 'root' })
  }
  return base
})

const roleFilterOptions = computed(() => {
  const base = ['admin', 'manager', 'staff']
  if (isRoot.value) base.unshift('root')
  return base
})

const activeFilterOptions = [
  { title: 'Active',   value: 'true'  },
  { title: 'Inactive', value: 'false' }
]

// ── Stats ──────────────────────────────────────────────
const stats = computed(() => {
  const base = [
    { label: 'Total',    value: users.value.length,                                   icon: 'mdi-account-multiple', color: 'primary' },
    { label: 'Admins',   value: users.value.filter(u => u.role === 'admin').length,   icon: 'mdi-shield-crown',     color: 'error'   },
    { label: 'Managers', value: users.value.filter(u => u.role === 'manager').length, icon: 'mdi-shield-half-full', color: 'warning' },
    { label: 'Staff',    value: users.value.filter(u => u.role === 'staff').length,   icon: 'mdi-account',          color: 'info'    },
    { label: 'Inactive', value: users.value.filter(u => !u.is_active).length,         icon: 'mdi-account-off',      color: 'grey'    }
  ]
  if (isRoot.value) {
    base.splice(1, 0, { label: 'Roots', value: users.value.filter(u => u.role === 'root').length, icon: 'mdi-crown', color: 'purple' })
  }
  return base
})

// ── Helpers ────────────────────────────────────────────
function emptyForm () {
  return {
    username: '', password: '', role: 'staff', is_active: true,
    first_name: '', last_name: '', phone: '', email: '', hire_date: '', salary: null
  }
}

const notify = (message, color = 'success') => {
  showToast(message, color)
}

const formatDateTime = (val) =>
  new Date(val).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

const roleColor  = (r) => ({ root: 'purple', admin: 'error', manager: 'warning', staff: 'info' }[r] ?? 'grey')
const roleIcon   = (r) => ({ root: 'mdi-crown', admin: 'mdi-shield-crown', manager: 'mdi-shield-half-full', staff: 'mdi-account' }[r] ?? 'mdi-account')
const avatarColor = (r) => ({ root: '#9C27B0', admin: '#E53935', manager: '#FB8C00', staff: '#1E88E5' }[r] ?? '#78909C')

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
    const params = new URLSearchParams({ pageSize: '200' })
    if (filters.value.search)    params.set('search', filters.value.search)
    if (filters.value.role)      params.set('role', filters.value.role)
    if (filters.value.is_active) params.set('is_active', filters.value.is_active)

    const res = await api(`/users?${params}`)
    if (res.success) users.value = res.data
  } catch (err) {
    // Error is handled globally by useApi
  } finally {
    loading.value = false
  }
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
    username:   item.username,
    password:   '',
    role:       item.role,
    is_active:  item.is_active,
    first_name: item.profile?.first_name ?? '',
    last_name:  item.profile?.last_name  ?? '',
    phone:      item.profile?.phone      ?? '',
    email:      item.profile?.email      ?? '',
    hire_date:  item.profile?.hire_date  ?? '',
    salary:     item.profile?.salary     ?? null
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
      // Update account fields
      res = await api(`/users/${editingId.value}`, {
        method: 'PUT',
        body: {
          role:       form.value.role,
          is_active:  form.value.is_active
        }
      })

      // Also save profile (upsert via PUT /users/:id/profile)
      const hasProfileData = form.value.first_name || form.value.last_name || form.value.phone || form.value.email
      if (res.success && hasProfileData) {
        await api(`/users/${editingId.value}/profile`, {
          method: 'PUT',
          body: {
            first_name: form.value.first_name || undefined,
            last_name:  form.value.last_name  || undefined,
            phone:      form.value.phone      || undefined,
            email:      form.value.email      || undefined,
            hire_date:  form.value.hire_date  || undefined,
            salary:     form.value.salary     || undefined
          }
        }).catch(() => {}) // best-effort
      }
    } else {
      // Create account
      res = await api('/users', {
        method: 'POST',
        body: {
          username: form.value.username,
          password: form.value.password,
          role:     form.value.role
        }
      })

      // Create profile if name is provided
      if (res.success && (form.value.first_name || form.value.last_name)) {
        const newUserId = res.data.id
        await api(`/users/${newUserId}/profile`, {
          method: 'PUT',
          body: {
            first_name: form.value.first_name || undefined,
            last_name:  form.value.last_name  || undefined,
            phone:      form.value.phone      || undefined,
            email:      form.value.email      || undefined,
            hire_date:  form.value.hire_date  || undefined,
            salary:     form.value.salary     || undefined
          }
        }).catch(() => {})
      }
    }

    if (res.success) {
      notify(isEditing.value ? 'User updated successfully' : 'User created successfully')
      closeFormDialog()
      loadUsers()
    }
  } catch (err) {
    // Error is handled globally by useApi
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
    }
  } catch (err) {
    // Error is handled globally by useApi
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
    }
  } catch (err) {
    // Error is handled globally by useApi
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
    }
  } catch (err) {
    // Error is handled globally by useApi
  } finally {
    deleting.value = false
  }
}

// ── Init ───────────────────────────────────────────────
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.header-icon-container {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.container-border {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  background-color: rgb(var(--v-theme-surface));
  margin-top: 8px;
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

.flex-grow-1 {
  flex: 1;
}
</style>
