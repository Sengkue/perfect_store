<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" :rail="rail" permanent @click="rail = false" color="white" elevation="2">
      <v-list-item
        :prepend-avatar="avatarUrl"
        :title="userDisplayName"
        :subtitle="userRole"
        nav
      >
        <template v-slot:append>
          <v-btn variant="text" icon="mdi-chevron-left" @click.stop="rail = !rail"></v-btn>
        </template>
      </v-list-item>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <template v-for="(group, index) in menuGroups" :key="index">
          <v-divider v-if="index > 0" class="my-1"></v-divider>
          <v-list-subheader v-if="group.title && !rail && hasAccess(group.roles)">
            {{ group.title }}
          </v-list-subheader>

          <template v-for="item in group.items" :key="item.to">
            <v-list-item
              v-if="hasAccess(item.roles)"
              :prepend-icon="item.icon"
              :title="item.title"
              :to="item.to"
              :exact="item.exact"
            ></v-list-item>
          </template>
        </template>
      </v-list>

      <template v-slot:append>
        <div class="pa-2">
          <v-btn block color="error" variant="text" prepend-icon="mdi-logout" @click="logout" v-if="!rail">
            Logout
          </v-btn>
          <v-btn icon color="error" variant="text" @click="logout" v-else>
            <v-icon>mdi-logout</v-icon>
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar color="primary" elevation="1">
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" class="d-md-none"></v-app-bar-nav-icon>
      <v-app-bar-title>Perfect Store Admin</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip class="me-3" color="white" variant="tonal" size="small" prepend-icon="mdi-shield-account">
        {{ userRole }}
      </v-chip>
      <v-btn icon>
        <v-icon>mdi-bell</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main class="bg-background">
      <v-container fluid class="pa-4 fill-height align-start">
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const drawer = ref(true)
const rail = ref(false)
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
      { title: 'Suppliers', icon: 'mdi-truck-supplier', to: '/suppliers', roles: ['admin', 'manager'] },
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

// ── User Info ─────────────────────────────────────────
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
  } catch (e) {
    // silent fail – token may not be valid yet
  }
})

const logout = () => {
  token.value = null
  router.push('/login')
}
</script>

<style scoped>
.fill-height {
  height: calc(100vh - 64px); /* Subtract app bar height */
}
</style>
