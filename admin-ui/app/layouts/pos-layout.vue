<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" color="white" elevation="3" width="280">
      <!-- Shop Branding Section -->
      <div class="pa-4 pt-6 d-flex align-center">
        <div class="branding-icon-container bg-primary-lighten-4 rounded-xl pa-2 me-3">
          <v-icon color="primary" icon="mdi-store" size="28"></v-icon>
        </div>
        <div>
          <div class="text-overline text-primary font-weight-black mb-n1" style="letter-spacing: 2px !important;">ADMIN PORTAL</div>
          <div class="text-h6 font-weight-black text-grey-darken-4" style="line-height: 1;">PERFECT STORE</div>
        </div>
        <v-spacer></v-spacer>
      </div>

      <v-divider class="mx-4 my-2 opacity-10"></v-divider>

      <v-list density="compact" nav class="px-2">
        <template v-for="(group, index) in menuGroups" :key="index">
          <v-list-subheader v-if="group.title && hasAccess(group.roles)" class="text-uppercase font-weight-bold text-caption text-grey-lighten-1 ps-4 mt-4" style="letter-spacing: 1px !important;">
            {{ group.title }}
          </v-list-subheader>

          <template v-for="item in group.items" :key="item.to">
            <v-list-item
              v-if="hasAccess(item.roles)"
              :prepend-icon="item.icon"
              :title="item.title"
              :to="item.to"
              :exact="item.exact"
              active-class="nav-item-active"
              rounded="lg"
              class="nav-item mb-1"
            ></v-list-item>
          </template>
        </template>
      </v-list>

      <template v-slot:append>
        <div class="pa-4">
          <v-btn block color="error" variant="tonal" prepend-icon="mdi-logout" @click="logout" class="rounded-lg font-weight-bold">
            Sign Out
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar color="primary" elevation="1">
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title>
        <v-icon icon="mdi-store" class="me-2" size="24"></v-icon>
        Perfect Store Admin
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip class="me-3" color="white" variant="tonal" size="small" prepend-icon="mdi-shield-account">
        {{ userRole }}
      </v-chip>
      <v-btn icon>
        <v-icon>mdi-bell</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main class="bg-background overflow-hidden">
      <!-- No container padding for POS -->
      <div class="fill-height">
        <slot />
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const drawer = ref(true)
const router = useRouter()
const token = useCookie('auth_token')
const api = useApi()

// ── Menu Configuration & Permissions ─────────────────
const hasAccess = (rolesAllowed) => {
  if (!rolesAllowed || rolesAllowed.length === 0) return true
  return rolesAllowed.includes(userRole.value)
}

const menuGroups = [
  {
    items: [
      { title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/', exact: true, roles: ['admin', 'manager', 'staff'] },
      { title: 'POS Terminal', icon: 'mdi-cash-register', to: '/pos', roles: ['admin', 'manager', 'staff'] },
    ]
  },
  {
    title: 'INVENTORY',
    roles: ['admin', 'manager'],
    items: [
      { title: 'Categories', icon: 'mdi-format-list-bulleted', to: '/categories', roles: ['admin', 'manager'] },
      { title: 'Products', icon: 'mdi-package-variant-closed', to: '/products', roles: ['admin', 'manager'] },
      { title: 'Suppliers', icon: 'mdi-handshake', to: '/suppliers', roles: ['admin', 'manager'] },
      { title: 'Purchase Orders', icon: 'mdi-truck-delivery-outline', to: '/purchase-orders', roles: ['admin', 'manager'] },
      { title: 'Stock Imports', icon: 'mdi-package-down', to: '/imports', roles: ['admin', 'manager'] },
    ]
  },
  {
    title: 'SALES',
    roles: ['admin', 'manager', 'staff'],
    items: [
      { title: 'Sales', icon: 'mdi-cart-outline', to: '/sales', roles: ['admin', 'manager', 'staff'] },
      { title: 'Online Orders', icon: 'mdi-clipboard-list-outline', to: '/orders', roles: ['admin', 'manager', 'staff'] },
      { title: 'Customers', icon: 'mdi-account-group', to: '/customers', roles: ['admin', 'manager', 'staff'] },
    ]
  },
  {
    title: 'ADMIN',
    roles: ['admin'],
    items: [
      { title: 'Staff Profiles', icon: 'mdi-account-details', to: '/employees', roles: ['admin'] },
      { title: 'Users', icon: 'mdi-shield-account', to: '/users', roles: ['admin'] },
      { title: 'Permissions', icon: 'mdi-shield-lock', to: '/permissions', roles: ['admin'] },
      { title: 'Settings', icon: 'mdi-cog', to: '/settings', roles: ['admin'] },
    ]
  }
]

const currentUser = ref(null)

const userDisplayName = computed(() => {
  if (!currentUser.value) return 'Admin User'
  const profile = currentUser.value.profile
  if (profile?.first_name) {
    return `${profile.first_name} ${profile.last_name || ''}`.trim()
  }
  return currentUser.value.username || 'Admin User'
})

const userRole = computed(() => {
  if (!currentUser.value) return 'admin'
  return currentUser.value.role || 'staff'
})

const avatarUrl = computed(() => {
  const name = userDisplayName.value
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1976D2&color=fff`
})

onMounted(async () => {
  try {
    const res = await api('/auth/me')
    if (res.success) currentUser.value = res.data
  } catch (e) {}
})

const logout = () => {
  token.value = null
  router.push('/login')
}
</script>

<style scoped>
.fill-height {
  height: calc(100vh - 64px);
  overflow: hidden;
}

/* Premium Sidebar Styles */
.nav-item {
  transition: all 0.2s ease-in-out;
  color: #64748b !important; /* Slate 500 */
}

.nav-item:hover {
  background-color: #f1f5f9 !important; /* Slate 100 */
  color: #1e293b !important; /* Slate 800 */
}

.nav-item-active {
  background-color: #eff6ff !important; /* Blue 50 */
  color: #1d4ed8 !important; /* Blue 700 */
  font-weight: 600 !important;
  position: relative;
}

.nav-item-active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 20%;
  height: 60%;
  width: 4px;
  background-color: #1d4ed8;
  border-radius: 0 4px 4px 0;
}

.branding-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #eff6ff; /* Match primary light */
}

.user-profile-item {
  background-color: #f8fafc;
  border: 1px solid #f1f5f9;
}

.opacity-10 {
  opacity: 0.1 !important;
}
</style>
