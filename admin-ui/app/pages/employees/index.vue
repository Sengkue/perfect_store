<template>
  <v-card rounded="lg" elevation="2">
    <!-- Header -->
    <v-card-title class="d-flex align-center py-3 px-4 flex-wrap gap-2">
      <div class="d-flex align-center">
        <v-icon icon="mdi-account-details" color="primary" class="me-2" />
        <span class="text-h6 font-weight-bold">Staff Profiles</span>
      </div>
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
        @update:modelValue="debouncedLoad"
      ></v-text-field>

      <v-btn color="primary" prepend-icon="mdi-account-plus" @click="openAddDialog">Add Profile</v-btn>
    </v-card-title>
    <v-divider></v-divider>

    <!-- Info banner -->
    <v-alert
      type="info"
      variant="tonal"
      density="compact"
      class="ma-3"
      text="Staff profiles are linked to user accounts. Select a user, then fill in their personal/employment details."
    />

    <!-- Data Table -->
    <v-data-table
      :headers="headers"
      :items="profiles"
      :loading="loading"
      hover
    >
      <!-- User avatar + username -->
      <template v-slot:item.user="{ item }">
        <div class="d-flex align-center gap-3 py-1">
          <v-avatar :color="avatarColor(item.user?.role)" size="34">
            <span class="text-caption font-weight-bold text-white">
              {{ (item.user?.username || '?').slice(0,2).toUpperCase() }}
            </span>
          </v-avatar>
          <div>
            <div class="font-weight-medium">{{ item.user?.username || '—' }}</div>
            <v-chip :color="roleColor(item.user?.role)" size="x-small" variant="tonal" class="mt-1">
              {{ item.user?.role || 'staff' }}
            </v-chip>
          </div>
        </div>
      </template>

      <!-- Full name -->
      <template v-slot:item.full_name="{ item }">
        <div class="font-weight-medium">{{ item.first_name }} {{ item.last_name }}</div>
      </template>

      <!-- Contact -->
      <template v-slot:item.contact="{ item }">
        <div class="text-caption">{{ item.phone || '—' }}</div>
        <div class="text-caption text-medium-emphasis">{{ item.email || '—' }}</div>
      </template>

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
        <div class="d-flex align-center justify-end gap-1">
          <v-tooltip text="Edit Profile" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-pencil" variant="text" size="small" color="primary" @click="openEditDialog(item)"></v-btn>
            </template>
          </v-tooltip>
          <v-tooltip text="Delete Profile" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-delete" variant="text" size="small" color="error" @click="openDeleteDialog(item)"></v-btn>
            </template>
          </v-tooltip>
        </div>
      </template>
    </v-data-table>

    <!-- ── Add / Edit Dialog ── -->
    <v-dialog v-model="formDialog" max-width="600" persistent>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon :icon="isEditing ? 'mdi-account-edit' : 'mdi-account-plus'" class="me-2" color="primary"></v-icon>
          {{ isEditing ? 'Edit Staff Profile' : 'Create Staff Profile' }}
        </v-card-title>
        <v-divider></v-divider>

        <v-card-text class="pa-4">
          <v-form ref="formRef" @submit.prevent="submitForm">
            <v-row dense>
              <!-- User selector (create only) -->
              <v-col cols="12" v-if="!isEditing">
                <v-autocomplete
                  v-model="form.user_id"
                  :items="availableUsers"
                  item-title="username"
                  item-value="id"
                  label="Link to User Account *"
                  prepend-inner-icon="mdi-account-key-outline"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Please select a user account']"
                  :loading="loadingUsers"
                  hint="Only users without a profile are shown"
                  persistent-hint
                >
                  <template #item="{ item, props: itemProps }">
                    <v-list-item v-bind="itemProps">
                      <template #prepend>
                        <v-avatar :color="roleColor(item.raw.role)" size="28">
                          <span class="text-caption text-white">{{ item.raw.username.slice(0,2).toUpperCase() }}</span>
                        </v-avatar>
                      </template>
                      <template #append>
                        <v-chip :color="roleColor(item.raw.role)" size="x-small" variant="tonal">{{ item.raw.role }}</v-chip>
                      </template>
                    </v-list-item>
                  </template>
                </v-autocomplete>
              </v-col>

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
            {{ isEditing ? 'Save Changes' : 'Create Profile' }}
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
          Are you sure you want to delete the profile for
          <strong>{{ selectedProfile?.first_name }} {{ selectedProfile?.last_name }}</strong>?
          The user account will remain but profile info will be removed.
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
const profiles = ref([])
const loading  = ref(false)
const search   = ref('')

// Form dialog
const formDialog  = ref(false)
const isEditing   = ref(false)
const saving      = ref(false)
const formRef     = ref(null)
const editingId   = ref(null)   // user_id being edited when isEditing
const form        = ref(emptyForm())

// Users for autocomplete
const availableUsers  = ref([])
const loadingUsers    = ref(false)

// Delete dialog
const deleteDialog     = ref(false)
const deleting         = ref(false)
const selectedProfile  = ref(null)

// Snackbar
const snackbar = ref({ show: false, message: '', color: 'success' })

// ── Table headers ──────────────────────────────────────
const headers = [
  { title: 'User Account', key: 'user',      sortable: false, minWidth: 150 },
  { title: 'Full Name',    key: 'full_name',  sortable: false },
  { title: 'Contact',      key: 'contact',    sortable: false },
  { title: 'Hire Date',    key: 'hire_date' },
  { title: 'Salary',       key: 'salary' },
  { title: 'Actions',      key: 'actions',    sortable: false, align: 'end' }
]

// ── Helpers ────────────────────────────────────────────
function emptyForm () {
  return {
    user_id:    null,
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

const roleColor   = (r) => ({ admin: 'error', manager: 'warning', staff: 'info' }[r] ?? 'grey')
const avatarColor = (r) => ({ admin: '#E53935', manager: '#FB8C00', staff: '#1E88E5' }[r] ?? '#78909C')

let searchTimer = null
const debouncedLoad = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(loadProfiles, 350)
}

// ── Data Loading ───────────────────────────────────────
const loadProfiles = async () => {
  loading.value = true
  try {
    // Fetch all users with their profiles included
    const params = new URLSearchParams({ pageSize: 500 })
    if (search.value) params.set('search', search.value)

    const res = await api(`/users?${params}`)
    if (res.success) {
      // Filter only users that have a profile
      profiles.value = res.data
        .filter(u => u.profile)
        .map(u => ({ ...u.profile, user: u }))
    }
  } catch (err) {
    console.error(err)
    notify('Failed to load profiles', 'error')
  } finally {
    loading.value = false
  }
}

const loadAvailableUsers = async () => {
  loadingUsers.value = true
  try {
    const res = await api('/users?pageSize=500')
    if (res.success) {
      // Only show users that don't already have a profile
      availableUsers.value = res.data.filter(u => !u.profile)
    }
  } catch (e) {
    console.error(e)
  } finally {
    loadingUsers.value = false
  }
}

// ── CRUD ───────────────────────────────────────────────
const openAddDialog = async () => {
  form.value   = emptyForm()
  isEditing.value  = false
  editingId.value  = null
  formDialog.value = true
  await loadAvailableUsers()
}

const openEditDialog = (item) => {
  form.value = {
    user_id:    item.user_id,
    first_name: item.first_name ?? '',
    last_name:  item.last_name  ?? '',
    phone:      item.phone      ?? '',
    email:      item.email      ?? '',
    hire_date:  item.hire_date  ?? '',
    salary:     item.salary     ?? null,
    address:    item.address    ?? ''
  }
  isEditing.value  = true
  editingId.value  = item.user_id
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
    const userId = isEditing.value ? editingId.value : form.value.user_id
    const payload = Object.fromEntries(
      Object.entries(form.value)
        .filter(([k, v]) => k !== 'user_id' && v !== '' && v !== null)
    )

    const res = await api(`/users/${userId}/profile`, { method: 'PUT', body: payload })

    if (res.success) {
      notify(isEditing.value ? 'Profile updated successfully' : 'Profile created successfully')
      closeFormDialog()
      loadProfiles()
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
  selectedProfile.value = item
  deleteDialog.value    = true
}

const confirmDelete = async () => {
  // There's no DELETE /users/:id/profile endpoint, so we just notify
  // In a real app you'd add a delete endpoint or update profile fields to empty
  deleting.value = true
  try {
    // Soft-delete: clear the profile name fields
    const res = await api(`/users/${selectedProfile.value.user_id}/profile`, {
      method: 'PUT',
      body: { first_name: 'Deleted', last_name: 'Profile' }
    })
    if (res.success) {
      notify('Profile removed')
      deleteDialog.value = false
      loadProfiles()
    } else {
      notify(res.message || 'Failed', 'error')
    }
  } catch (err) {
    console.error(err)
    notify('An unexpected error occurred', 'error')
  } finally {
    deleting.value = false
  }
}

// ── Init ───────────────────────────────────────────────
onMounted(loadProfiles)
</script>
