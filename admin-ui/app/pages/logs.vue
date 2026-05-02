<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-6">
          <v-icon size="36" color="primary" class="mr-4">mdi-file-document-outline</v-icon>
          <div>
            <h1 class="text-h4 font-weight-bold">System Logs</h1>
            <div class="text-subtitle-1 text-medium-emphasis">ຕິດຕາມການເຮັດວຽກ ແລະ ຂໍ້ຜິດພາດຂອງລະບົບ</div>
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
            class="ml-2"
            @click="fetchLogs"
            :loading="loading"
          ></v-btn>
        </div>

        <v-card variant="outlined" class="log-card">
          <v-table density="compact" fixed-header height="calc(100vh - 250px)">
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
                    {{ log.level.toUpperCase() }}
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
          <v-icon :color="getLevelColor(selectedLog.level)" class="mr-2">
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
  loading.ref = true
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
    default: return 'medium-emphasis'
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
.log-card {
  border-radius: 12px;
  overflow: hidden;
  background: white;
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

tr:hover {
  background-color: rgba(var(--v-theme-primary), 0.02) !important;
}

td {
  border-bottom: 1px solid rgba(0,0,0,0.05) !important;
}
</style>
