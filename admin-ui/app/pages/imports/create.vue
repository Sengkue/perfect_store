<template>
  <div>
    <!-- Page header -->
    <div class="d-flex align-center mb-5">
      <v-btn icon="mdi-arrow-left" variant="text" to="/imports" class="me-2" />
      <div>
        <h1 class="text-h5 font-weight-bold">New Stock Import</h1>
        <p class="text-caption text-medium-emphasis mb-0">Record incoming goods and update inventory</p>
      </div>
    </div>

    <v-form ref="formRef" @submit.prevent="submitImport">
      <v-row>
        <!-- ── LEFT — Import header ─────────────────────────── -->
        <v-col cols="12" md="4">
          <v-card rounded="lg" elevation="2" class="pa-4">
            <div class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center">
              <v-icon icon="mdi-file-document-edit-outline" color="primary" class="me-2" />
              Import Info
            </div>

            <!-- Supplier -->
            <v-autocomplete
              v-model="form.supplier_id"
              :items="suppliers"
              item-title="name"
              item-value="id"
              label="Supplier"
              prepend-inner-icon="mdi-domain"
              variant="outlined"
              density="comfortable"
              clearable
              class="mb-3"
              :loading="loadingSuppliers"
            >
              <template #no-data>
                <v-list-item>
                  <v-list-item-title class="text-caption">No suppliers found</v-list-item-title>
                </v-list-item>
              </template>
            </v-autocomplete>

            <!-- Invoice number -->
            <v-text-field
              v-model="form.invoice_number"
              label="Invoice Number"
              prepend-inner-icon="mdi-receipt-text-outline"
              variant="outlined"
              density="comfortable"
              hint="Leave blank to auto-generate"
              persistent-hint
              class="mb-3"
            />

            <!-- Receive date -->
            <v-text-field
              v-model="form.receive_date"
              label="Receive Date *"
              prepend-inner-icon="mdi-calendar"
              type="date"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'Date is required']"
              class="mb-3"
            />

            <!-- Payment status -->
            <v-select
              v-model="form.payment_status"
              :items="paymentStatusOptions"
              item-title="label"
              item-value="value"
              label="Payment Status"
              prepend-inner-icon="mdi-cash-check"
              variant="outlined"
              density="comfortable"
              class="mb-1"
            />

            <!-- Summary box -->
            <v-sheet
              color="primary"
              variant="tonal"
              rounded="lg"
              class="pa-4 mt-4"
            >
              <div class="text-caption text-medium-emphasis mb-1">Items</div>
              <div class="text-h6 font-weight-bold">{{ form.items.length }}</div>
              <v-divider class="my-2" />
              <div class="text-caption text-medium-emphasis mb-1">Total Amount</div>
              <div class="text-h5 font-weight-bold">{{ formatCurrency(totalAmount) }}</div>
            </v-sheet>
          </v-card>
        </v-col>

        <!-- ── RIGHT — Line items ──────────────────────────── -->
        <v-col cols="12" md="8">
          <v-card rounded="lg" elevation="2" class="pa-4">
            <div class="d-flex align-center mb-4">
              <div class="text-subtitle-1 font-weight-bold d-flex align-center">
                <v-icon icon="mdi-package-variant" color="primary" class="me-2" />
                Products to Import
              </div>
              <v-spacer />
              <v-btn
                color="primary"
                variant="tonal"
                prepend-icon="mdi-plus"
                size="small"
                @click="addItemRow"
              >
                Add Product
              </v-btn>
            </div>

            <!-- Product search & add -->
            <v-autocomplete
              v-model="productSearch"
              :items="productSuggestions"
              :loading="searchingProduct"
              item-title="display"
              item-value="id"
              label="Search product to add…"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              return-object
              class="mb-4"
              no-filter
              @update:search="onProductSearch"
              @update:model-value="onProductSelected"
              placeholder="Type product name or barcode…"
            >
              <template #item="{ item, props }">
                <v-list-item v-bind="props">
                  <template #prepend>
                    <v-avatar size="32" color="grey-lighten-3" rounded="sm">
                      <v-icon icon="mdi-package-variant-closed" size="18" color="grey" />
                    </v-avatar>
                  </template>
                  <v-list-item-subtitle>
                    SKU: {{ item.raw.sku ?? '—' }} | Barcode: {{ item.raw.barcode ?? '—' }}
                  </v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-autocomplete>

            <!-- Items table -->
            <v-table density="compact" class="rounded-lg border" v-if="form.items.length > 0">
              <thead>
                <tr>
                  <th style="width:34%">Product</th>
                  <th style="width:22%">Variant</th>
                  <th style="width:13%">Qty *</th>
                  <th style="width:16%">Unit Cost</th>
                  <th style="width:12%">Subtotal</th>
                  <th style="width:3%"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in form.items" :key="idx">
                  <!-- Product name -->
                  <td>
                    <span class="text-body-2 font-weight-medium">{{ item.product_name }}</span>
                    <div class="text-caption text-medium-emphasis">{{ item.sku }}</div>
                  </td>

                  <!-- Variant selector -->
                  <td>
                    <v-select
                      v-if="item.variants && item.variants.length > 0"
                      v-model="item.variant_id"
                      :items="item.variants"
                      :item-title="v => [v.color, v.size].filter(Boolean).join(' / ') || 'Default'"
                      item-value="id"
                      variant="plain"
                      density="compact"
                      hide-details
                      class="text-body-2"
                    />
                    <span v-else class="text-caption text-medium-emphasis">No variants</span>
                  </td>

                  <!-- Quantity -->
                  <td>
                    <v-text-field
                      v-model.number="item.quantity"
                      type="number"
                      min="1"
                      variant="plain"
                      density="compact"
                      hide-details
                      :rules="[v => v > 0 || 'Required']"
                      style="min-width:60px"
                      @update:model-value="recalcItem(idx)"
                    />
                  </td>

                  <!-- Unit cost -->
                  <td>
                    <v-text-field
                      v-model.number="item.unit_cost"
                      type="number"
                      min="0"
                      step="0.01"
                      variant="plain"
                      density="compact"
                      hide-details
                      prefix="$"
                      style="min-width:80px"
                      @update:model-value="recalcItem(idx)"
                    />
                  </td>

                  <!-- Subtotal -->
                  <td class="text-body-2 font-weight-medium text-right">
                    {{ formatCurrency(item.subtotal) }}
                  </td>

                  <!-- Remove -->
                  <td>
                    <v-btn icon="mdi-close" size="x-small" variant="text" color="error" @click="removeItem(idx)" />
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" class="text-right font-weight-bold pa-2">Total</td>
                  <td class="font-weight-bold text-primary text-right pa-2">{{ formatCurrency(totalAmount) }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </v-table>

            <!-- Empty state -->
            <v-sheet
              v-else
              rounded="lg"
              border
              class="d-flex flex-column align-center justify-center pa-10 text-center"
              color="grey-lighten-5"
            >
              <v-icon icon="mdi-package-variant-closed" size="56" color="grey-lighten-1" class="mb-3" />
              <div class="text-body-1 text-medium-emphasis">No products added yet</div>
              <div class="text-caption text-disabled mt-1">Search for a product above or click "Add Product"</div>
            </v-sheet>

            <!-- Actions -->
            <div class="d-flex justify-end gap-2 mt-5">
              <v-btn variant="text" to="/imports" :disabled="saving">Cancel</v-btn>
              <v-btn
                color="primary"
                variant="elevated"
                prepend-icon="mdi-content-save"
                :loading="saving"
                :disabled="form.items.length === 0"
                @click="submitImport('draft')"
              >
                Save as Draft
              </v-btn>
              <v-btn
                color="success"
                variant="elevated"
                prepend-icon="mdi-check-circle"
                :loading="saving"
                :disabled="form.items.length === 0"
                @click="submitImport('complete')"
              >
                Save & Add to Stock
              </v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-form>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000" location="bottom right">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" icon="mdi-close" @click="snackbar.show = false" />
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({ layout: 'default' })

const api    = useApi()
const router = useRouter()

// ── Suppliers ──────────────────────────────────────
const suppliers        = ref([])
const loadingSuppliers = ref(false)

const loadSuppliers = async () => {
  loadingSuppliers.value = true
  try {
    const res = await api('/suppliers?pageSize=500')
    if (res.success) suppliers.value = res.data
  } catch (e) { console.error(e) } finally { loadingSuppliers.value = false }
}

// ── Product search ─────────────────────────────────
const productSearch       = ref(null)
const productSuggestions  = ref([])
const searchingProduct    = ref(false)
let   searchTimer         = null

const onProductSearch = (query) => {
  clearTimeout(searchTimer)
  if (!query || query.length < 2) { productSuggestions.value = []; return }
  searchTimer = setTimeout(async () => {
    searchingProduct.value = true
    try {
      const res = await api(`/products?search=${encodeURIComponent(query)}&pageSize=20`)
      if (res.success) {
        productSuggestions.value = res.data.map(p => ({
          ...p,
          display: p.name
        }))
      }
    } catch (e) { console.error(e) } finally { searchingProduct.value = false }
  }, 350)
}

const onProductSelected = (product) => {
  if (!product) return
  addProduct(product)
  // Reset after tick so the autocomplete clears
  setTimeout(() => { productSearch.value = null; productSuggestions.value = [] }, 100)
}

// ── Form state ─────────────────────────────────────
const formRef = ref(null)
const saving  = ref(false)

const today = new Date().toISOString().slice(0, 10)

const form = ref({
  supplier_id:    null,
  invoice_number: '',
  receive_date:   today,
  payment_status: 'pending',
  items: []
})

const paymentStatusOptions = [
  { label: 'Pending',  value: 'pending'  },
  { label: 'Partial',  value: 'partial'  },
  { label: 'Paid',     value: 'paid'     }
]

// ── Item management ────────────────────────────────
const addProduct = (product) => {
  // Prevent duplicates (same product, no variant already added)
  const exists = form.value.items.some(
    i => i.product_id === product.id && !i.variant_id
  )
  if (exists) {
    notify('Product already in the list', 'warning')
    return
  }
  form.value.items.push({
    product_id:   product.id,
    product_name: product.name,
    sku:          product.sku ?? '',
    variants:     product.variants ?? [],
    variant_id:   product.variants?.length ? product.variants[0].id : null,
    quantity:     1,
    unit_cost:    Number(product.cost_price ?? product.selling_price ?? 0),
    subtotal:     Number(product.cost_price ?? product.selling_price ?? 0)
  })
}

const addItemRow = () => {
  form.value.items.push({
    product_id:   null,
    product_name: 'Select product',
    sku:          '',
    variants:     [],
    variant_id:   null,
    quantity:     1,
    unit_cost:    0,
    subtotal:     0
  })
}

const removeItem = (idx) => {
  form.value.items.splice(idx, 1)
}

const recalcItem = (idx) => {
  const item = form.value.items[idx]
  item.subtotal = (item.quantity || 0) * (item.unit_cost || 0)
}

const totalAmount = computed(() =>
  form.value.items.reduce((sum, i) => sum + (i.subtotal || 0), 0)
)

// ── Submit ─────────────────────────────────────────
const submitImport = async (mode = 'draft') => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  if (form.value.items.some(i => !i.product_id)) {
    notify('Please select a product for every row', 'error')
    return
  }

  saving.value = true
  try {
    const payload = {
      supplier_id:    form.value.supplier_id,
      invoice_number: form.value.invoice_number || undefined,
      receive_date:   form.value.receive_date,
      payment_status: form.value.payment_status,
      items: form.value.items.map(i => ({
        product_id: i.product_id,
        variant_id: i.variant_id || null,
        quantity:   i.quantity,
        unit_cost:  i.unit_cost
      }))
    }

    const res = await api('/imports', { method: 'POST', body: payload })

    if (!res.success) {
      notify(res.message || 'Failed to create import', 'error')
      return
    }

    // If user chose "Save & Add to Stock" → immediately complete the import
    if (mode === 'complete') {
      const statusRes = await api(`/imports/${res.data.id}/status`, {
        method: 'PUT',
        body: { status: 'completed' }
      })
      if (statusRes.success) {
        notify('Import completed — stock levels updated!', 'success')
      } else {
        notify('Import saved but stock update failed: ' + (statusRes.message ?? ''), 'warning')
      }
    } else {
      notify('Import saved as draft', 'success')
    }

    router.push('/imports')
  } catch (err) {
    console.error(err)
    notify('An unexpected error occurred', 'error')
  } finally {
    saving.value = false
  }
}

// ── Helpers ────────────────────────────────────────
const snackbar = ref({ show: false, message: '', color: 'success' })
const notify   = (message, color = 'success') => {
  snackbar.value = { show: true, message, color }
}
const formatCurrency = (v) => v != null ? `$${Number(v).toFixed(2)}` : '$0.00'

// ── Init ───────────────────────────────────────────
onMounted(loadSuppliers)
</script>

<style scoped>
.border {
  border: 1px solid rgba(0,0,0,.12);
}
</style>
