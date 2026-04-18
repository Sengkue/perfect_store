<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" :rail="rail" permanent @click="rail = false" color="white" elevation="2">
      <v-list-item
        prepend-avatar="https://ui-avatars.com/api/?name=Admin+User&background=1976D2&color=fff"
        title="Admin User"
        nav
      >
        <template v-slot:append>
          <v-btn variant="text" icon="mdi-chevron-left" @click.stop="rail = !rail"></v-btn>
        </template>
      </v-list-item>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item prepend-icon="mdi-view-dashboard" title="Dashboard" to="/" exact></v-list-item>
        <v-list-item prepend-icon="mdi-cash-register" title="POS Terminal" to="/pos"></v-list-item>
        <v-list-item prepend-icon="mdi-format-list-bulleted" title="Categories" to="/categories"></v-list-item>
        <v-list-item prepend-icon="mdi-package-variant-closed" title="Products" to="/products"></v-list-item>
        <v-list-item prepend-icon="mdi-package-down" title="Stock Imports" to="/imports"></v-list-item>
        <v-list-item prepend-icon="mdi-truck-delivery-outline" title="ສັ່ງຊື້ຈາກຜູ້ສະໜອງ" to="/purchase-orders"></v-list-item>
        <v-list-item prepend-icon="mdi-cart-outline" title="Sales" to="/sales"></v-list-item>
        <v-list-item prepend-icon="mdi-clipboard-list-outline" title="ສັ່ງຊື້ສິນຄ້າ" to="/orders"></v-list-item>
        <v-list-item prepend-icon="mdi-account-group" title="Customers" to="/customers"></v-list-item>
        <v-list-item prepend-icon="mdi-badge-account" title="Employees" to="/employees"></v-list-item>
        <v-list-item prepend-icon="mdi-shield-account" title="Users" to="/users"></v-list-item>
        <v-list-item prepend-icon="mdi-cog" title="Settings" to="/settings"></v-list-item>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const drawer = ref(true)
const rail = ref(false)
const router = useRouter()
const token = useCookie('auth_token')

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
