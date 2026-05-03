<template>
  <v-container fluid class="pa-2 container-border">
    <v-row dense>
      <v-col cols="12">
        <div class="d-flex align-center mb-2">
          <div class="header-icon-container rounded-lg pa-2 me-2 border">
            <v-icon size="20" color="primary">mdi-file-document-outline</v-icon>
          </div>
          <div>
            <h1 class="text-h5 font-weight-bold mb-0">System Logs</h1>
            <div class="text-caption text-medium-emphasis mb-0">ຕິດຕາມການເຮັດວຽກ ແລະ ຂໍ້ຜິດພາດຂອງລະບົບ</div>
          </div>
          <v-spacer></v-spacer>
          <v-select
            v-model="selectedFile"
            :items="logFiles"
            label="Log File"
            density="compact"
            variant="outlined"
            hide-details
            style="max-width: 300px"
            prepend-inner-icon="mdi-history"
            @update:model-value="fetchLogs"
          ></v-select>
          <v-btn
            color="primary"
            variant="tonal"
            icon="mdi-refresh"
            size="small"
            class="ms-2 rounded-lg"
            @click="fetchLogs"
            :loading="loading"
          ></v-btn>
        </div>

        <v-card border elevation="0" class="rounded-lg overflow-hidden shadow-soft">
          <v-table density="compact" fixed-header height="calc(100vh - 180px)" class="custom-table">
            <thead>
              <tr>
                <th class="text-left font-weight-bold">Timestamp</th>
                <th class="text-left font-weight-bold">Level</th>
                <th class="text-left font-weight-bold">Message</th>
                <th class="text-left font-weight-bold">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading && !logs.length">
                <td colspan="4" class="text-center pa-10">
                  <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </td>
              </tr>
              <tr v-else-if="!logs.length">
                <td colspan="4" class="text-center pa-10 text-medium-emphasis">
                  ບໍ່ມີຂໍ້ມູນ Log
                </td>
              </tr>
              <tr v-for="(log, index) in logs" :key="index" :class="getLevelClass(log.level)">
                <td class="text-caption font-weight-medium text-no-wrap">{{ log.timestamp }}</td>
                <td class="text-center">
                  <v-chip
                    :color="getLevelColor(log.level)"
                    size="x-small"
                    class="font-weight-bold"
                    variant="flat"
                    label
                  >
                    {{ log.level?.toUpperCase() }}
                  </v-chip>
                </td>
                <td class="text-body-2 font-weight-medium">{{ log.message }}</td>
                <td class="text-caption">
                  <v-btn
                    v-if="hasDetails(log)"
                    variant="text"
                    size="x-small"
                    icon="mdi-eye-outline"
                    @click="viewDetails(log)"
                  ></v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="800">
      <v-card v-if="selectedLog" border>
        <v-card-title class="d-flex align-center">
          <v-icon :color="getLevelColor(selectedLog.level)" class="me-2">
            {{ getLevelIcon(selectedLog.level) }}
          </v-icon>
          Log Details
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="detailsDialog = false"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-0">
          <div class="pa-4 bg-surface-variant text-caption font-monospace overflow-auto" style="max-height: 500px">
            <pre>{{ formattedDetails }}</pre>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
const api = useApi()

const logs = ref([])
const logFiles = ref([])
const selectedFile = ref('')
const loading = ref(false)
const detailsDialog = ref(false)
const selectedLog = ref(null)

const fetchLogs = async () => {
  loading.value = true
  try {
    const res = await api('/system-logs', {
      params: { file: selectedFile.value }
    })
    if (res.success) {
      logs.value = res.content
      logFiles.value = res.files
      if (!selectedFile.value) {
        selectedFile.value = res.currentFile
      }
    }
  } catch (error) {
    console.error('Failed to fetch logs', error)
  } finally {
    loading.value = false
  }
}

const getLevelColor = (level) => {
  switch (level) {
    case 'error': return 'error'
    case 'warn': return 'warning'
    case 'info': return 'info'
    case 'debug': return 'secondary'
    default: return 'grey'
  }
}

const getLevelIcon = (level) => {
  switch (level) {
    case 'error': return 'mdi-alert-circle'
    case 'warn': return 'mdi-alert'
    case 'info': return 'mdi-information'
    case 'debug': return 'mdi-bug'
    default: return 'mdi-help-circle'
  }
}

const getLevelClass = (level) => {
  if (level === 'error') return 'bg-error-lighten-5'
  if (level === 'warn') return 'bg-warning-lighten-5'
  return ''
}

const hasDetails = (log) => {
  const keys = Object.keys(log).filter(k => !['timestamp', 'level', 'message', 'service'].includes(k))
  return keys.length > 0
}

const viewDetails = (log) => {
  selectedLog.value = log
  detailsDialog.value = true
}

const formattedDetails = computed(() => {
  if (!selectedLog.value) return ''
  const details = { ...selectedLog.value }
  // Remove fields already shown in table
  delete details.timestamp
  delete details.level
  delete details.message
  delete details.service
  return JSON.stringify(details, null, 2)
})

onMounted(() => {
  fetchLogs()
})
</script>


<style scoped>
.container-border {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  background-color: rgb(var(--v-theme-surface));
  margin-top: 8px;
}

.header-icon-container {
  background-color: rgba(var(--v-theme-primary), 0.1);
  border-color: rgba(var(--v-theme-primary), 0.2) !important;
}

.font-monospace {
  font-family: 'Courier New', Courier, monospace;
}

.bg-error-lighten-5 {
  background-color: rgba(var(--v-theme-error), 0.05) !important;
}

.bg-warning-lighten-5 {
  background-color: rgba(var(--v-theme-warning), 0.05) !important;
}

.shadow-soft {
  box-shadow: 0 4px 20px rgba(0,0,0,0.04) !important;
}

.custom-table :deep(th) {
  font-weight: bold !important;
  color: #555 !important;
  background-color: #FAFAFA !important;
  text-transform: uppercase;
  font-size: 0.7rem !important;
  letter-spacing: 0.05em;
  padding: 0 8px !important;
}

.custom-table :deep(td) {
  padding: 0 8px !important;
  border-bottom: 1px solid rgba(0,0,0,0.05) !important;
}

tr:hover {
  background-color: rgba(var(--v-theme-primary), 0.02) !important;
}
</style>
