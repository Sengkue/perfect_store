<template>
  <v-layout class="bg-background fill-height align-center justify-center">
    <v-card width="400" elevation="4" rounded="lg" class="pa-4">
      <v-card-title class="text-center text-h5 font-weight-bold pt-4">Perfect Store Admin</v-card-title>
      <v-card-text class="mt-4">
        <v-form @submit.prevent="handleLogin" v-model="isValid">
          <v-text-field
            v-model="username"
            label="Username"
            prepend-inner-icon="mdi-account"
            variant="outlined"
            density="comfortable"
            :rules="[v => !!v || 'Username is required']"
            required
            class="mb-2"
          ></v-text-field>
          
          <v-text-field
            v-model="password"
            label="Password"
            type="password"
            prepend-inner-icon="mdi-lock"
            variant="outlined"
            density="comfortable"
            :rules="[v => !!v || 'Password is required']"
            required
            class="mb-4"
          ></v-text-field>

          <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">{{ error }}</v-alert>

          <v-btn
            type="submit"
            color="primary"
            block
            size="large"
            :loading="loading"
            class="mt-2"
          >
            Login
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({
  layout: false // Do not use default layout for login
})

const username = ref('')
const password = ref('')
const isValid = ref(false)
const loading = ref(false)
const error = ref('')
const router = useRouter()
const token = useCookie('auth_token')
const api = useApi()

const handleLogin = async () => {
  if (!isValid.value) return

  loading.value = true
  error.value = ''

  try {
    const res = await api('/auth/login', {
      method: 'POST',
      body: {
        username: username.value,
        password: password.value
      }
    })

    if (res.success) {
      // Store token
      token.value = res.data.token
      router.push('/')
    } else {
      error.value = res.message || 'Login failed'
    }
  } catch (err) {
    error.value = err.data?.message || 'An error occurred during login. Check if backend is running.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.fill-height {
  height: 100vh;
}
</style>
