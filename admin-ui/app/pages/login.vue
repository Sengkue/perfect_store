<template>
  <v-app class="login-wrapper">
    <v-main>
      <v-container fluid class="fill-height pa-0">
        <v-row class="fill-height ma-0">
          <!-- Left Side: Branding & Visuals -->
          <v-col cols="12" md="6" class="d-none d-md-flex flex-column justify-center align-center bg-primary-gradient position-relative overflow-hidden text-white">
            <div class="blob-1"></div>
            <div class="blob-2"></div>
            
            <div class="z-index-1 text-center px-10">
              <v-icon size="96" class="mb-6 text-white drop-shadow">mdi-storefront-outline</v-icon>
              <h1 class="text-h3 font-weight-bold mb-4 drop-shadow">Perfect Store</h1>
              <p class="text-h6 font-weight-regular opacity-90 mx-auto" style="max-width: 400px;">
                Streamline your point of sale management with elegance and power.
              </p>
            </div>
            
            <!-- A subtle glassmorphic overlay element for aesthetics -->
            <div class="glass-overlay"></div>
            <div class="glass-overlay-2"></div>
          </v-col>
          
          <!-- Right Side: Login Form -->
          <v-col cols="12" md="6" class="d-flex align-center justify-center bg-surface">
            <div class="login-form-container w-100 pa-6 pa-sm-12">
              <div class="d-md-none text-center mb-8">
                <v-icon size="64" color="primary" class="mb-4">mdi-storefront-outline</v-icon>
                <h1 class="text-h4 font-weight-bold text-primary">Perfect Store</h1>
              </div>
              
              <h2 class="text-h4 font-weight-bold mb-2 text-high-emphasis">Welcome Back</h2>
              <p class="text-body-1 text-medium-emphasis mb-8">Please enter your details to sign in.</p>
              
              <v-form @submit.prevent="handleLogin" v-model="isValid" ref="form">
                <v-text-field
                  v-model="username"
                  label="Username"
                  placeholder="Enter your username"
                  prepend-inner-icon="mdi-account-outline"
                  variant="outlined"
                  color="primary"
                  bg-color="background"
                  :rules="[v => !!v || 'Username is required']"
                  required
                  class="mb-4 custom-input"
                  rounded="lg"
                  hide-details="auto"
                ></v-text-field>
                
                <v-text-field
                  v-model="password"
                  label="Password"
                  placeholder="••••••••"
                  :type="showPassword ? 'text' : 'password'"
                  prepend-inner-icon="mdi-lock-outline"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showPassword = !showPassword"
                  variant="outlined"
                  color="primary"
                  bg-color="background"
                  :rules="[v => !!v || 'Password is required']"
                  required
                  class="mb-6 custom-input"
                  rounded="lg"
                  hide-details="auto"
                ></v-text-field>

                <div class="d-flex justify-space-between align-center mb-8">
                  <v-checkbox
                    v-model="rememberMe"
                    label="Remember me"
                    color="primary"
                    hide-details
                    density="compact"
                    class="ma-0 pa-0 text-body-2"
                  ></v-checkbox>
                  <a href="#" class="text-primary text-decoration-none font-weight-medium text-body-2 hover-underline transition-fast">Forgot Password?</a>
                </div>

                <v-slide-y-transition>
                  <v-alert 
                    v-if="error" 
                    type="error" 
                    variant="tonal" 
                    class="mb-6 rounded-lg font-weight-medium" 
                    density="comfortable" 
                    icon="mdi-alert-circle-outline"
                  >
                    {{ error }}
                  </v-alert>
                </v-slide-y-transition>

                <v-btn
                  type="submit"
                  color="primary"
                  block
                  size="x-large"
                  :loading="loading"
                  height="56"
                  elevation="3"
                  class="font-weight-bold text-button rounded-lg hover-rise"
                >
                  Sign In
                  <v-icon end icon="mdi-arrow-right" class="ml-2"></v-icon>
                </v-btn>
              </v-form>
              
              <div class="text-center mt-10">
                <p class="text-body-2 text-medium-emphasis">
                  Don't have an account? 
                  <a href="#" class="text-primary font-weight-bold text-decoration-none hover-underline transition-fast">Contact Administrator</a>
                </p>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({
  layout: false // Do not use default layout for login
})

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)
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
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

.login-wrapper {
  background-color: rgb(var(--v-theme-surface));
  font-family: 'Plus Jakarta Sans', sans-serif !important;
}

h1, h2, h3, .text-button {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  letter-spacing: -0.5px;
}

.login-form-container {
  max-width: 440px;
  margin: 0 auto;
}

.bg-primary-gradient {
  background: linear-gradient(135deg, #1976D2 0%, #0D47A1 100%);
  position: relative;
}

.z-index-1 {
  z-index: 1;
}

.opacity-90 {
  opacity: 0.9;
}

.drop-shadow {
  text-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* Custom rounded inputs */
:deep(.v-field--variant-outlined) {
  border-radius: 12px;
  transition: all 0.3s ease;
}

:deep(.v-field--focused.v-field--variant-outlined) {
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.08);
}

/* Glassmorphism details */
.glass-overlay {
  position: absolute;
  top: 15%;
  left: 10%;
  width: 250px;
  height: 250px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transform: rotate(15deg);
  z-index: 0;
  animation: float 7s ease-in-out infinite;
}

.glass-overlay-2 {
  position: absolute;
  bottom: 10%;
  right: 5%;
  width: 320px;
  height: 180px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  transform: rotate(-10deg);
  z-index: 0;
  animation: float-reverse 9s ease-in-out infinite;
}

/* Animated Blobs */
.blob-1, .blob-2 {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  opacity: 0.4;
  animation: pulse-blob 10s infinite alternate;
}

.blob-1 {
  top: -15%;
  left: -20%;
  width: 500px;
  height: 500px;
  background: #64B5F6;
}

.blob-2 {
  bottom: -20%;
  right: -15%;
  width: 600px;
  height: 600px;
  background: #2196F3;
  animation-delay: 3s;
}

/* Hover Effects */
.transition-fast {
  transition: all 0.2s ease;
}

.hover-rise {
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
}

.hover-rise:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -10px #1976D2 !important;
}

.hover-underline:hover {
  text-decoration: underline !important;
}

/* Animations */
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(15deg); }
  50% { transform: translateY(-20px) rotate(20deg); }
}

@keyframes float-reverse {
  0%, 100% { transform: translateY(0) rotate(-10deg); }
  50% { transform: translateY(25px) rotate(-15deg); }
}

@keyframes pulse-blob {
  0% { transform: scale(1); opacity: 0.3; }
  100% { transform: scale(1.2); opacity: 0.6; }
}
</style>
