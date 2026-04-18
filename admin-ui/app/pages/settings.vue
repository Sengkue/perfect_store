<template>
  <div class="w-100">
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h4 font-weight-bold">Shop Settings</h1>
      <v-btn color="primary" prepend-icon="mdi-content-save" @click="saveSettings" :loading="loading">Save Change</v-btn>
    </div>

    <v-card elevation="2" class="rounded-lg pa-4">
      <v-form v-model="isValid" @submit.prevent="saveSettings">
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.shop_name"
              label="Shop Name"
              variant="outlined"
              :rules="[v => !!v || 'Shop Name is required']"
              required
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.phone"
              label="Phone Number"
              variant="outlined"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.email"
              label="Email Address"
              variant="outlined"
              type="email"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.tax_number"
              label="Tax Registration Number"
              variant="outlined"
            ></v-text-field>
          </v-col>
          <v-col cols="12">
            <v-textarea
              v-model="form.address"
              label="Shop Address"
              variant="outlined"
              rows="3"
            ></v-textarea>
          </v-col>

          <v-col cols="12">
            <h3 class="text-h6 font-weight-bold mb-3 mt-2">Tax Settings</h3>
            <v-divider class="mb-4"></v-divider>
          </v-col>
          <v-col cols="12" md="6">
             <v-text-field
              v-model="form.tax_rate"
              label="Tax Rate (%)"
              variant="outlined"
              type="number"
              hide-details
              suffix="%"
              :rules="[v => v !== null && v !== '' || 'Tax rate is required']"
            ></v-text-field>
            <div class="text-caption text-grey ml-1 mt-1">This rate is used globally for transaction calculations.</div>
          </v-col>
        </v-row>
      </v-form>

      <v-alert v-if="successMessage" type="success" variant="tonal" class="mt-4" closable @click:close="successMessage = ''">
        {{ successMessage }}
      </v-alert>
      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mt-4" closable @click:close="errorMessage = ''">
        {{ errorMessage }}
      </v-alert>

    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const api = useApi()

const isValid = ref(false)
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const form = ref({
  shop_name: '',
  phone: '',
  email: '',
  address: '',
  tax_number: '',
  tax_rate: 10
})

const fetchSettings = async () => {
  try {
    const res = await api('/shop-settings')
    if (res.success && res.data) {
      form.value = { ...res.data }
    }
  } catch(err) {
    console.error(err)
    errorMessage.value = 'Failed to load settings.'
  }
}

onMounted(fetchSettings)

const saveSettings = async () => {
  if (!isValid.value) {
    errorMessage.value = 'Please correct the validation errors.'
    return
  }

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const payload = { ...form.value, tax_rate: Number(form.value.tax_rate) }
    const res = await api('/shop-settings', {
      method: 'PUT',
      body: payload
    })

    if (res.success) {
      successMessage.value = 'Settings updated successfully!'
      form.value = { ...res.data }
    } else {
      errorMessage.value = res.message || 'Failed to update settings'
    }
  } catch(err) {
    console.error(err)
    errorMessage.value = 'A server error occurred while updating settings.'
  } finally {
    loading.value = false
  }
}
</script>
