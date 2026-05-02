<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" elevation="3" width="280">
      <!-- Shop Branding Section -->
      <div class="pa-4 pt-6 d-flex align-center">
        <div class="branding-icon-container rounded-xl pa-2 me-3">
          <v-icon color="primary" icon="mdi-store" size="28"></v-icon>
        </div>
        <div>
          <div class="text-overline text-primary font-weight-black mb-n1" style="letter-spacing: 2px !important;">ລະບົບຈັດການ</div>
          <div class="text-h6 font-weight-black" style="line-height: 1;">PERFECT STORE</div>
        </div>
        <v-spacer></v-spacer>
      </div>

      <v-divider class="mx-4 my-2 opacity-10"></v-divider>

      <v-list density="compact" nav class="px-2">
        <template v-for="(group, index) in menuGroups" :key="index">
          <v-list-subheader v-if="group.title && canSeeGroup(group)" class="text-uppercase font-weight-bold text-caption text-grey-lighten-1 ps-4 mt-4" style="letter-spacing: 1px !important;">
            {{ group.title }}
          </v-list-subheader>

          <template v-for="item in group.items" :key="item.to">
            <v-list-item
              v-if="canSeeItem(item)"
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
            ອອກຈາກລະບົບ
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar color="primary" elevation="1">
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title>
        <v-icon icon="mdi-store" class="me-2" size="24"></v-icon>
        ຜູ້ດູແລ Perfect Store
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip class="me-3" :color="roleChipColor" variant="tonal" size="small" prepend-icon="mdi-shield-account">
        {{ roleDisplayLabel }}
      </v-chip>
      <v-btn icon>
        <v-icon>mdi-bell</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main class="bg-background">
      <v-container v-if="!route.meta.fluid" fluid class="pa-4 fill-height align-start">
        <slot />
      </v-container>
      <slot v-else />
    </v-main>

    <GlobalToast />
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const drawer = ref(true)
const router = useRouter()
const route = useRoute()
const token = useCookie('auth_token')
const api = useApi()
const { hasPermission, hasAnyPermission, userRole, loadPermissions, clearPermissions } = usePermissions()

// ── Permission-based Menu Configuration ──────────────────
const canSeeItem = (item) => {
  if (!item.permission) return true
  return hasPermission(item.permission)
}

const canSeeGroup = (group) => {
  if (!group.items) return false
  return group.items.some(item => canSeeItem(item))
}

const menuGroups = [
  {
    items: [
      { title: 'ໜ້າຫຼັກ', icon: 'mdi-view-dashboard', to: '/', exact: true, permission: 'dashboard.view' },
      { title: 'ລາຍການຂາຍ', icon: 'mdi-cash-register', to: '/pos', permission: 'pos.access' },
    ]
  },
  {
    title: 'ສາງສິນຄ້າ',
    items: [
      { title: 'ໝວດໝູ່ສິນຄ້າ', icon: 'mdi-format-list-bulleted', to: '/categories', permission: 'categories.view' },
      { title: 'ລາຍການສິນຄ້າ', icon: 'mdi-package-variant-closed', to: '/products', permission: 'products.view' },
      { title: 'ຜູ້ສະໜອງ', icon: 'mdi-handshake', to: '/suppliers', permission: 'suppliers.view' },
      { title: 'ໃບສັ່ງຊື້', icon: 'mdi-truck-delivery-outline', to: '/purchase-orders', permission: 'purchase_orders.view' },
      { title: 'ນຳເຂົ້າສິນຄ້າ', icon: 'mdi-package-down', to: '/imports', permission: 'imports.view' },
    ]
  },
  {
    title: 'ການຂາຍ',
    items: [
      { title: 'ອໍເດີອອນລາຍ', icon: 'mdi-clipboard-list-outline', to: '/orders', permission: 'sales.view' },
      { title: 'ລູກຄ້າ', icon: 'mdi-account-group', to: '/customers', permission: 'customers.view' },
    ]
  },
  {
    title: 'ວິເຄາະ ແລະ ລາຍງານ',
    items: [
      { title: 'ລາຍງານທຸລະກິດ', icon: 'mdi-finance', to: '/reports', permission: 'sales.report' },
      { title: 'ສະຫຼຸບຍອດປິດກະ', icon: 'mdi-calendar-check', to: '/reports/shift', permission: 'sales.report' },
      { title: 'ລາຍງານການຂາຍ', icon: 'mdi-receipt', to: '/reports/sales', permission: 'sales.view' },
      { title: 'ລາຍງານສິນຄ້າຄົງຄັງ', icon: 'mdi-package-variant', to: '/reports/inventory', permission: 'sales.report' },
      { title: 'ລາຍງານພາສີ', icon: 'mdi-file-percent', to: '/reports/tax', permission: 'sales.report' },
      { title: 'ລາຍງານລູກຄ້າ', icon: 'mdi-account-star', to: '/reports/customers', permission: 'sales.report' },
      { title: 'ລາຍງານພະນັກງານ', icon: 'mdi-account-tie', to: '/reports/staff', permission: 'sales.report' },
      { title: 'ສິນຄ້າຂາຍດີ', icon: 'mdi-fire', to: '/reports/products', permission: 'sales.report' },
      { title: 'ລາຍງານການຄືນເງິນ', icon: 'mdi-backspace-reverse-outline', to: '/reports/refunds', permission: 'sales.report' },
      { title: 'ລາຍງານລາຍຈ່າຍ', icon: 'mdi-cash-minus', to: '/reports/expenses', permission: 'sales.report' },
    ]
  },
  {
    title: 'ຜູ້ດູແລລະບົບ',
    items: [
      { title: 'ຂໍ້ມູນພະນັກງານ', icon: 'mdi-account-details', to: '/employees', permission: 'users.view' },
      { title: 'ບັນຊີຜູ້ໃຊ້', icon: 'mdi-shield-account', to: '/users', permission: 'users.view' },
      { title: 'ສິດທິການໃຊ້', icon: 'mdi-shield-lock', to: '/permissions', permission: 'permissions.manage' },
      { title: 'System Logs', icon: 'mdi-file-document-outline', to: '/logs', permission: 'system.view_logs' },
      { title: 'ຕັ້ງຄ່າ', icon: 'mdi-cog', to: '/settings', permission: 'settings.view' },
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

const roleDisplayLabel = computed(() => {
  const labels = { root: 'Root', admin: 'Admin', manager: 'Manager', staff: 'Staff' }
  return labels[userRole.value] || userRole.value
})

const roleChipColor = computed(() => {
  return { root: 'purple', admin: 'error', manager: 'warning', staff: 'info' }[userRole.value] ?? 'grey'
})

const avatarUrl = computed(() => {
  const name = userDisplayName.value
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1976D2&color=fff`
})

onMounted(async () => {
  try {
    const res = await api('/auth/me')
    if (res.success) {
      currentUser.value = res.data
      // Permissions are loaded by the composable via middleware,
      // but also set them here for sidebar reactivity
      await loadPermissions()
    }
  } catch (e) {
    // silent fail – token may not be valid yet
  }
})

const logout = () => {
  clearPermissions()
  token.value = null
  router.push('/login')
}
</script>

<style scoped>
.fill-height {
  height: calc(100vh - 64px); /* Subtract app bar height */
}

/* Premium Sidebar Styles */
.nav-item {
  transition: all 0.2s ease-in-out;
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
}

.nav-item:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.05) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
}

.nav-item-active {
  background-color: rgba(var(--v-theme-primary), 0.1) !important;
  color: rgb(var(--v-theme-primary)) !important;
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
  background-color: rgb(var(--v-theme-primary));
  border-radius: 0 4px 4px 0;
}

.branding-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.opacity-10 {
  opacity: 0.1 !important;
}
</style>
