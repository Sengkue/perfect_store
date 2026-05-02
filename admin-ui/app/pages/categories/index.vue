<template>
  <v-card rounded="lg" elevation="2" v-if="hasPermission('categories.view')">
    <!-- Header -->
    <v-card-title class="d-flex align-center py-3 px-4">
      <span class="text-h6 font-weight-bold">Categories</span>
      <v-spacer></v-spacer>
      <v-btn v-if="hasPermission('categories.create')" color="primary" prepend-icon="mdi-plus" @click="openAddDialog">Add Category</v-btn>
    </v-card-title>
    <v-divider></v-divider>

    <!-- Data Table -->
    <v-data-table
      :headers="headers"
      :items="categories"
      :loading="loading"
      hover
    >
      <template v-slot:item.parent="{ item }">
        <v-chip v-if="item.parent" size="small" color="secondary" variant="tonal">
          {{ item.parent.category_name }}
        </v-chip>
        <span v-else class="text-medium-emphasis text-caption">—</span>
      </template>

      <template v-slot:item.actions="{ item }">
        <v-btn v-if="hasPermission('categories.edit')" icon="mdi-pencil" variant="text" size="small" color="primary" @click="openEditDialog(item)"></v-btn>
        <v-btn v-if="hasPermission('categories.delete')" icon="mdi-delete" variant="text" size="small" color="error" @click="openDeleteDialog(item)"></v-btn>
      </template>
    </v-data-table>

    <!-- ── Add / Edit Dialog ── -->
    <v-dialog v-model="formDialog" max-width="480" persistent>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon :icon="isEditing ? 'mdi-pencil' : 'mdi-plus-circle'" class="me-2" color="primary"></v-icon>
          {{ isEditing ? 'Edit Category' : 'Add Category' }}
        </v-card-title>
        <v-divider></v-divider>

        <v-card-text class="pa-4">
          <v-form ref="formRef" @submit.prevent="submitForm">
            <v-text-field
              v-model="form.category_name"
              label="Category Name *"
              prepend-inner-icon="mdi-tag-outline"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'Name is required']"
              class="mb-3"
            ></v-text-field>

            <v-text-field
              v-model="form.slug"
              label="Slug"
              prepend-inner-icon="mdi-link-variant"
              variant="outlined"
              density="comfortable"
              hint="Auto-generated from name if left blank"
              persistent-hint
              class="mb-3"
            ></v-text-field>

            <v-select
              v-model="form.parent_id"
              :items="parentOptions"
              item-title="category_name"
              item-value="id"
              label="Parent Category"
              prepend-inner-icon="mdi-sitemap-outline"
              variant="outlined"
              density="comfortable"
              clearable
              hint="Leave blank for root category"
              persistent-hint
            ></v-select>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeFormDialog" :disabled="saving">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="saving"
            @click="submitForm"
          >
            {{ isEditing ? 'Save Changes' : 'Add Category' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Delete Confirmation Dialog ── -->
    <v-dialog v-model="deleteDialog" max-width="400" persistent>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-alert-circle-outline" color="error" class="me-2"></v-icon>
          Confirm Delete
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-4">
          Are you sure you want to delete <strong>{{ selectedCategory?.category_name }}</strong>?
          This action cannot be undone.
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false" :disabled="deleting">Cancel</v-btn>
          <v-btn color="error" variant="elevated" :loading="deleting" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { showToast } from '~/composables/useToast'

const api = useApi()
const { hasPermission } = usePermissions()

// ── State ──────────────────────────────────────────────
const categories = ref([])
const loading    = ref(false)

// Form dialog
const formDialog  = ref(false)
const isEditing   = ref(false)
const saving      = ref(false)
const formRef     = ref(null)
const form        = ref({ category_name: '', slug: '', parent_id: null })
const editingId   = ref(null)

// Delete dialog
const deleteDialog     = ref(false)
const deleting         = ref(false)
const selectedCategory = ref(null)

// ── Table headers ──────────────────────────────────────
const headers = [
  { title: 'ID',      key: 'id',                  width: 80 },
  { title: 'Name',    key: 'category_name' },
  { title: 'Slug',    key: 'slug' },
  { title: 'Parent',  key: 'parent',              sortable: false },
  { title: 'Actions', key: 'actions',             sortable: false, align: 'end' }
]

// ── Parent options (exclude self when editing) ────────
const parentOptions = computed(() =>
  categories.value.filter(c => c.id !== editingId.value)
)

// ── Helpers ────────────────────────────────────────────
const notify = (message, color = 'success') => {
  showToast(message, color)
}

const resetForm = () => {
  form.value = { category_name: '', slug: '', parent_id: null }
  editingId.value = null
  formRef.value?.reset()
}

// ── CRUD actions ───────────────────────────────────────
const loadCategories = async () => {
  loading.value = true
  try {
    const res = await api('/categories')
    if (res.success) categories.value = res.data
  } catch (err) {
    // Error is handled globally by useApi
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  resetForm()
  isEditing.value = false
  formDialog.value = true
}

const openEditDialog = (item) => {
  resetForm()
  isEditing.value = true
  editingId.value = item.id
  form.value = {
    category_name: item.category_name,
    slug:          item.slug,
    parent_id:     item.parent_id ?? null
  }
  formDialog.value = true
}

const closeFormDialog = () => {
  formDialog.value = false
  resetForm()
}

const submitForm = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  saving.value = true
  try {
    const payload = { ...form.value }
    if (!payload.parent_id) delete payload.parent_id
    if (!payload.slug)      delete payload.slug

    let res
    if (isEditing.value) {
      res = await api(`/categories/${editingId.value}`, { method: 'PUT', body: payload })
    } else {
      res = await api('/categories', { method: 'POST', body: payload })
    }

    if (res.success) {
      notify(isEditing.value ? 'Category updated' : 'Category added')
      closeFormDialog()
      loadCategories()
    }
  } catch (err) {
    // Error is handled globally by useApi
  } finally {
    saving.value = false
  }
}

const openDeleteDialog = (item) => {
  selectedCategory.value = item
  deleteDialog.value     = true
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    const res = await api(`/categories/${selectedCategory.value.id}`, { method: 'DELETE' })
    if (res.success) {
      notify('Category deleted')
      deleteDialog.value = false
      loadCategories()
    }
  } catch (err) {
    // Error is handled globally by useApi
  } finally {
    deleting.value = false
  }
}

// ── Init ───────────────────────────────────────────────
onMounted(loadCategories)
</script>
