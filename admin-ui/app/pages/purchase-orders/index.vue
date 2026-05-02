<template>
  <div class="po-page" v-if="hasPermission('purchase_orders.view')">

    <!-- ══ Page Header ══════════════════════════════════════════════ -->
    <div class="po-header mb-5">
      <div class="d-flex align-center flex-wrap gap-3">
        <div class="d-flex align-center gap-3">
          <div class="header-icon-wrap">
            <v-icon icon="mdi-truck-delivery-outline" size="28" color="white" />
          </div>
          <div>
            <h1 class="text-h5 font-weight-bold mb-0">ໃບສັ່ງຊື້ຈາກຜູ້ສະໜອງ</h1>
            <p class="text-caption text-medium-emphasis mb-0">ໃບສັ່ງຊື້ · ສ້າງ ແລະ ຈັດການການສັ່ງຊື້ເຂົ້າສະຕ໋ອກ</p>
          </div>
        </div>
        <v-spacer />
        <v-btn-group variant="outlined" density="comfortable" divided rounded="lg">
          <v-btn
            v-if="hasPermission('purchase_orders.create')"
            :color="activeTab === 'create' ? 'primary' : ''"
            :variant="activeTab === 'create' ? 'flat' : 'outlined'"
            prepend-icon="mdi-plus-circle-outline"
            @click="activeTab = 'create'"
          >ສ້າງໃບສັ່ງຊື້</v-btn>
          <v-btn
            :color="activeTab === 'list' ? 'primary' : ''"
            :variant="activeTab === 'list' ? 'flat' : 'outlined'"
            prepend-icon="mdi-clipboard-list-outline"
            @click="activeTab = 'list'; loadPOs()"
          >ປະຫວັດການສັ່ງຊື້</v-btn>
        </v-btn-group>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════
         TAB 1 — CREATE PURCHASE ORDER
    ══════════════════════════════════════════════════════════════ -->
    <div v-if="activeTab === 'create' && hasPermission('purchase_orders.create')">
      <v-row>

        <!-- ─── LEFT: Product Picker ─────────────────────────────── -->
        <v-col cols="12" lg="7" xl="8">
          <v-card rounded="xl" elevation="3" class="h-100">
            <v-card-title class="d-flex align-center pa-4 pb-3">
              <v-avatar color="blue-lighten-4" rounded="lg" size="36" class="me-3">
                <v-icon icon="mdi-package-variant-closed" color="blue-darken-2" size="20" />
              </v-avatar>
              <div>
                <div class="text-subtitle-1 font-weight-bold">ເລືອກສິນຄ້າ</div>
                <div class="text-caption text-medium-emphasis">ຄົ້ນຫາ ແລະ ເພີ່ມລາຍການສິນຄ້າ</div>
              </div>
              <v-spacer />
              <v-chip color="blue" variant="tonal" size="small" prepend-icon="mdi-package-variant-closed">
                {{ products.length }} ລາຍການ
              </v-chip>
            </v-card-title>

            <!-- Search / Filter bar -->
            <div class="px-4 pb-3 d-flex gap-2 flex-wrap align-center">
              <v-text-field
                v-model="productSearch"
                prepend-inner-icon="mdi-magnify"
                label="ຄົ້ນຫາຊື່ / SKU / Barcode..."
                variant="outlined"
                density="compact"
                hide-details
                clearable
                style="min-width: 220px; flex: 1"
                @update:modelValue="loadProducts"
              />
              <v-select
                v-model="categoryFilter"
                :items="categories"
                item-title="category_name"
                item-value="id"
                label="ໝວດໝູ່"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                style="min-width: 160px; max-width: 200px"
                @update:modelValue="loadProducts"
              />
            </div>
            <v-divider />

            <!-- Product list / grid -->
            <v-card-text class="pa-3 product-scroll-area">
              <div v-if="loadingProducts" class="d-flex align-center justify-center" style="height:220px">
                <v-progress-circular indeterminate color="primary" size="40" />
              </div>
              <div
                v-else-if="!products.length"
                class="d-flex flex-column align-center justify-center pa-10 text-medium-emphasis"
              >
                <v-icon icon="mdi-package-variant-closed-remove" size="60" class="mb-3 text-disabled" />
                <span class="text-body-1">ບໍ່ພົບສິນຄ້າ</span>
                <span class="text-caption">ລອງປ່ຽນຄໍາຄົ້ນຫາ</span>
              </div>

              <v-row dense v-else>
                <v-col
                  v-for="product in products"
                  :key="product.id"
                  cols="6" sm="4" md="3"
                >
                  <v-card
                    class="product-card"
                    :class="{ 'product-card--active': isInCart(product.id) }"
                    rounded="lg"
                    hover
                    @click="quickAddToCart(product)"
                  >
                    <!-- thumbnail -->
                    <v-img
                      :src="product.images?.[0]?.image_url || '/images/product-placeholder.png'"
                      height="95"
                      cover
                      class="rounded-t-lg bg-grey-lighten-4"
                    >
                      <template #error>
                        <div class="d-flex align-center justify-center h-100">
                          <v-img src="/images/product-placeholder.png" cover />
                        </div>
                      </template>
                      <!-- qty badge if already in cart -->
                      <v-badge
                        v-if="isInCart(product.id)"
                        :content="cartQty(product.id)"
                        color="primary"
                        floating
                      />
                    </v-img>

                    <v-card-text class="pa-2">
                      <div class="text-body-2 font-weight-semibold text-truncate">{{ product.name }}</div>
                      <div class="text-caption text-medium-emphasis text-truncate">
                        {{ product.sku || product.barcode || '—' }}
                      </div>
                      <div class="d-flex align-center justify-space-between mt-1">
                        <span class="text-caption text-primary font-weight-medium">
                          {{ formatCurrency(product.cost_price || product.selling_price) }}
                        </span>
                        <v-chip size="x-small" color="grey" variant="tonal">
                          {{ product.category?.category_name || '—' }}
                        </v-chip>
                      </div>
                      <div class="text-caption text-medium-emphasis mt-1">
                        ຈໍານວນ: {{ getProductStock(product) }}
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- ─── RIGHT COLUMN ──────────────────────────────────────── -->
        <v-col cols="12" lg="5" xl="4">
          <v-row>

            <!-- Supplier & PO Info Card -->
            <v-col cols="12">
              <v-card rounded="xl" elevation="3">
                <v-card-title class="d-flex align-center pa-4 pb-2">
                  <v-avatar color="orange-lighten-4" rounded="lg" size="36" class="me-3">
                    <v-icon icon="mdi-domain" color="orange-darken-2" size="20" />
                  </v-avatar>
                  <div class="text-subtitle-1 font-weight-bold">ຂໍ້ມູນໃບສັ່ງຊື້</div>
                </v-card-title>
                <v-card-text class="pa-4 pt-0">

                  <!-- Supplier -->
                  <v-autocomplete
                    v-model="selectedSupplier"
                    :items="suppliers"
                    :item-title="(s) => s.name"
                    item-value="id"
                    label="ຜູ້ສະໜອງ *"
                    prepend-inner-icon="mdi-domain"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                    :rules="[v => !!v || 'ກະລຸນາເລືອກຜູ້ສະໜອງ']"
                    return-object
                    clearable
                    class="mb-3"
                  >
                    <template #item="{ props, item }">
                      <v-list-item v-bind="props">
                        <template #prepend>
                          <v-avatar color="orange" variant="tonal" size="32">
                            <span class="text-caption font-weight-bold">
                              {{ item.raw.name?.[0]?.toUpperCase() }}
                            </span>
                          </v-avatar>
                        </template>
                        <template #subtitle>
                          {{ item.raw.contact_person || item.raw.phone || '—' }}
                        </template>
                      </v-list-item>
                    </template>
                  </v-autocomplete>

                  <!-- Supplier info chip -->
                  <v-expand-transition>
                    <div v-if="selectedSupplier" class="mb-3">
                      <v-sheet rounded="lg" color="orange-lighten-5" class="pa-3">
                        <div class="d-flex align-center gap-2 flex-wrap">
                          <v-icon icon="mdi-account-tie-outline" size="16" color="orange-darken-2" />
                          <span class="text-caption">{{ selectedSupplier.contact_person || '—' }}</span>
                          <v-divider vertical class="mx-1" />
                          <v-icon icon="mdi-phone-outline" size="16" color="orange-darken-2" />
                          <span class="text-caption">{{ selectedSupplier.phone || '—' }}</span>
                        </div>
                      </v-sheet>
                    </div>
                  </v-expand-transition>

                  <v-row dense>
                    <!-- Invoice no -->
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="invoiceNumber"
                        label="ເລກທີໃບສັ່ງຊື້"
                        prepend-inner-icon="mdi-file-document-outline"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                        placeholder="ອັດຕະໂນມັດ"
                      />
                    </v-col>
                    <!-- Receive date -->
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="receiveDate"
                        label="ວັນທີໄດ້ຮັບ"
                        type="date"
                        prepend-inner-icon="mdi-calendar-outline"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                      />
                    </v-col>
                    <!-- Import status -->
                    <v-col cols="12">
                      <v-select
                        v-model="importStatus"
                        :items="importStatusOptions"
                        label="ສະຖານະໃບສັ່ງ"
                        prepend-inner-icon="mdi-list-status"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-textarea
                        v-model="poNote"
                        label="ໝາຍເຫດ"
                        prepend-inner-icon="mdi-note-edit-outline"
                        variant="outlined"
                        density="comfortable"
                        rows="2"
                        hide-details
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Cart Card -->
            <v-col cols="12">
              <v-card rounded="xl" elevation="3">
                <v-card-title class="d-flex align-center pa-4 pb-2">
                  <v-avatar color="green-lighten-4" rounded="lg" size="36" class="me-3">
                    <v-icon icon="mdi-cart-arrow-down" color="green-darken-2" size="20" />
                  </v-avatar>
                  <div class="text-subtitle-1 font-weight-bold">ລາຍການສິນຄ້າ</div>
                  <v-spacer />
                  <v-chip v-if="cart.length" color="green" variant="tonal" size="small">
                    {{ totalItems }} ລາຍການ
                  </v-chip>
                  <v-btn
                    v-if="cart.length"
                    icon="mdi-trash-can-outline"
                    variant="text"
                    size="small"
                    color="error"
                    class="ms-1"
                    @click="clearCart"
                  />
                </v-card-title>

                <!-- Empty state -->
                <div
                  v-if="!cart.length"
                  class="d-flex flex-column align-center justify-center pa-8 text-medium-emphasis"
                >
                  <v-icon icon="mdi-cart-remove" size="48" class="mb-2 text-disabled" />
                  <span class="text-body-2">ຍັງບໍ່ມີລາຍການ</span>
                  <span class="text-caption">ກົດເລືອກສິນຄ້າຈາກດ້ານຊ້າຍ</span>
                </div>

                <!-- Cart Items -->
                <div v-else>
                  <div
                    v-for="(item, idx) in cart"
                    :key="item.uid"
                    class="cart-item px-4 py-3"
                    :class="idx !== cart.length - 1 ? 'cart-item--bordered' : ''"
                  >
                    <!-- Row 1: name + actions -->
                    <div class="d-flex align-start gap-2">
                      <v-avatar rounded="lg" size="40" class="flex-shrink-0">
                        <v-img
                          :src="item.product.images?.[0]?.image_url || '/images/product-placeholder.png'"
                          cover
                        >
                          <template #error>
                            <div class="d-flex align-center justify-center h-100 bg-grey-lighten-3">
                              <v-img src="/images/product-placeholder.png" cover />
                            </div>
                          </template>
                        </v-img>
                      </v-avatar>

                      <div class="flex-grow-1 min-w-0">
                        <div class="text-body-2 font-weight-medium text-truncate">
                          {{ item.product.name }}
                          <v-chip v-if="item.variantLabel" size="x-small" color="blue" variant="tonal" class="ms-1">
                            {{ item.variantLabel }}
                          </v-chip>
                        </div>
                        <div class="text-caption text-medium-emphasis">
                          {{ item.product.sku || item.product.barcode || '—' }}
                        </div>
                      </div>

                      <v-btn
                        icon="mdi-close"
                        size="x-small"
                        variant="text"
                        color="error"
                        density="compact"
                        @click="removeItem(idx)"
                      />
                    </div>

                    <!-- Row 2: Qty, Cost, Subtotal -->
                    <div class="d-flex align-center gap-2 mt-2">
                      <!-- Qty stepper -->
                      <div class="d-flex align-center qty-control">
                        <v-btn
                          icon="mdi-minus"
                          size="x-small"
                          variant="outlined"
                          density="compact"
                          @click="decQty(idx)"
                        />
                        <input
                          v-model.number="item.quantity"
                          type="number"
                          min="1"
                          class="qty-input"
                          @change="item.quantity = Math.max(1, item.quantity || 1)"
                        />
                        <v-btn
                          icon="mdi-plus"
                          size="x-small"
                          variant="outlined"
                          color="primary"
                          density="compact"
                          @click="item.quantity++"
                        />
                      </div>

                      <!-- Unit cost -->
                      <v-text-field
                        v-model.number="item.unit_cost"
                        label="ລາຄາ/ຊ.ຕ (ກີບ)"
                        variant="outlined"
                        density="compact"
                        type="number"
                        min="0"
                        hide-details
                        prefix="₭"
                        style="max-width: 140px"
                      />

                      <!-- Subtotal -->
                      <div class="text-right flex-grow-1">
                        <div class="text-caption text-medium-emphasis">ລວມ</div>
                        <div class="text-body-2 font-weight-bold text-primary">
                          {{ formatCurrency((item.unit_cost || 0) * item.quantity) }}
                        </div>
                      </div>
                    </div>

                    <!-- Variants (if product has variants) -->
                    <div v-if="item.product.variants?.length > 0" class="mt-2">
                      <v-select
                        v-model="item.variant_id"
                        :items="item.product.variants"
                        :item-title="(v) => `${[v.color, v.size].filter(Boolean).join('/') || 'Default'} (Stock: ${v.quantity_in_stock})`"
                        item-value="id"
                        label="ເລືອກ ລຸ້ນສິນຄ້າ"
                        variant="outlined"
                        density="compact"
                        hide-details
                        clearable
                        @update:modelValue="(id) => syncVariantLabel(item, id)"
                      />
                    </div>
                  </div>
                </div>

                <!-- Summary -->
                <div v-if="cart.length" class="pa-4 pt-2">
                  <v-divider class="mb-3" />
                  <div class="d-flex justify-space-between text-body-2 mb-1">
                    <span class="text-medium-emphasis">ຈໍານວນລາຍການ</span>
                    <span>{{ totalItems }} ລາຍການ</span>
                  </div>
                  <div class="d-flex justify-space-between font-weight-bold text-subtitle-1">
                    <span>ມູນຄ່າລວມ</span>
                    <span class="text-success">{{ formatCurrency(grandTotal) }}</span>
                  </div>
                </div>

                <!-- Submit -->
                <div class="px-4 pb-4">
                  <v-btn
                    block
                    color="success"
                    size="large"
                    rounded="lg"
                    variant="flat"
                    prepend-icon="mdi-check-circle-outline"
                    :disabled="!cart.length || !selectedSupplier"
                    :loading="submitting"
                    @click="submitPO"
                  >
                    <span v-if="!selectedSupplier">ກະລຸນາເລືອກຜູ້ສະໜອງກ່ອນ</span>
                    <span v-else>ຢືນຢັນໃບສັ່ງຊື້</span>
                  </v-btn>
                </div>
              </v-card>
            </v-col>

          </v-row>
        </v-col>
      </v-row>
    </div>

    <!-- ══════════════════════════════════════════════════════════════
         TAB 2 — PURCHASE ORDER LIST
    ══════════════════════════════════════════════════════════════ -->
    <div v-else>
      <v-card rounded="xl" elevation="3">
        <!-- Header -->
        <v-card-title class="d-flex align-center py-3 px-4 flex-wrap gap-2">
          <v-icon icon="mdi-clipboard-text-outline" color="primary" class="me-2" />
          <span class="text-subtitle-1 font-weight-bold">ປະຫວັດການສັ່ງຊື້ຈາກຜູ້ສະໜອງ</span>
          <v-spacer />

          <!-- Filters -->
          <v-text-field
            v-model="listSearch"
            prepend-inner-icon="mdi-magnify"
            label="ຄົ້ນຫາ..."
            variant="outlined"
            density="compact"
            hide-details
            clearable
            style="max-width: 200px"
            @update:modelValue="loadPOs"
          />
          <v-select
            v-model="listStatusFilter"
            :items="importStatusOptions"
            label="ສະຖານະ"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            style="max-width: 150px"
            @update:modelValue="loadPOs"
          />
          <v-select
            v-model="listSupplierFilter"
            :items="suppliers"
            item-title="name"
            item-value="id"
            label="ຜູ້ສະໜອງ"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            style="max-width: 180px"
            @update:modelValue="loadPOs"
          />
          <v-btn color="primary" variant="tonal" icon="mdi-refresh" @click="loadPOs">
            <v-icon>mdi-refresh</v-icon>
            <v-tooltip activator="parent">ໂຫຼດໃໝ່</v-tooltip>
          </v-btn>
        </v-card-title>

        <!-- Stats summary chips -->
        <div class="d-flex gap-3 overflow-x-auto px-4 py-2">
          <v-chip
            v-for="stat in listStats"
            :key="stat.label"
            :color="stat.color"
            variant="tonal"
            size="small"
            class="font-weight-medium"
          >
            <v-icon :icon="stat.icon" start size="14" />
            {{ stat.label }}: {{ stat.count }}
          </v-chip>
          <v-chip color="grey" variant="tonal" size="small" class="font-weight-medium ms-auto">
            <v-icon icon="mdi-cash" start size="14" />
            ລວມທັງໝົດ: {{ formatCurrency(listTotal) }}
          </v-chip>
        </div>
        <v-divider />

        <!-- Data table -->
        <v-data-table
          :headers="listHeaders"
          :items="purchaseOrders"
          :loading="loadingPOs"
          hover
          items-per-page="15"
        >
          <!-- Supplier -->
          <template #item.supplier="{ item }">
            <div v-if="item.supplier" class="d-flex align-center gap-2">
              <v-avatar color="orange" variant="tonal" size="30">
                <span class="text-caption font-weight-bold" style="font-size:11px">
                  {{ item.supplier.name?.[0]?.toUpperCase() }}
                </span>
              </v-avatar>
              <span class="text-body-2">{{ item.supplier.name }}</span>
            </div>
            <span v-else class="text-medium-emphasis text-caption">—</span>
          </template>

          <!-- Order date -->
          <template #item.order_date="{ item }">
            <span class="text-body-2">{{ item.order_date ? formatDateOnly(item.order_date) : '—' }}</span>
          </template>

          <!-- Total amount -->
          <template #item.total_amount="{ item }">
            <span class="font-weight-bold text-success">{{ formatCurrency(item.total_amount) }}</span>
          </template>

          <!-- Status -->
          <template #item.status="{ item }">
            <v-chip
              :color="importStatusColor(item.status)"
              size="small"
              variant="tonal"
            >
              <v-icon :icon="importStatusIcon(item.status)" start size="12" />
              {{ importStatusLabel(item.status) }}
            </v-chip>
          </template>

          <!-- Actions -->
          <template #item.actions="{ item }">
            <div class="d-flex gap-1 justify-end">
              <v-btn icon size="small" variant="text" color="primary" @click="openDetail(item)">
                <v-icon size="18">mdi-eye-outline</v-icon>
                <v-tooltip activator="parent">ລາຍລະອຽດ</v-tooltip>
              </v-btn>

              <!-- Advance status buttons -->
              <template v-if="hasPermission('purchase_orders.approve')" v-for="action in allowedActions(item)" :key="action.status">
                <v-btn icon size="small" variant="text" :color="action.color"
                  :loading="updatingId === item.id && updatingStatus === action.status"
                  @click="changeStatus(item, action.status)"
                >
                  <v-icon size="18">{{ action.icon }}</v-icon>
                  <v-tooltip activator="parent">{{ action.label }}</v-tooltip>
                </v-btn>
              </template>

              <!-- Direct to Import (received status only) -->
              <v-btn
                v-if="item.status === 'received' && hasPermission('imports.view')"
                icon size="small" variant="text" color="success"
                @click="goToImport(item)"
              >
                <v-icon size="18">mdi-arrow-right-bold-box-outline</v-icon>
                <v-tooltip activator="parent">ນໍາເຂົ້າສິນຄ້າ</v-tooltip>
              </v-btn>

              <!-- Delete (draft / cancelled only) -->
              <v-btn
                v-if="['draft','cancelled'].includes(item.status) && hasPermission('purchase_orders.create')"
                icon size="small" variant="text" color="error"
                @click="openDeleteConfirm(item)"
              >
                <v-icon size="18">mdi-delete-outline</v-icon>
                <v-tooltip activator="parent">ລົບ</v-tooltip>
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </div>

    <!-- ══ DETAIL DIALOG ════════════════════════════════════════════ -->
    <v-dialog v-model="detailDialog" max-width="780" scrollable>
      <v-card v-if="detailPO" rounded="xl">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-file-document-multiple-outline" color="primary" class="me-2" />
          ໃບສັ່ງຊື້ #{{ detailPO.po_number }}
          <v-spacer />
          <v-chip :color="importStatusColor(detailPO.status)" variant="tonal" size="small">
            {{ importStatusLabel(detailPO.status) }}
          </v-chip>
        </v-card-title>
        <v-divider />

        <v-card-text class="pa-4">
          <!-- Meta info -->
          <v-row dense class="mb-3">
            <v-col cols="6" sm="4">
              <div class="detail-label">ຜູ້ສະໜອງ</div>
              <div class="detail-value">{{ detailPO.supplier?.name || '—' }}</div>
            </v-col>
            <v-col cols="6" sm="4">
              <div class="detail-label">ວັນທີສັ່ງສິນຄ້າ</div>
              <div class="detail-value">{{ formatDateOnly(detailPO.order_date) }}</div>
            </v-col>
            <v-col cols="6" sm="4">
              <div class="detail-label">ມູນຄ່ານວມ</div>
              <div class="detail-value font-weight-bold text-success text-h6">
                {{ formatCurrency(detailPO.total_amount) }}
              </div>
            </v-col>
          </v-row>

          <!-- Item details table -->
          <v-divider class="mb-3" />
          <div class="text-subtitle-2 font-weight-bold mb-2">ລາຍການສິນຄ້າ</div>

          <v-table density="compact" class="rounded-lg border">
            <thead>
              <tr class="bg-grey-lighten-4">
                <th>#</th>
                <th>ສິນຄ້າ</th>
                <th>Variant</th>
                <th class="text-right">ຈໍານວນ</th>
                <th class="text-right">ລາຄາ/ຊ.ຕ</th>
                <th class="text-right">ລວມ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="detailPO.details?.length" v-for="(d, i) in detailPO.details" :key="d.id">
                <td class="text-caption text-medium-emphasis">{{ i + 1 }}</td>
                <td>
                  <div class="text-body-2 font-weight-medium">{{ d.product?.name || '—' }}</div>
                  <div class="text-caption text-medium-emphasis">{{ d.product?.sku || d.product?.barcode }}</div>
                </td>
                <td class="text-caption">{{ d.variant ? `${d.variant.color || ''} ${d.variant.size || ''}`.trim() || '—' : '—' }}</td>
                <td class="text-right text-body-2">{{ d.quantity_ordered }}</td>
                <td class="text-right text-body-2">{{ formatCurrency(d.unit_cost) }}</td>
                <td class="text-right text-body-2 font-weight-bold text-success">{{ formatCurrency(d.subtotal) }}</td>
              </tr>
              <tr v-else>
                <td colspan="6" class="text-center text-medium-emphasis pa-4">ບໍ່ມີລາຍການ</td>
              </tr>
            </tbody>
          </v-table>

          <!-- Status advance actions -->
          <v-divider class="my-3" />
          <div class="d-flex flex-column gap-3">
            <div class="d-flex align-center gap-2 flex-wrap">
              <span class="text-body-2 font-weight-medium">ປ່ຽນສະຖານະ:</span>
              <v-btn
                v-if="hasPermission('purchase_orders.approve')"
                v-for="action in allowedActions(detailPO)"
                :key="action.status"
                :color="action.color"
                size="small"
                variant="tonal"
                :prepend-icon="action.icon"
                :loading="updatingId === detailPO.id && updatingStatus === action.status"
                @click="changeStatus(detailPO, action.status)"
              >{{ action.label }}</v-btn>
              <span v-if="!allowedActions(detailPO).length" class="text-caption text-medium-emphasis">
                ບໍ່ສາມາດປ່ຽນສະຖານະໄດ້
              </span>
            </div>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-btn variant="tonal" color="primary" prepend-icon="mdi-printer" @click="printPO(detailPO.id)">ພິມໃບສັ່ງຊື້</v-btn>
          <v-spacer />
          <v-btn variant="text" @click="detailDialog = false">ປິດ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ══ STATUS CONFIRM DIALOG ════════════════════════════════════ -->
    <v-dialog v-model="statusDialog" max-width="400" persistent>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-help-circle-outline" color="primary" class="me-2" />
          ຢືນຢັນການປ່ຽນສະຖານະ
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          ທ່ານຕ້ອງການປ່ຽນສະຖານະໃບສັ່ງຊື້ 
          <strong>#{{ statusTarget?.po_number || statusTarget?.id }}</strong>
          ເປັນ <strong>{{ importStatusLabel(statusNew) }}</strong> ແທ້ບໍ?
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="statusDialog = false" :disabled="updatingStatusFlag">ຍົກເລີກ</v-btn>
          <v-btn color="primary" variant="flat" :loading="updatingStatusFlag" @click="confirmChangeStatus">ຢືນຢັນ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ══ DELETE CONFIRM DIALOG ════════════════════════════════════ -->
    <v-dialog v-model="deleteDialog" max-width="400" persistent>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-alert-circle-outline" color="error" class="me-2" />
          ຢືນຢັນການລົບ
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          ທ່ານຕ້ອງການລົບໃບສັ່ງຊື້
          <strong>#{{ deleteTarget?.po_number || deleteTarget?.id }}</strong> ແທ້ບໍ?
          <br />ການກະທໍານີ້ບໍ່ສາມາດຍ້ອນຄືນໄດ້.
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false" :disabled="deleting">ຍົກເລີກ</v-btn>
          <v-btn color="error" variant="flat" :loading="deleting" @click="confirmDelete">ລົບ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ══ SUCCESS DIALOG ═══════════════════════════════════════════ -->
    <v-dialog v-model="successDialog" max-width="440" persistent>
      <v-card rounded="xl" class="text-center pa-2">
        <v-card-text class="pa-6">
          <div class="success-anim mb-3">
            <v-icon icon="mdi-check-decagram" color="success" size="84" />
          </div>
          <h2 class="text-h5 font-weight-bold mb-1">ສ້າງໃບສັ່ງຊື້ສໍາເລັດ!</h2>
          <p class="text-body-2 text-medium-emphasis mb-3">
            ໃບສັ່ງຊື້ <strong>#{{ createdPO?.po_number }}</strong> ຖືກບັນທຶກສໍາເລັດ
          </p>
          <v-row dense class="mb-1">
            <v-col cols="6">
              <v-sheet rounded="lg" color="green-lighten-5" class="pa-2">
                <div class="text-caption text-medium-emphasis">ຜູ້ສະໜອງ</div>
                <div class="text-body-2 font-weight-bold">{{ createdPO?.supplier?.name || selectedSupplier?.name }}</div>
              </v-sheet>
            </v-col>
            <v-col cols="6">
              <v-sheet rounded="lg" color="green-lighten-5" class="pa-2">
                <div class="text-caption text-medium-emphasis">ມູນຄ່າລວມ</div>
                <div class="text-body-2 font-weight-bold text-success">{{ formatCurrency(createdPO?.total_amount) }}</div>
              </v-sheet>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0 d-flex flex-column gap-2">
          <v-btn block variant="flat" color="info" size="large" @click="printPO(createdPO?.id)">
            <v-icon start>mdi-printer</v-icon>ພິມບິນ (ພິມບິນ)
          </v-btn>
          <div class="d-flex gap-2 w-100">
            <v-btn flex="1 1 auto" variant="tonal" color="primary" @click="successDialog = false; activeTab = 'list'; loadPOs()">
              <v-icon start>mdi-clipboard-list-outline</v-icon>ເບິ່ງລາຍການ
            </v-btn>
            <v-btn flex="1 1 auto" variant="tonal" color="success" @click="successDialog = false; resetForm()">
              <v-icon start>mdi-plus</v-icon>ສ້າງໃໝ່
            </v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const api = useApi()
const router = useRouter()
const { hasPermission } = usePermissions()
const { showToast } = useApi()

// ── STATE ──────────────────────────────────────────
const activeTab = ref('list')
const submitting = ref(false)
const loadingPOs = ref(false)
const purchaseOrders = ref([])
const listStats = ref([])
const listTotal = ref(0)

const suppliers = ref([])
const categories = ref([])
const products = ref([])
const loadingProducts = ref(false)

const productSearch = ref('')
const categoryFilter = ref(null)

const listSearch = ref('')
const listStatusFilter = ref(null)
const listSupplierFilter = ref(null)

// Form state
const selectedSupplier = ref(null)
const invoiceNumber = ref('')
const receiveDate = ref(new Date().toISOString().split('T')[0])
const importStatus = ref('draft')
const poNote = ref('')
const cart = ref([])

// Dialogs
const detailDialog = ref(false)
const detailPO = ref(null)
const statusDialog = ref(false)
const statusTarget = ref(null)
const statusNew = ref('')
const updatingStatusFlag = ref(false)
const updatingId = ref(null)
const updatingStatus = ref(null)

const deleteDialog = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)

const successDialog = ref(false)
const createdPO = ref(null)

// ── CONSTANTS ──────────────────────────────────────
const importStatusOptions = [
  { title: 'ຮ່າງ (Draft)', value: 'draft' },
  { title: 'ສັ່ງແລ້ວ (Sent)', value: 'sent' },
  { title: 'ໄດ້ຮັບແລ້ວ (Received)', value: 'received' },
  { title: 'ສໍາເລັດ (Completed)', value: 'completed' },
  { title: 'ຍົກເລີກ (Cancelled)', value: 'cancelled' }
]

const listHeaders = [
  { title: 'ເລກທີ PO', key: 'po_number' },
  { title: 'ຜູ້ສະໜອງ', key: 'supplier', sortable: false },
  { title: 'ວັນທີສັ່ງ', key: 'order_date' },
  { title: 'ຍອດລວມ', key: 'total_amount' },
  { title: 'ສະຖານະ', key: 'status' },
  { title: 'ຈັດການ', key: 'actions', sortable: false, align: 'end' }
]

// ── COMPUTED ───────────────────────────────────────
const totalItems = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0))
const grandTotal = computed(() => cart.value.reduce((sum, item) => sum + (item.unit_cost * item.quantity), 0))

// ── METHODS ────────────────────────────────────────
const loadPOs = async () => {
  loadingPOs.value = true
  try {
    const params = new URLSearchParams({ pageSize: 100 })
    if (listSearch.value) params.set('search', listSearch.value)
    if (listStatusFilter.value) params.set('status', listStatusFilter.value)
    if (listSupplierFilter.value) params.set('supplier_id', listSupplierFilter.value)

    const res = await api(`/purchase-orders?${params}`)
    if (res.success) {
      purchaseOrders.value = res.data
      calculateStats(res.data)
    }
  } catch (err) {
    showToast('Failed to load purchase orders', 'error')
  } finally {
    loadingPOs.value = false
  }
}

const calculateStats = (data) => {
  const stats = [
    { label: 'ທັງໝົດ', icon: 'mdi-file-document-outline', color: 'primary', count: data.length },
    { label: 'ຮ່າງ', icon: 'mdi-file-edit-outline', color: 'grey', count: data.filter(i => i.status === 'draft').length },
    { label: 'ສັ່ງແລ້ວ', icon: 'mdi-send-outline', color: 'info', count: data.filter(i => i.status === 'sent').length },
    { label: 'ໄດ້ຮັບແລ້ວ', icon: 'mdi-package-variant-closed', color: 'blue', count: data.filter(i => i.status === 'received').length }
  ]
  listStats.value = stats
  listTotal.value = data.reduce((sum, i) => sum + Number(i.total_amount), 0)
}

const loadSuppliers = async () => {
  try {
    const res = await api('/suppliers?pageSize=1000')
    if (res.success) suppliers.value = res.data
  } catch (err) {}
}

const loadCategories = async () => {
  try {
    const res = await api('/categories?pageSize=1000')
    if (res.success) categories.value = res.data
  } catch (err) {}
}

const loadProducts = async () => {
  loadingProducts.value = true
  try {
    const params = new URLSearchParams({ pageSize: 200 })
    if (productSearch.value) params.set('search', productSearch.value)
    if (categoryFilter.value) params.set('category_id', categoryFilter.value)
    const res = await api(`/products?${params}`)
    if (res.success) products.value = res.data
  } catch (err) {}
  finally { loadingProducts.value = false }
}

// Cart logic
const quickAddToCart = (product) => {
  const uid = `p-${product.id}`
  const existing = cart.value.find(i => i.uid === uid)
  if (existing) {
    existing.quantity++
  } else {
    cart.value.push({
      uid,
      product_id: product.id,
      product,
      quantity: 1,
      unit_cost: product.cost_price || 0,
      variant_id: null,
      variantLabel: ''
    })
  }
}

const isInCart = (id) => cart.value.some(i => i.product_id === id)
const cartQty = (id) => cart.value.find(i => i.product_id === id)?.quantity || 0
const getProductStock = (p) => {
  if (p.variants?.length) return p.variants.reduce((sum, v) => sum + (v.quantity_in_stock || 0), 0)
  return p.quantity_in_stock || 0
}

const decQty = (idx) => {
  if (cart.value[idx].quantity > 1) cart.value[idx].quantity--
  else removeItem(idx)
}
const removeItem = (idx) => cart.value.splice(idx, 1)
const clearCart = () => cart.value = []

const syncVariantLabel = (item, vId) => {
  if (!vId) {
    item.variantLabel = ''
    return
  }
  const variant = item.product.variants.find(v => v.id === vId)
  if (variant) {
    item.variantLabel = [variant.color, variant.size].filter(Boolean).join('/') || 'Default'
    item.unit_cost = variant.cost_price || item.product.cost_price || 0
  }
}

// Form Submission
const submitPO = async () => {
  if (!selectedSupplier.value || !cart.value.length) return
  submitting.value = true
  try {
    const payload = {
      supplier_id: selectedSupplier.value.id,
      po_number: invoiceNumber.value || undefined,
      order_date: receiveDate.value,
      status: importStatus.value,
      notes: poNote.value,
      items: cart.value.map(i => ({
        product_id: i.product_id,
        variant_id: i.variant_id,
        quantity_ordered: i.quantity,
        unit_cost: i.unit_cost
      }))
    }
    const res = await api('/purchase-orders', { method: 'POST', body: payload })
    if (res.success) {
      createdPO.value = res.data
      successDialog.value = true
    } else {
      showToast(res.message || 'Error creating PO', 'error')
    }
  } catch (err) {
    showToast('A server error occurred', 'error')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  selectedSupplier.value = null
  invoiceNumber.value = ''
  receiveDate.value = new Date().toISOString().split('T')[0]
  importStatus.value = 'draft'
  poNote.value = ''
  cart.value = []
  activeTab.value = 'list'
  loadPOs()
}

// Status Management
const allowedActions = (item) => {
  if (item.status === 'draft') return [
    { label: 'ຢືນຢັນການສັ່ງ', status: 'sent', icon: 'mdi-send-outline', color: 'info' },
    { label: 'ຍົກເລີກ', status: 'cancelled', icon: 'mdi-close-circle-outline', color: 'error' }
  ]
  if (item.status === 'sent') return [
    { label: 'ໄດ້ຮັບສິນຄ້າແລ້ວ', status: 'received', icon: 'mdi-package-variant-closed', color: 'blue' },
    { label: 'ຍົກເລີກ', status: 'cancelled', icon: 'mdi-close-circle-outline', color: 'error' }
  ]
  return []
}

const changeStatus = (item, newStatus) => {
  statusTarget.value = item
  statusNew.value = newStatus
  statusDialog.value = true
}

const confirmChangeStatus = async () => {
  if (!statusTarget.value) return
  updatingStatusFlag.value = true
  updatingId.value = statusTarget.value.id
  updatingStatus.value = statusNew.value
  try {
    const res = await api(`/purchase-orders/${statusTarget.value.id}/status`, {
      method: 'PUT',
      body: { status: statusNew.value }
    })
    if (res.success) {
      showToast(`Updated to ${importStatusLabel(statusNew.value)}`, 'success')
      loadPOs()
      if (detailDialog.value && detailPO.value?.id === statusTarget.value.id) {
        detailPO.value = { ...detailPO.value, status: statusNew.value }
      }
      statusDialog.value = false
    }
  } catch (err) {
    showToast('Failed to update status', 'error')
  } finally {
    updatingStatusFlag.value = false
    updatingId.value = null
    updatingStatus.value = null
  }
}

// Delete Logic
const openDeleteConfirm = (item) => {
  deleteTarget.value = item
  deleteDialog.value = true
}
const confirmDelete = async () => {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    const res = await api(`/purchase-orders/${deleteTarget.value.id}`, { method: 'DELETE' })
    if (res.success) {
      showToast('Deleted successfully', 'success')
      loadPOs()
      deleteDialog.value = false
    }
  } catch (err) {
    showToast('Failed to delete', 'error')
  } finally {
    deleting.value = false
  }
}

const openDetail = async (item) => {
  try {
    const res = await api(`/purchase-orders/${item.id}`)
    if (res.success) {
      detailPO.value = res.data
      detailDialog.value = true
    }
  } catch (err) {
    showToast('Failed to load detail', 'error')
  }
}

const goToImport = (item) => {
  router.push({ path: '/imports', query: { search: item.po_number } })
}

const printPO = (id) => {
  window.open(`/purchase-orders/print?id=${id}`, '_blank')
}

// Display helpers
const formatCurrency = (v) => v != null ? new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(v) : '—'
const formatDateOnly = (v) => v ? new Date(v).toLocaleDateString('lo-LA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const importStatusColor = (s) => ({ draft: 'grey', sent: 'info', received: 'blue', completed: 'success', cancelled: 'error' }[s] ?? 'grey')
const importStatusIcon = (s) => ({ draft: 'mdi-file-edit-outline', sent: 'mdi-send-outline', received: 'mdi-package-variant-closed', completed: 'mdi-check-circle-outline', cancelled: 'mdi-close-circle-outline' }[s] ?? 'mdi-help-circle-outline')
const importStatusLabel = (s) => ({ draft: 'ຮ່າງ', sent: 'ສັ່ງແລ້ວ', received: 'ໄດ້ຮັບແລ້ວ', completed: 'ສໍາເລັດ', cancelled: 'ຍົກເລີກ' }[s] ?? s)

onMounted(() => {
  loadPOs()
  loadSuppliers()
  loadCategories()
  loadProducts()
})
</script>

<style scoped>
.po-page { width: 100%; }
.header-icon-wrap {
  width: 48px; height: 48px;
  background: linear-gradient(135deg, #1976D2, #64B5F6);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
}
.product-scroll-area { max-height: 520px; overflow-y: auto; }
.product-card { border: 1px solid rgba(var(--v-border-color), 0.1); transition: all 0.2s ease; }
.product-card--active { border-color: rgb(var(--v-theme-primary)); background-color: rgba(var(--v-theme-primary), 0.03); }
.cart-item--bordered { border-bottom: 1px dashed rgba(var(--v-border-color), 0.2); }
.qty-control { border: 1px solid rgba(var(--v-border-color), 0.3); border-radius: 8px; padding: 2px; }
.qty-input { width: 40px; text-align: center; border: none; font-size: 13px; font-weight: bold; background: transparent; }
.qty-input:focus { outline: none; }
.detail-label { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.6); text-transform: uppercase; letter-spacing: 0.5px; }
.detail-value { font-size: 14px; font-weight: 600; }
.success-anim { animation: bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
@keyframes bounceIn {
  from { opacity: 0; transform: scale(0.3); }
  50% { opacity: 0.9; transform: scale(1.1); }
  to { opacity: 1; transform: scale(1); }
}
</style>
