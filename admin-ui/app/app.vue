<template>
  <Transition name="fade">
    <div v-if="loading" class="loading-container">
      <div class="glass-loader">
        <div class="spinner-ring"></div>
        <div class="spinner-core"></div>
      </div>
      <div class="loading-text">Perfect Store POS</div>
    </div>
  </Transition>

  <div v-show="!loading" class="app-content">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
const loading = ref(true)

onMounted(() => {
  // Add a slight delay to ensure smooth transition and allow animations to show
  setTimeout(() => {
    loading.value = false
  }, 500)
})
</script>

<style>
body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.loading-container {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  z-index: 9999;
}

.glass-loader {
  position: relative;
  width: 70px;
  height: 70px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: #3b82f6; /* Blue */
  border-right-color: #60a5fa;
  animation: spin 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
}

.spinner-ring::before {
  content: '';
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  border: 3px solid transparent;
  border-bottom-color: #8b5cf6; /* Purple */
  border-left-color: #a78bfa;
  animation: spin-reverse 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
}

.spinner-core {
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
  box-shadow: 0 0 15px rgba(99, 102, 241, 0.6);
}

.loading-text {
  font-size: 1.15rem;
  font-weight: 600;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  animation: pulse-opacity 2s ease-in-out infinite;
}

.app-content {
  animation: fade-in-up 0.6s ease-out;
}

/* Transitions */
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-leave-to {
  opacity: 0;
}

/* Keyframes */
@keyframes spin {
  100% { transform: rotate(360deg); }
}

@keyframes spin-reverse {
  100% { transform: rotate(-360deg); }
}

@keyframes pulse {
  0%, 100% { transform: scale(0.8); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; }
}

@keyframes pulse-opacity {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>