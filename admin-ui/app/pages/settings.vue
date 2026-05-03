<template>
  <v-container fluid class="pa-2 container-border" v-if="hasPermission('settings.view')">
    <!-- ── Header Section ── -->
    <v-row class="mb-2" dense>
      <v-col cols="12" class="d-flex align-center flex-wrap gap-2">
        <div class="header-icon-container rounded-lg pa-2 me-2 border">
          <v-icon color="primary" size="20">mdi-cog</v-icon>
        </div>
        <div>
          <h1 class="text-h5 font-weight-black mb-0">ການຕັ້ງຄ່າລະບົບ</h1>
          <p class="text-caption text-medium-emphasis mb-0">ປັບແຕ່ງຂໍ້ມູນຮ້ານ ແລະ ການຕັ້ງຄ່າແອັບພລິເຄຊັນ</p>
        </div>
        <v-spacer></v-spacer>
        <v-btn 
          v-if="hasPermission('settings.view')" 
          color="primary" 
          variant="elevated" 
          class="rounded-lg px-4 font-weight-bold shadow-soft" 
          size="small"
          prepend-icon="mdi-content-save" 
          @click="saveSettings" 
          :loading="loading"
        >
          ບັນທຶກການປ່ຽນແປງ
        </v-btn>
      </v-col>
    </v-row>

    <v-card border elevation="0" class="rounded-lg pa-2 shadow-soft">
      <v-form v-model="isValid" @submit.prevent="saveSettings">
        <v-row dense>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.shop_name"
              label="Shop Name"
              variant="outlined"
              density="compact"
              :rules="[v => !!v || 'Shop Name is required']"
              required
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.phone"
              label="Phone Number"
              variant="outlined"
              density="compact"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.email"
              label="Email Address"
              variant="outlined"
              density="compact"
              type="email"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.tax_number"
              label="Tax Registration Number"
              variant="outlined"
              density="compact"
            ></v-text-field>
          </v-col>
          <v-col cols="12">
            <v-textarea
              v-model="form.address"
              label="Shop Address"
              variant="outlined"
              density="compact"
              rows="2"
            ></v-textarea>
          </v-col>

          <v-col cols="12" class="pt-0">
            <div class="text-subtitle-2 font-weight-bold mb-2 text-primary d-flex align-center">
              <v-icon start size="18">mdi-percent</v-icon>
              Tax Settings
            </div>
            <v-divider class="mb-4"></v-divider>
          </v-col>
          <v-col cols="12" md="6" class="pt-0">
             <v-text-field
              v-model="form.tax_rate"
              label="Tax Rate (%)"
              variant="outlined"
              density="compact"
              type="number"
              hide-details
              suffix="%"
              :rules="[v => v !== null && v !== '' || 'Tax rate is required']"
            ></v-text-field>
            <div class="text-caption text-grey ml-1 mt-1">This rate is used globally for transaction calculations.</div>
          </v-col>

          <v-col cols="12" class="mt-2">
            <div class="text-subtitle-2 font-weight-bold mb-2 text-primary d-flex align-center">
              <v-icon start size="18">mdi-monitor-dashboard</v-icon>
              POS Application Settings
            </div>
            <v-divider class="mb-4"></v-divider>
          </v-col>
          <v-col cols="12" md="6" class="pt-0">
            <v-switch
              v-model="posSoundEnabled"
              label="Enable POS Sound Effects"
              color="primary"
              inset
              hide-details
              density="compact"
            ></v-switch>
            <div class="text-caption text-grey ml-1 mt-1">Play sounds for scanning, clicks, and checkouts. (Saved to this device)</div>
          </v-col>
          <v-col cols="12" md="6" class="pt-0">
            <div class="text-subtitle-2 font-weight-bold mb-2 text-grey-darken-1">Application Theme</div>
            <v-btn-toggle
              v-model="themeSetting"
              color="primary"
              mandatory
              variant="outlined"
              density="compact"
              class="w-100 rounded-lg overflow-hidden"
            >
              <v-btn value="light" class="flex-grow-1 text-none">
                <v-icon start size="18">mdi-white-balance-sunny</v-icon>
                Light
              </v-btn>
              <v-btn value="system" class="flex-grow-1 text-none">
                <v-icon start size="18">mdi-monitor</v-icon>
                System
              </v-btn>
              <v-btn value="dark" class="flex-grow-1 text-none">
                <v-icon start size="18">mdi-weather-night</v-icon>
                Dark
              </v-btn>
            </v-btn-toggle>
            <div class="text-caption text-grey ml-1 mt-2">Choose your preferred appearance. (Saved to this device)</div>
          </v-col>
        </v-row>
      </v-form>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { showToast } from '~/composables/useToast'
import { useTheme } from 'vuetify'

const api = useApi()
const theme = useTheme()
const { hasPermission } = usePermissions()

const isValid = ref(false)
const loading = ref(false)

const form = ref({
  shop_name: '',
  phone: '',
  email: '',
  address: '',
  tax_number: '',
  tax_rate: 10
})

const posSoundEnabled = ref(true)
const themeSetting = ref('system')

let isLoaded = false
const fetchSettings = async () => {
  try {
    const res = await api('/shop-settings')
    if (res.success && res.data) {
      form.value = { ...res.data }
    }
  } catch(err) {
    console.error(err)
    showToast('Failed to load settings.', 'error')
  }
  
  posSoundEnabled.value = localStorage.getItem('pos_sound_enabled') !== 'false'
  themeSetting.value = localStorage.getItem('pos_theme') || 'system'
  isLoaded = true
}

onMounted(fetchSettings)

watch(posSoundEnabled, (val) => {
  if (isLoaded) {
    localStorage.setItem('pos_sound_enabled', val)
  }
})

watch(themeSetting, (val) => {
  if (isLoaded) {
    localStorage.setItem('pos_theme', val)
    if (val === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      theme.global.name.value = prefersDark ? 'dark' : 'light'
    } else {
      theme.global.name.value = val
    }
  }
})

const saveSettings = async () => {
  if (!isValid.value) {
    showToast('Please correct the validation errors.', 'error')
    return
  }

  loading.value = true

  try {
    const payload = { ...form.value, tax_rate: Number(form.value.tax_rate) }
    const res = await api('/shop-settings', {
      method: 'PUT',
      body: payload
    })

    if (res.success) {
      showToast('Settings updated successfully!', 'success')
      form.value = { ...res.data }
    } else {
      showToast(res.message || 'Failed to update settings', 'error')
    }
  } catch(err) {
    console.error(err)
    showToast('A server error occurred while updating settings.', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.header-icon-container {
  background-color: rgba(var(--v-theme-primary), 0.1);
  border-color: rgba(var(--v-theme-primary), 0.2) !important;
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
</style>
