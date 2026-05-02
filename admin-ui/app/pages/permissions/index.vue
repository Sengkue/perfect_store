<template>
  <v-card v-if="hasPermission('permissions.manage')" rounded="lg" elevation="2">
    <!-- ── Header ── -->
    <v-card-title class="d-flex align-center py-3 px-4 flex-wrap gap-2">
      <div class="d-flex align-center">
        <v-icon icon="mdi-shield-lock" color="primary" class="me-2" />
        <div>
          <div class="text-h6 font-weight-bold">Permission Management</div>
          <div class="text-caption text-medium-emphasis">Control what each role and user can access</div>
        </div>
      </div>
    </v-card-title>
    <v-divider />

    <!-- ── Tabs: Role Permissions / User Permissions ── -->
    <v-tabs v-model="tab" color="primary" class="px-2">
      <v-tab value="roles" prepend-icon="mdi-shield-account">
        Role Permissions
      </v-tab>
      <v-tab value="users" prepend-icon="mdi-account-key">
        User Overrides
      </v-tab>
    </v-tabs>
    <v-divider />

    <!-- ══════════════════════════════════════════════ -->
    <!-- TAB 1: ROLE PERMISSIONS                        -->
    <!-- ══════════════════════════════════════════════ -->
    <v-window v-model="tab">
      <v-window-item value="roles">
        <div class="pa-4">
          <!-- Role selector -->
          <div class="d-flex align-center gap-3 mb-4 flex-wrap">
            <div class="text-subtitle-2 font-weight-bold">Select Role:</div>
            <v-btn-toggle v-model="selectedRole" color="primary" variant="outlined" density="compact" mandatory>
              <v-btn
                v-for="r in roles"
                :key="r.value"
                :value="r.value"
                :prepend-icon="r.icon"
                :color="r.color"
                @click="loadRolePermissions(r.value)"
              >
                {{ r.label }}
              </v-btn>
            </v-btn-toggle>
            <v-spacer />
            <v-btn
              v-if="selectedRole !== 'root'"
              color="primary"
              variant="elevated"
              prepend-icon="mdi-content-save"
              :loading="savingRole"
              @click="saveRolePermissions"
            >
              Save Changes
            </v-btn>
          </div>

          <!-- Root info -->
          <v-alert
            v-if="selectedRole === 'root'"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-4"
            icon="mdi-shield-crown"
          >
            <div class="font-weight-bold">Root (SuperAdmin)</div>
            <div>Root ມີສິດເຂົ້າໃຊ້ງານທຸກຢ່າງໂດຍອັດຕະໂນມັດ. ບໍ່ຈຳເປັນຕ້ອງກຳນົດສິດ — ຂ້າມການກວດສິດທັງໝົດ.</div>
          </v-alert>

          <v-alert
            v-if="selectedRole === 'admin'"
            type="warning"
            variant="tonal"
            density="compact"
            class="mb-4"
            text="Admin ໄດ້ສິດທັງໝົດ by default, ແຕ່ສາມາດຄວບຄຸມໄດ້ — ເຈົ້າສາມາດລຶບສິດບາງອັນອອກໄດ້."
          />

          <!-- Loading state -->
          <div v-if="loadingRole" class="text-center pa-8">
            <v-progress-circular indeterminate color="primary" />
            <div class="text-caption mt-2">Loading permissions…</div>
          </div>

          <!-- Root: show all as granted (read-only) -->
          <div v-else-if="selectedRole === 'root'">
            <div
              v-for="(perms, moduleName) in groupedPermissions"
              :key="moduleName"
              class="mb-4"
            >
              <div class="d-flex align-center gap-2 mb-2">
                <v-icon :icon="moduleIcon(moduleName)" color="primary" size="18" />
                <span class="text-subtitle-2 font-weight-bold text-uppercase tracking-wide">{{ moduleName }}</span>
                <v-divider class="flex-1" />
                <v-chip size="x-small" color="purple" variant="tonal">ALL ACCESS</v-chip>
              </div>

              <v-row dense>
                <v-col
                  v-for="perm in perms"
                  :key="perm.id"
                  cols="12"
                  sm="6"
                  md="4"
                >
                  <v-card
                    variant="outlined"
                    rounded="lg"
                    color="success"
                    class="pa-3 border-success"
                  >
                    <div class="d-flex align-center gap-3">
                      <v-checkbox-btn
                        :model-value="true"
                        color="success"
                        hide-details
                        disabled
                      />
                      <div class="flex-1 min-width-0">
                        <div class="text-body-2 font-weight-medium">{{ perm.display_name }}</div>
                        <div class="text-caption text-medium-emphasis">{{ perm.description }}</div>
                        <v-chip size="x-small" variant="tonal" color="grey" class="mt-1">
                          {{ perm.name }}
                        </v-chip>
                      </div>
                      <v-icon icon="mdi-check-circle" color="success" size="20" />
                    </div>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </div>

          <!-- Permission matrix grouped by module (admin/manager/staff) -->
          <div v-else>
            <div
              v-for="(perms, moduleName) in groupedPermissions"
              :key="moduleName"
              class="mb-4"
            >
              <div class="d-flex align-center gap-2 mb-2">
                <v-icon :icon="moduleIcon(moduleName)" color="primary" size="18" />
                <span class="text-subtitle-2 font-weight-bold text-uppercase tracking-wide">{{ moduleName }}</span>
                <v-divider class="flex-1" />
                <!-- Toggle all in module -->
                <v-btn
                  size="x-small"
                  variant="text"
                  @click="toggleModule(moduleName, true)"
                  color="success"
                >Allow All</v-btn>
                <v-btn
                  size="x-small"
                  variant="text"
                  @click="toggleModule(moduleName, false)"
                  color="error"
                >Deny All</v-btn>
              </div>

              <v-row dense>
                <v-col
                  v-for="perm in perms"
                  :key="perm.id"
                  cols="12"
                  sm="6"
                  md="4"
                >
                  <v-card
                    variant="outlined"
                    rounded="lg"
                    :color="rolePermMap[perm.id] ? 'success' : undefined"
                    :class="rolePermMap[perm.id] ? 'border-success' : ''"
                    class="pa-3 cursor-pointer"
                    @click="toggleRolePerm(perm.id)"
                  >
                    <div class="d-flex align-center gap-3">
                      <v-checkbox-btn
                        :model-value="rolePermMap[perm.id] ?? false"
                        color="success"
                        hide-details
                        @click.stop="toggleRolePerm(perm.id)"
                      />
                      <div class="flex-1 min-width-0">
                        <div class="text-body-2 font-weight-medium">{{ perm.display_name }}</div>
                        <div class="text-caption text-medium-emphasis">{{ perm.description }}</div>
                        <v-chip size="x-small" variant="tonal" color="grey" class="mt-1">
                          {{ perm.name }}
                        </v-chip>
                      </div>
                      <v-icon
                        :icon="rolePermMap[perm.id] ? 'mdi-check-circle' : 'mdi-close-circle'"
                        :color="rolePermMap[perm.id] ? 'success' : 'error'"
                        size="20"
                      />
                    </div>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </div>
        </div>
      </v-window-item>

      <!-- ══════════════════════════════════════════════ -->
      <!-- TAB 2: USER PERMISSION OVERRIDES               -->
      <!-- ══════════════════════════════════════════════ -->
      <v-window-item value="users">
        <div class="pa-4">
          <v-alert
            type="warning"
            variant="tonal"
            density="compact"
            class="mb-4"
            text="User overrides take priority over role permissions. Use this to grant or restrict specific permissions for individual users."
          />

          <!-- User selector -->
          <div class="d-flex align-center gap-3 mb-4 flex-wrap">
            <v-autocomplete
              v-model="selectedUserId"
              :items="users"
              :item-title="u => `${u.username}${u.profile ? ' — ' + u.profile.first_name + ' ' + u.profile.last_name : ''}`"
              item-value="id"
              label="Select User"
              variant="outlined"
              density="compact"
              style="max-width:320px"
              clearable
              prepend-inner-icon="mdi-account-search"
              :loading="loadingUsers"
              @update:model-value="loadUserPermissions"
            >
              <template #item="{ item, props: itemProps }">
                <v-list-item v-bind="itemProps">
                  <template #prepend>
                    <v-avatar :color="roleColor(item.raw.role)" variant="tonal" size="32">
                      <span class="text-caption font-weight-bold">{{ item.raw.username.slice(0,2).toUpperCase() }}</span>
                    </v-avatar>
                  </template>
                  <template #append>
                    <v-chip :color="roleColor(item.raw.role)" size="x-small" variant="tonal">{{ item.raw.role }}</v-chip>
                  </template>
                </v-list-item>
              </template>
            </v-autocomplete>

            <v-spacer />

            <v-btn
              v-if="selectedUserId"
              color="primary"
              variant="elevated"
              prepend-icon="mdi-content-save"
              :loading="savingUser"
              @click="saveUserPermissions"
            >
              Save Overrides
            </v-btn>
          </div>

          <!-- Root user info -->
          <v-alert
            v-if="selectedUserId && selectedUserRole === 'root'"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-4"
            icon="mdi-shield-crown"
          >
            <div class="font-weight-bold">Root users bypass all permissions</div>
            <div>Overrides saved here will have no effect on root users.</div>
          </v-alert>

          <!-- Empty state when no user selected -->
          <div v-if="!selectedUserId" class="text-center py-12">
            <v-icon size="80" color="grey-lighten-2">mdi-account-key</v-icon>
            <div class="text-h6 text-grey mt-3">Select a user above</div>
            <div class="text-body-2 text-medium-emphasis">to manage their individual permission overrides</div>
          </div>

          <!-- Loading -->
          <div v-else-if="loadingUserPerms" class="text-center pa-8">
            <v-progress-circular indeterminate color="primary" />
            <div class="text-caption mt-2">Loading user permissions…</div>
          </div>

          <!-- Permission matrix -->
          <div v-else>
            <div
              v-for="(perms, moduleName) in groupedPermissions"
              :key="moduleName"
              class="mb-4"
            >
              <div class="d-flex align-center gap-2 mb-2">
                <v-icon :icon="moduleIcon(moduleName)" color="primary" size="18" />
                <span class="text-subtitle-2 font-weight-bold text-uppercase">{{ moduleName }}</span>
                <v-divider class="flex-1" />
                <v-btn size="x-small" variant="text" @click="toggleUserModule(moduleName, true)" color="success">Allow All</v-btn>
                <v-btn size="x-small" variant="text" @click="toggleUserModule(moduleName, false)" color="error">Deny All</v-btn>
                <v-btn size="x-small" variant="text" @click="clearUserModule(moduleName)" color="grey">Clear</v-btn>
              </div>

              <v-row dense>
                <v-col
                  v-for="perm in perms"
                  :key="perm.id"
                  cols="12"
                  sm="6"
                  md="4"
                >
                  <v-card
                    variant="outlined"
                    rounded="lg"
                    :color="userPermMap[perm.id] === true ? 'success' : userPermMap[perm.id] === false ? 'error' : undefined"
                    class="pa-3"
                  >
                    <div class="text-body-2 font-weight-medium mb-1">{{ perm.display_name }}</div>
                    <div class="text-caption text-medium-emphasis mb-2">{{ perm.description }}</div>

                    <!-- Three-state: Allow / Deny / Inherit -->
                    <v-btn-toggle
                      :model-value="userPermMap[perm.id] === true ? 'allow' : userPermMap[perm.id] === false ? 'deny' : 'inherit'"
                      @update:model-value="v => setUserPerm(perm.id, v)"
                      density="compact"
                      variant="outlined"
                      mandatory
                    >
                      <v-btn value="allow" size="x-small" color="success">
                        <v-icon size="14">mdi-check</v-icon> Allow
                      </v-btn>
                      <v-btn value="deny" size="x-small" color="error">
                        <v-icon size="14">mdi-close</v-icon> Deny
                      </v-btn>
                      <v-btn value="inherit" size="x-small" color="grey">
                        <v-icon size="14">mdi-minus</v-icon> Inherit
                      </v-btn>
                    </v-btn-toggle>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </div>
        </div>
      </v-window-item>
    </v-window>

    <!-- Centralized toast is used instead of local snackbar -->
  </v-card>

  <v-container v-else class="fill-height d-flex align-center justify-center">
    <v-card rounded="xl" class="pa-12 text-center" max-width="500">
      <v-avatar color="error-lighten-5" size="120" class="mb-6">
        <v-icon size="64" color="error">mdi-shield-off-outline</v-icon>
      </v-avatar>
      <div class="text-h4 font-weight-black text-grey-darken-3 mb-2">Access Denied</div>
      <div class="text-body-1 text-medium-emphasis mb-8">
        You don't have permission to manage system security settings. 
        Please contact your system administrator if you believe this is an error.
      </div>
      <v-btn color="primary" variant="elevated" rounded="pill" size="large" to="/" prepend-icon="mdi-arrow-left">
        Back to Dashboard
      </v-btn>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { showToast } from '~/composables/useToast'

const api = useApi()
const { hasPermission } = usePermissions()

// ── Tabs ────────────────────────────────────────────────
const tab = ref('roles')

// ── All Permissions ─────────────────────────────────────
const allPermissions = ref([])

const groupedPermissions = computed(() => {
  const groups = {}
  for (const p of allPermissions.value) {
    const mod = p.module || 'Other'
    if (!groups[mod]) groups[mod] = []
    groups[mod].push(p)
  }
  return groups
})

// ── Role Permissions ────────────────────────────────────
const roles = [
  { value: 'root',    label: 'Root',    icon: 'mdi-shield-crown',     color: 'purple' },
  { value: 'admin',   label: 'Admin',   icon: 'mdi-shield-star',      color: 'error' },
  { value: 'manager', label: 'Manager', icon: 'mdi-shield-half-full', color: 'warning' },
  { value: 'staff',   label: 'Staff',   icon: 'mdi-account',          color: 'info' }
]

const selectedRole  = ref('admin')
const loadingRole   = ref(false)
const savingRole    = ref(false)
const rolePermMap   = ref({})

const loadRolePermissions = async (role) => {
  if (role === 'root') {
    // Root doesn't need DB permissions — show all as granted
    rolePermMap.value = {}
    return
  }
  loadingRole.value = true
  rolePermMap.value = {}
  try {
    const res = await api(`/permissions/role/${role}`)
    if (res.success) {
      for (const rp of res.data) {
        rolePermMap.value[rp.permission_id] = rp.is_allowed
      }
    }
  } catch (e) { console.error(e) } finally { loadingRole.value = false }
}

const toggleRolePerm = (permId) => {
  rolePermMap.value[permId] = !rolePermMap.value[permId]
}

const toggleModule = (moduleName, value) => {
  for (const p of groupedPermissions.value[moduleName] || []) {
    rolePermMap.value[p.id] = value
  }
}

const saveRolePermissions = async () => {
  savingRole.value = true
  try {
    const permissions = Object.entries(rolePermMap.value).map(([id, is_allowed]) => ({
      permission_id: Number(id),
      is_allowed
    }))
    const res = await api(`/permissions/role/${selectedRole.value}`, {
      method: 'PUT',
      body: { permissions }
    })
    if (res.success) notify('Role permissions saved successfully')
    else notify(res.message || 'Failed to save', 'error')
  } catch (e) {
    console.error(e)
    notify('An error occurred', 'error')
  } finally {
    savingRole.value = false
  }
}

// ── User Permissions ────────────────────────────────────
const users            = ref([])
const loadingUsers     = ref(false)
const selectedUserId   = ref(null)
const loadingUserPerms = ref(false)
const savingUser       = ref(false)
const userPermMap      = ref({})

const selectedUserRole = computed(() => {
  if (!selectedUserId.value) return null
  const user = users.value.find(u => u.id === selectedUserId.value)
  return user?.role || null
})

const loadUsers = async () => {
  loadingUsers.value = true
  try {
    const res = await api('/users?pageSize=500')
    if (res.success) users.value = res.data
  } catch (e) { console.error(e) } finally { loadingUsers.value = false }
}

const loadUserPermissions = async (userId) => {
  if (!userId) { userPermMap.value = {}; return }
  loadingUserPerms.value = true
  userPermMap.value = {}
  try {
    const res = await api(`/permissions/user/${userId}`)
    if (res.success) {
      for (const up of res.data) {
        userPermMap.value[up.permission_id] = up.is_allowed
      }
    }
  } catch (e) { console.error(e) } finally { loadingUserPerms.value = false }
}

const setUserPerm = (permId, value) => {
  if (value === 'inherit') {
    const map = { ...userPermMap.value }
    delete map[permId]
    userPermMap.value = map
  } else {
    userPermMap.value[permId] = value === 'allow'
  }
}

const toggleUserModule = (moduleName, value) => {
  for (const p of groupedPermissions.value[moduleName] || []) {
    userPermMap.value[p.id] = value
  }
}

const clearUserModule = (moduleName) => {
  const map = { ...userPermMap.value }
  for (const p of groupedPermissions.value[moduleName] || []) {
    delete map[p.id]
  }
  userPermMap.value = map
}

const saveUserPermissions = async () => {
  savingUser.value = true
  try {
    const permissions = Object.entries(userPermMap.value).map(([id, is_allowed]) => ({
      permission_id: Number(id),
      is_allowed
    }))
    const res = await api(`/permissions/user/${selectedUserId.value}`, {
      method: 'PUT',
      body: { permissions }
    })
    if (res.success) notify('User permission overrides saved')
    else notify(res.message || 'Failed to save', 'error')
  } catch (e) {
    console.error(e)
    notify('An error occurred', 'error')
  } finally {
    savingUser.value = false
  }
}

// ── Helpers ─────────────────────────────────────────────
const notify = (message, color = 'success') => {
  showToast(message, color)
}

const roleColor = (r) => ({ root: 'purple', admin: 'error', manager: 'warning', staff: 'info' }[r] ?? 'grey')

const moduleIcon = (mod) => ({
  'Dashboard':      'mdi-view-dashboard',
  'POS':            'mdi-cash-register',
  'Products':       'mdi-package-variant-closed',
  'Categories':     'mdi-format-list-bulleted',
  'Suppliers':      'mdi-truck-supplier',
  'Purchase Orders':'mdi-truck-delivery-outline',
  'Imports':        'mdi-package-down',
  'Sales':          'mdi-cart-outline',
  'Refunds':        'mdi-keyboard-return',
  'Customers':      'mdi-account-group',
  'Reports':        'mdi-chart-bar',
  'Admin':          'mdi-shield-crown',
  'Settings':       'mdi-cog',
}[mod] ?? 'mdi-key')

// ── Init ─────────────────────────────────────────────────
onMounted(async () => {
  try {
    const res = await api('/permissions')
    if (res.success) allPermissions.value = res.data
  } catch (e) { console.error(e) }

  await loadRolePermissions('admin')
  await loadUsers()
})
</script>

<style scoped>
.cursor-pointer { cursor: pointer; }
.border-success { border-color: rgb(var(--v-theme-success)) !important; }
.tracking-wide { letter-spacing: 0.05em; }
</style>
