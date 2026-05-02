<template>
  <div v-if="hasPermission('products.view')">
    <!-- ── Page Header with Tabs ── -->
    <v-card rounded="lg" elevation="2">
      <v-card-title class="d-flex align-center py-3 px-4 flex-wrap gap-2">
        <div class="d-flex align-center">
          <v-icon icon="mdi-package-variant-closed" color="primary" class="me-2" />
          <span class="text-h6 font-weight-bold">Products & Stock</span>
        </div>
        <v-spacer />

        <v-text-field
          v-model="search"
          placeholder="Search name, barcode, SKU…"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="max-width:250px"
          @update:model-value="debouncedLoad"
        />
        <v-select
          v-model="filterCategory"
          :items="categories"
          item-title="category_name"
          item-value="id"
          label="Category"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="max-width:160px"
          @update:model-value="loadProducts"
        />
        <v-btn v-if="hasPermission('products.create')" color="primary" prepend-icon="mdi-plus" @click="openAddDialog">
          Add Product
        </v-btn>
      </v-card-title>

      <!-- ── Stock Summary Cards ── -->
      <v-divider />
      <div class="d-flex flex-wrap gap-0">
        <v-card
          v-for="s in stockStats"
          :key="s.label"
          flat
          class="flex-1 pa-4 text-center border-e"
          :class="{ 'border-0': s === stockStats[stockStats.length - 1] }"
          min-width="140"
        >
          <v-icon :icon="s.icon" :color="s.color" size="28" class="mb-1" />
          <div class="text-h5 font-weight-bold mt-1" :class="`text-${s.color}`">{{ s.value }}</div>
          <div class="text-caption text-medium-emphasis">{{ s.label }}</div>
        </v-card>
      </div>
      <v-divider />

      <!-- ── View Toggle ── -->
      <div class="d-flex align-center px-4 py-2 gap-2" style="background:rgba(var(--v-theme-surface-variant),.2)">
        <v-btn-toggle v-model="viewMode" density="compact" variant="outlined" color="primary">
          <v-btn value="products" prepend-icon="mdi-view-list">Products</v-btn>
          <v-btn value="stock" prepend-icon="mdi-warehouse">Stock by Variant</v-btn>
        </v-btn-toggle>
        <v-spacer />
        <v-chip v-if="lowStockCount > 0" color="error" size="small" prepend-icon="mdi-alert" class="font-weight-medium">
          {{ lowStockCount }} Low Stock Items
        </v-chip>
      </div>

      <!-- ════════════════════════════════════ -->
      <!-- VIEW: PRODUCTS LIST                  -->
      <!-- ════════════════════════════════════ -->
      <v-data-table
        v-if="viewMode === 'products'"
        :headers="productHeaders"
        :items="products"
        :loading="loading"
        hover
        items-per-page="20"
      >
        <!-- Product name + SKU + Barcode -->
        <template #item.name="{ item }">
          <div class="py-1">
            <div class="font-weight-medium">{{ item.name }}</div>
            <div class="d-flex align-center flex-wrap gap-2 mt-1">
              <v-chip v-if="item.sku" size="x-small" variant="tonal" color="primary" class="px-2">
                <v-icon start size="12">mdi-identifier</v-icon>{{ item.sku }}
              </v-chip>
              <v-chip v-if="item.barcode" size="x-small" variant="tonal" color="secondary" class="px-2">
                <v-icon start size="12">mdi-barcode</v-icon>{{ item.barcode }}
              </v-chip>
              <span v-if="!item.sku && !item.barcode" class="text-caption text-grey">—</span>
            </div>
          </div>
        </template>

        <!-- Category -->
        <template #item.category="{ item }">
          <v-chip v-if="item.category" size="small" variant="tonal" color="info">
            {{ item.category.category_name }}
          </v-chip>
          <span v-else class="text-caption text-grey">—</span>
        </template>

        <!-- Price -->
        <template #item.selling_price="{ item }">
          <div class="font-weight-medium text-success">{{ formatCurrency(item.selling_price) }}</div>
          <div class="text-caption text-medium-emphasis">Cost: {{ formatCurrency(item.cost_price) }}</div>
        </template>

        <!-- Total stock (sum of all variants) -->
        <template #item.stock="{ item }">
          <div class="d-flex align-center gap-2">
            <v-chip
              :color="totalStock(item) === 0 ? 'error' : totalStock(item) <= 10 ? 'warning' : 'success'"
              size="small"
              variant="tonal"
              :prepend-icon="totalStock(item) === 0 ? 'mdi-close-circle' : totalStock(item) <= 10 ? 'mdi-alert' : 'mdi-check-circle'"
            >
              {{ totalStock(item) }} units
            </v-chip>
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ item.variants?.length || 0 }} variant(s)
          </div>
        </template>

        <!-- Status -->
        <template #item.is_active="{ item }">
          <v-chip
            :color="item.is_active ? 'success' : 'error'"
            size="small"
            variant="tonal"
            :prepend-icon="item.is_active ? 'mdi-check' : 'mdi-close'"
          >
            {{ item.is_active ? 'Active' : 'Inactive' }}
          </v-chip>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="d-flex align-center justify-end gap-1">
            <v-tooltip text="View Product Details" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon="mdi-eye" variant="text" size="small" color="secondary"
                  @click="viewProductDetail(item)" />
              </template>
            </v-tooltip>
            <v-tooltip text="View Stock Details" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon="mdi-warehouse" variant="text" size="small" color="info"
                  @click="viewStockDetail(item)" />
              </template>
            </v-tooltip>
            <v-tooltip v-if="hasPermission('products.edit')" text="Edit Product" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon="mdi-pencil" variant="text" size="small" color="primary"
                  @click="openEditDialog(item)" />
              </template>
            </v-tooltip>
            <v-tooltip v-if="hasPermission('products.delete')" text="Delete Product" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon="mdi-delete" variant="text" size="small" color="error"
                  @click="openDeleteDialog(item)" />
              </template>
            </v-tooltip>
          </div>
        </template>

        <!-- Empty state -->
        <template #no-data>
          <div class="text-center py-8">
            <v-icon size="64" color="grey-lighten-2">mdi-package-variant</v-icon>
            <div class="text-h6 text-grey mt-3">No products found</div>
            <v-btn v-if="hasPermission('products.create')" color="primary" prepend-icon="mdi-plus" class="mt-3" @click="openAddDialog">Add Product</v-btn>
          </div>
        </template>
      </v-data-table>

      <!-- ════════════════════════════════════ -->
      <!-- VIEW: STOCK BY VARIANT               -->
      <!-- ════════════════════════════════════ -->
      <v-data-table
        v-if="viewMode === 'stock'"
        :headers="variantHeaders"
        :items="allVariants"
        :loading="loading"
        hover
        items-per-page="25"
      >
        <!-- Product info -->
        <template #item.product="{ item }">
          <div class="py-1">
            <div class="font-weight-medium">{{ item._product?.name }}</div>
            <div class="text-caption text-medium-emphasis">{{ item._product?.sku }}</div>
          </div>
        </template>

        <!-- Variant details -->
        <template #item.variant_info="{ item }">
          <div class="d-flex align-center gap-2 flex-wrap py-1">
            <v-chip v-if="item.color" size="x-small" variant="tonal" color="secondary">
              <v-icon start size="10">mdi-palette</v-icon>{{ item.color }}
            </v-chip>
            <v-chip v-if="item.size" size="x-small" variant="tonal" color="primary">
              <v-icon start size="10">mdi-ruler</v-icon>{{ item.size }}
            </v-chip>
            <div class="text-caption text-medium-emphasis">{{ item.variant_sku }}</div>
          </div>
        </template>

        <!-- Stock quantity with visual bar -->
        <template #item.quantity_in_stock="{ item }">
          <div class="d-flex align-center gap-3">
            <v-chip
              :color="item.quantity_in_stock === 0 ? 'error' : item.quantity_in_stock <= item.reorder_level ? 'warning' : 'success'"
              variant="tonal"
              size="small"
              :prepend-icon="item.quantity_in_stock === 0 ? 'mdi-close-circle' : item.quantity_in_stock <= item.reorder_level ? 'mdi-alert' : 'mdi-check-circle'"
            >
              {{ item.quantity_in_stock }} units
            </v-chip>
            <v-progress-linear
              :model-value="Math.min((item.quantity_in_stock / (item.reorder_level * 5 || 100)) * 100, 100)"
              :color="item.quantity_in_stock === 0 ? 'error' : item.quantity_in_stock <= item.reorder_level ? 'warning' : 'success'"
              rounded
              height="6"
              style="width:80px"
            />
          </div>
        </template>

        <!-- Reorder level -->
        <template #item.reorder_level="{ item }">
          <span class="text-caption">{{ item.reorder_level }} units</span>
        </template>

        <!-- Stock status badge -->
        <template #item.status="{ item }">
          <v-chip
            v-if="item.quantity_in_stock === 0"
            color="error" size="small" variant="flat"
            prepend-icon="mdi-package-variant-closed-remove"
          >
            Out of Stock
          </v-chip>
          <v-chip
            v-else-if="item.quantity_in_stock <= item.reorder_level"
            color="warning" size="small" variant="flat"
            prepend-icon="mdi-alert"
          >
            Low Stock
          </v-chip>
          <v-chip
            v-else
            color="success" size="small" variant="tonal"
            prepend-icon="mdi-check-circle"
          >
            In Stock
          </v-chip>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <v-btn
            v-if="hasPermission('imports.create')"
            size="small"
            color="success"
            variant="tonal"
            class="text-none font-weight-medium"
            prepend-icon="mdi-package-down"
            :to="`/imports?product_id=${item._product?.id}&variant_id=${item.id}`"
          >
            Import
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- ══════════════ PRODUCT DETAIL DIALOG ══════════════ -->
    <v-dialog v-model="detailDialog" max-width="600" scrollable>
      <v-card rounded="xl" v-if="selectedProduct" class="border bg-white" max-height="90vh">
        <!-- Top Banner / Header Profile -->
        <div class="position-relative pb-4" style="background: linear-gradient(135deg, rgba(var(--v-theme-primary), .08), rgba(var(--v-theme-secondary), .08));">
          <v-btn icon="mdi-close" variant="text" size="small" @click="detailDialog = false" class="position-absolute right-0 top-0 ma-2 text-grey-darken-1" />
          
          <div class="d-flex flex-column align-center pt-8 px-6 text-center">
            <v-avatar size="90" color="white" class="elevation-2 mb-4 border-sm" style="border-color: rgba(var(--v-theme-primary), .2) !important;">
              <v-icon size="45" color="primary">mdi-package-variant</v-icon>
            </v-avatar>
            <div class="text-h5 font-weight-black mb-1 text-grey-darken-3">{{ selectedProduct.name }}</div>
            <div class="d-flex align-center gap-2 mt-1">
              <v-chip size="small" color="primary" variant="flat" class="font-weight-medium px-3">
                {{ selectedProduct.category?.category_name || 'Uncategorized' }}
              </v-chip>
              <v-chip :color="selectedProduct.is_active ? 'success' : 'error'" size="small" variant="tonal" class="px-3 font-weight-medium">
                <v-icon start size="14">{{ selectedProduct.is_active ? 'mdi-check-circle' : 'mdi-close-circle' }}</v-icon>
                {{ selectedProduct.is_active ? 'Active' : 'Inactive' }}
              </v-chip>
            </div>
          </div>
        </div>

        <v-card-text class="pa-6 pt-2">
          <!-- Quick Stats Grid -->
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-card variant="flat" color="blue-lighten-5" rounded="lg" class="pa-4 d-flex align-center h-100 border-sm border-blue-lighten-4">
                <v-avatar color="blue-lighten-4" size="44" class="me-3">
                  <v-icon color="primary" size="24">mdi-identifier</v-icon>
                </v-avatar>
                <div>
                  <div class="text-caption font-weight-medium text-uppercase text-blue-darken-2" style="letter-spacing: 0.5px;">SKU</div>
                  <div class="font-weight-bold text-body-1 text-grey-darken-4">{{ selectedProduct.sku || '—' }}</div>
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6">
              <v-card variant="flat" color="purple-lighten-5" rounded="lg" class="pa-4 d-flex align-center h-100 border-sm border-purple-lighten-4">
                <v-avatar color="purple-lighten-4" size="44" class="me-3">
                  <v-icon color="secondary" size="24">mdi-barcode</v-icon>
                </v-avatar>
                <div>
                  <div class="text-caption font-weight-medium text-uppercase text-purple-darken-2" style="letter-spacing: 0.5px;">Barcode</div>
                  <div class="font-weight-bold text-body-1 text-grey-darken-4">{{ selectedProduct.barcode || '—' }}</div>
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6">
              <v-card variant="flat" color="green-lighten-5" rounded="lg" class="pa-4 d-flex align-center h-100 border-sm border-green-lighten-4 mt-2">
                <v-avatar color="green-lighten-4" size="48" class="me-3">
                  <v-icon color="success" size="24">mdi-cash-plus</v-icon>
                </v-avatar>
                <div>
                  <div class="text-caption font-weight-bold text-uppercase text-green-darken-2" style="letter-spacing: 0.5px;">Selling Price</div>
                  <div class="font-weight-black text-h6 text-success">{{ formatCurrency(selectedProduct.selling_price) }}</div>
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6">
              <v-card variant="flat" color="orange-lighten-5" rounded="lg" class="pa-4 d-flex align-center h-100 border-sm border-orange-lighten-4 mt-2">
                <v-avatar color="orange-lighten-4" size="48" class="me-3">
                  <v-icon color="warning" size="24">mdi-cash-minus</v-icon>
                </v-avatar>
                <div>
                  <div class="text-caption font-weight-bold text-uppercase text-orange-darken-2" style="letter-spacing: 0.5px;">Cost Price</div>
                  <div class="font-weight-bold text-h6 text-warning">{{ formatCurrency(selectedProduct.cost_price) }}</div>
                </div>
              </v-card>
            </v-col>
          </v-row>

          <!-- Description Section -->
          <div v-if="selectedProduct.description" class="mt-6">
            <div class="text-caption text-uppercase font-weight-bold text-primary mb-2 ps-1" style="letter-spacing: 1px;">
              <v-icon size="14" class="me-1 pb-1">mdi-text</v-icon> Description
            </div>
            <v-card variant="flat" color="grey-lighten-4" rounded="lg" class="pa-4 border-sm border-grey-lighten-2 shadow-sm">
              <div class="text-body-2 text-grey-darken-3" style="line-height: 1.7; white-space: pre-wrap;">{{ selectedProduct.description }}</div>
            </v-card>
          </div>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4 bg-grey-lighten-5 d-flex justify-end gap-2">
          <v-btn @click="detailDialog = false" variant="text" color="grey-darken-2" class="font-weight-medium px-4 text-none">Close</v-btn>
          <v-btn v-if="hasPermission('products.edit')" color="primary" variant="elevated" prepend-icon="mdi-pencil" @click="detailDialog = false; openEditDialog(selectedProduct)" class="font-weight-bold px-6 text-none rounded-pill" elevation="2">
            Edit Product
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ══════════════ STOCK DETAIL DIALOG ══════════════ -->
    <v-dialog v-model="stockDetailDialog" max-width="600">
      <v-card rounded="lg" v-if="selectedProduct">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-warehouse" class="me-2" color="primary" />
          Stock Details — {{ selectedProduct.name }}
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-row dense class="mb-4">
            <v-col>
              <v-card variant="tonal" color="success" rounded="lg" class="text-center pa-3">
                <div class="text-h5 font-weight-bold">{{ totalStock(selectedProduct) }}</div>
                <div class="text-caption">Total Units</div>
              </v-card>
            </v-col>
            <v-col>
              <v-card variant="tonal" color="info" rounded="lg" class="text-center pa-3">
                <div class="text-h5 font-weight-bold">{{ selectedProduct.variants?.length || 0 }}</div>
                <div class="text-caption">Variants</div>
              </v-card>
            </v-col>
            <v-col>
              <v-card variant="tonal" color="warning" rounded="lg" class="text-center pa-3">
                <div class="text-h5 font-weight-bold">
                  {{ selectedProduct.variants?.filter(v => v.quantity_in_stock <= v.reorder_level).length || 0 }}
                </div>
                <div class="text-caption">Low/Out of Stock</div>
              </v-card>
            </v-col>
          </v-row>

          <v-list lines="two">
            <v-list-item
              v-for="v in selectedProduct.variants"
              :key="v.id"
              rounded="lg"
              class="mb-2"
              :class="v.quantity_in_stock === 0 ? 'bg-error-lighten-5' : v.quantity_in_stock <= v.reorder_level ? 'bg-warning-lighten-5' : ''"
            >
              <template #prepend>
                <v-avatar
                  :color="v.quantity_in_stock === 0 ? 'error' : v.quantity_in_stock <= v.reorder_level ? 'warning' : 'success'"
                  variant="tonal"
                  size="40"
                >
                  <v-icon>mdi-package-variant</v-icon>
                </v-avatar>
              </template>
              <template #title>
                <span class="font-weight-medium">
                  {{ [v.color, v.size].filter(Boolean).join(' / ') || 'Default' }}
                </span>
              </template>
              <template #subtitle>
                <span class="text-caption">{{ v.variant_sku }}</span>
              </template>
              <template #append>
                <div class="text-right">
                  <div class="font-weight-bold text-h6" :class="v.quantity_in_stock === 0 ? 'text-error' : v.quantity_in_stock <= v.reorder_level ? 'text-warning' : 'text-success'">
                    {{ v.quantity_in_stock }}
                  </div>
                  <div class="text-caption text-medium-emphasis">/ {{ v.reorder_level }} reorder</div>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn @click="stockDetailDialog = false">Close</v-btn>
          <v-btn v-if="hasPermission('imports.create')" color="success" prepend-icon="mdi-package-down" variant="elevated" :to="`/imports?product_id=${selectedProduct.id}`">
            Record Stock Import
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ══════════════ ADD / EDIT DIALOG ══════════════ -->
    <v-dialog v-model="formDialog" max-width="640" persistent>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon :icon="isEditing ? 'mdi-pencil' : 'mdi-plus'" class="me-2" color="primary" />
          {{ isEditing ? 'Edit Product' : 'Add Product' }}
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-form ref="formRef">
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  v-model="form.name"
                  label="Product Name *"
                  prepend-inner-icon="mdi-package-variant"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Name is required']"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.sku"
                  label="SKU"
                  prepend-inner-icon="mdi-identifier"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.barcode"
                  label="Barcode"
                  prepend-inner-icon="mdi-barcode"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="form.category_id"
                  :items="categories"
                  item-title="category_name"
                  item-value="id"
                  label="Category"
                  prepend-inner-icon="mdi-format-list-bulleted"
                  variant="outlined"
                  density="comfortable"
                  clearable
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="form.supplier_id"
                  :items="suppliers"
                  item-title="name"
                  item-value="id"
                  label="Supplier"
                  prepend-inner-icon="mdi-truck-supplier"
                  variant="outlined"
                  density="comfortable"
                  clearable
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="form.cost_price"
                  label="Cost Price"
                  prepend-inner-icon="mdi-cash-minus"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                  prefix="LAK"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="form.selling_price"
                  label="Selling Price *"
                  prepend-inner-icon="mdi-cash-plus"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                  prefix="LAK"
                  :rules="[v => !!v || 'Selling price is required']"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="form.description"
                  label="Description"
                  prepend-inner-icon="mdi-text"
                  variant="outlined"
                  density="comfortable"
                  rows="2"
                  auto-grow
                />
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="form.is_active"
                  label="Active (visible in POS & store)"
                  color="success"
                  inset
                  hide-details
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="closeFormDialog" :disabled="saving">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" :loading="saving" @click="submitForm">
            {{ isEditing ? 'Save Changes' : 'Add Product' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ══════ DELETE DIALOG ══════ -->
    <v-dialog v-model="deleteDialog" max-width="400" persistent>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-alert-circle-outline" color="error" class="me-2" />
          Confirm Delete
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          Delete <strong>{{ selectedProduct?.name }}</strong>? This action cannot be undone.
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false" :disabled="deleting">Cancel</v-btn>
          <v-btn color="error" variant="elevated" :loading="deleting" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { showToast } from '~/composables/useToast'

const api = useApi()
const { hasPermission } = usePermissions()

// ── State ──────────────────────────────────────────────
const products       = ref([])
const categories     = ref([])
const suppliers      = ref([])
const loading        = ref(false)
const search         = ref('')
const filterCategory = ref(null)
const viewMode       = ref('products')

// Detail dialogs
const detailDialog      = ref(false)
const stockDetailDialog = ref(false)
const selectedProduct   = ref(null)

// Form dialog
const formDialog = ref(false)
const isEditing  = ref(false)
const saving     = ref(false)
const formRef    = ref(null)
const editingId  = ref(null)
const form       = ref(emptyForm())

// Delete dialog
const deleteDialog = ref(false)
const deleting     = ref(false)

// ── Table Headers ──────────────────────────────────────
const productHeaders = [
  { title: 'Product',    key: 'name',          minWidth: 200 },
  { title: 'Category',   key: 'category',      sortable: false },
  { title: 'Price',      key: 'selling_price',  minWidth: 130 },
  { title: 'Stock',      key: 'stock',          sortable: false, minWidth: 160 },
  { title: 'Status',     key: 'is_active',      sortable: false },
  { title: 'Actions',    key: 'actions',        sortable: false, align: 'end' }
]

const variantHeaders = [
  { title: 'Product',      key: 'product',          sortable: false, minWidth: 180 },
  { title: 'Variant',      key: 'variant_info',     sortable: false, minWidth: 180 },
  { title: 'In Stock',     key: 'quantity_in_stock', minWidth: 200 },
  { title: 'Reorder At',   key: 'reorder_level',     sortable: false },
  { title: 'Status',       key: 'status',            sortable: false },
  { title: 'Actions',      key: 'actions',           sortable: false, align: 'end' }
]

// ── Computed ───────────────────────────────────────────
const allVariants = computed(() => {
  return products.value.flatMap(p =>
    (p.variants || []).map(v => ({ ...v, _product: p }))
  )
})

const totalStock = (product) =>
  (product.variants || []).reduce((sum, v) => sum + (v.quantity_in_stock || 0), 0)

const totalAllStock = computed(() =>
  products.value.reduce((sum, p) => sum + totalStock(p), 0)
)

const lowStockCount = computed(() =>
  allVariants.value.filter(v => v.quantity_in_stock > 0 && v.quantity_in_stock <= v.reorder_level).length
)

const outOfStockCount = computed(() =>
  allVariants.value.filter(v => v.quantity_in_stock === 0).length
)

const stockStats = computed(() => [
  { label: 'Total Products',    value: products.value.length,    icon: 'mdi-package-variant-closed', color: 'primary' },
  { label: 'Total Variants',    value: allVariants.value.length, icon: 'mdi-layers',                 color: 'secondary' },
  { label: 'Units in Stock',    value: totalAllStock.value,      icon: 'mdi-warehouse',              color: 'success' },
  { label: 'Low Stock Alerts',  value: lowStockCount.value,      icon: 'mdi-alert',                  color: 'warning' },
  { label: 'Out of Stock',      value: outOfStockCount.value,    icon: 'mdi-close-circle',           color: 'error' }
])

// ── Helpers ────────────────────────────────────────────
function emptyForm () {
  return {
    name: '', sku: '', barcode: '', description: '',
    category_id: null, supplier_id: null,
    cost_price: 0, selling_price: 0, is_active: true
  }
}

const formatCurrency = (val) =>
  new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(val || 0)

const notify = (message, color = 'success') => {
  showToast(message, color)
}

let searchTimer = null
const debouncedLoad = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(loadProducts, 350)
}

// ── Data Loading ───────────────────────────────────────
const loadProducts = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({ pageSize: '500' })
    if (search.value)      params.set('search', search.value)
    if (filterCategory.value) params.set('category_id', String(filterCategory.value))

    const res = await api(`/products?${params}`)
    if (res.success) products.value = res.data
  } catch (err) {
    // Error is handled globally by useApi
  } finally {
    loading.value = false
  }
}

const loadDropdowns = async () => {
  const [catRes, suppRes] = await Promise.allSettled([
    api('/categories'),
    api('/suppliers?pageSize=200')
  ])
  if (catRes.status === 'fulfilled' && catRes.value.success)   categories.value = catRes.value.data
  if (suppRes.status === 'fulfilled' && suppRes.value.success) suppliers.value  = suppRes.value.data
}

// ── Detail Views ───────────────────────────────────────
const viewProductDetail = (product) => {
  selectedProduct.value = product
  detailDialog.value = true
}

const viewStockDetail = (product) => {
  selectedProduct.value = product
  stockDetailDialog.value = true
}

// ── CRUD ───────────────────────────────────────────────
const openAddDialog = () => {
  form.value   = emptyForm()
  isEditing.value  = false
  editingId.value  = null
  formDialog.value = true
}

const openEditDialog = (item) => {
  form.value = {
    name:          item.name          ?? '',
    sku:           item.sku           ?? '',
    barcode:       item.barcode       ?? '',
    description:   item.description   ?? '',
    category_id:   item.category_id   ?? null,
    supplier_id:   item.supplier_id   ?? null,
    cost_price:    item.cost_price    ?? 0,
    selling_price: item.selling_price ?? 0,
    is_active:     item.is_active     ?? true
  }
  isEditing.value  = true
  editingId.value  = item.id
  formDialog.value = true
}

const closeFormDialog = () => {
  formDialog.value = false
  formRef.value?.reset()
}

const submitForm = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  saving.value = true
  try {
    let res
    if (isEditing.value) {
      res = await api(`/products/${editingId.value}`, { method: 'PUT', body: form.value })
    } else {
      res = await api('/products', { method: 'POST', body: form.value })
    }

    if (res.success) {
      notify(isEditing.value ? 'Product updated' : 'Product added')
      closeFormDialog()
      loadProducts()
    }
  } catch (err) {
    // Error is handled globally by useApi
  } finally {
    saving.value = false
  }
}

const openDeleteDialog = (item) => {
  selectedProduct.value = item
  deleteDialog.value    = true
}

const confirmDelete = async () => {
  if (!selectedProduct.value) return
  deleting.value = true
  try {
    const res = await api(`/products/${selectedProduct.value.id}`, { method: 'DELETE' })
    if (res.success) {
      notify('Product deleted')
      deleteDialog.value = false
      loadProducts()
    }
  } catch (err) {
    // Error is handled globally by useApi
  } finally {
    deleting.value = false
  }
}

// ── Init ───────────────────────────────────────────────
onMounted(() => {
  loadProducts()
  loadDropdowns()
})
</script>
