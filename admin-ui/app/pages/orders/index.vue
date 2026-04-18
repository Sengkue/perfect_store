<template>
  <div class="orders-page">

    <!-- ══ Page Header ══════════════════════════════════════════════ -->
    <div class="page-header mb-4">
      <div class="d-flex align-center flex-wrap gap-3">
        <div>
          <h1 class="text-h5 font-weight-bold">ສັ່ງຊື້ສິນຄ້າ</h1>
          <p class="text-caption text-medium-emphasis mb-0">ສ້າງ ແລະ ຈັດການລາຍການສັ່ງຊື້</p>
        </div>
        <v-spacer />
        <v-btn-group variant="outlined" density="comfortable" divided>
          <v-btn
            :color="activeTab === 'create' ? 'primary' : ''"
            :variant="activeTab === 'create' ? 'flat' : 'outlined'"
            prepend-icon="mdi-plus-circle-outline"
            @click="activeTab = 'create'"
          >ສ້າງລາຍການ</v-btn>
          <v-btn
            :color="activeTab === 'list' ? 'primary' : ''"
            :variant="activeTab === 'list' ? 'flat' : 'outlined'"
            prepend-icon="mdi-format-list-bulleted"
            @click="activeTab = 'list'; loadOrders()"
          >ລາຍການສັ່ງຊື້</v-btn>
        </v-btn-group>
      </div>
    </div>

    <!-- ══ CREATE ORDER TAB ══════════════════════════════════════════ -->
    <div v-if="activeTab === 'create'">
      <v-row>

        <!-- LEFT: Product Picker ─────────────────────────── -->
        <v-col cols="12" lg="7">
          <v-card rounded="xl" elevation="2" class="h-100">
            <v-card-title class="d-flex align-center pa-4 pb-2">
              <v-icon icon="mdi-package-variant-closed" color="primary" class="me-2" />
              <span class="text-subtitle-1 font-weight-bold">ເລືອກສິນຄ້າ</span>
              <v-spacer />
              <v-chip color="primary" variant="tonal" size="small">
                {{ products.length }} ລາຍການ
              </v-chip>
            </v-card-title>

            <!-- Search & Category filter -->
            <div class="px-4 pb-3 d-flex gap-2 flex-wrap">
              <v-text-field
                v-model="productSearch"
                prepend-inner-icon="mdi-magnify"
                label="ຄົ້ນຫາສິນຄ້າ..."
                variant="outlined"
                density="compact"
                hide-details
                clearable
                style="min-width:200px; flex:1"
                @update:modelValue="loadProducts"
              />
              <v-select
                v-model="categoryFilter"
                :items="categories"
                item-title="name"
                item-value="id"
                label="ໝວດໝູ່"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                style="min-width:160px; max-width:200px"
                @update:modelValue="loadProducts"
              />
            </div>
            <v-divider />

            <!-- Product Grid -->
            <v-card-text class="pa-3 product-grid-container">
              <div v-if="loadingProducts" class="d-flex justify-center align-center" style="height:200px">
                <v-progress-circular indeterminate color="primary" />
              </div>
              <div v-else-if="!products.length" class="d-flex flex-column align-center justify-center pa-8 text-medium-emphasis">
                <v-icon icon="mdi-package-variant-closed-remove" size="56" class="mb-2" />
                <span>ບໍ່ພົບສິນຄ້າ</span>
              </div>
              <v-row dense v-else>
                <v-col
                  v-for="product in products"
                  :key="product.id"
                  cols="6" sm="4" md="4"
                >
                  <v-card
                    rounded="lg"
                    class="product-card"
                    :class="{ 'product-card--selected': isInCart(product.id) }"
                    hover
                    @click="handleProductClick(product)"
                  >
                    <!-- image -->
                    <v-img
                      :src="product.images?.[0]?.image_url || '/placeholder-product.png'"
                      height="110"
                      cover
                      class="rounded-t-lg"
                    >
                      <template #error>
                        <div class="d-flex align-center justify-center h-100 bg-grey-lighten-3">
                          <v-icon icon="mdi-image-off-outline" color="grey" size="36" />
                        </div>
                      </template>
                      <!-- cart badge -->
                      <v-badge
                        v-if="isInCart(product.id)"
                        :content="cartQuantity(product.id)"
                        color="primary"
                        floating
                      />
                      <!-- out of stock overlay -->
                      <div v-if="getStock(product) === 0" class="out-of-stock-overlay d-flex align-center justify-center">
                        <v-chip color="error" size="small" variant="flat">ໝົດສະຕ໋ອກ</v-chip>
                      </div>
                    </v-img>
                    <v-card-text class="pa-2">
                      <div class="text-body-2 font-weight-medium text-truncate">{{ product.name }}</div>
                      <div class="text-caption text-medium-emphasis text-truncate">{{ product.category?.name || '—' }}</div>
                      <div class="d-flex align-center justify-space-between mt-1">
                        <span class="text-primary font-weight-bold text-body-2">{{ formatCurrency(product.selling_price) }}</span>
                        <v-chip :color="getStock(product) > 0 ? 'success' : 'error'" size="x-small" variant="tonal">
                          {{ getStock(product) > 0 ? `${getStock(product)} ຊ.` : 'ໝົດ' }}
                        </v-chip>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- RIGHT: Cart + Order Info ──────────────────────── -->
        <v-col cols="12" lg="5">
          <v-row>

            <!-- Customer Selection -->
            <v-col cols="12">
              <v-card rounded="xl" elevation="2">
                <v-card-title class="d-flex align-center pa-4 pb-2">
                  <v-icon icon="mdi-account-circle-outline" color="indigo" class="me-2" />
                  <span class="text-subtitle-1 font-weight-bold">ຂໍ້ມູນລູກຄ້າ</span>
                </v-card-title>
                <v-card-text class="pa-4 pt-1">
                  <v-autocomplete
                    v-model="selectedCustomer"
                    :items="customers"
                    :item-title="(c) => `${c.first_name} ${c.last_name}`"
                    item-value="id"
                    label="ເລືອກລູກຄ້າ (ທາງເລືອກ)"
                    prepend-inner-icon="mdi-account-search-outline"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    clearable
                    return-object
                  >
                    <template #item="{ props, item }">
                      <v-list-item v-bind="props">
                        <template #prepend>
                          <v-avatar color="primary" size="32">
                            <span class="text-caption text-white font-weight-bold">
                              {{ item.raw.first_name?.[0] }}{{ item.raw.last_name?.[0] }}
                            </span>
                          </v-avatar>
                        </template>
                        <template #subtitle>
                          {{ item.raw.phone || item.raw.email || '—' }}
                        </template>
                      </v-list-item>
                    </template>
                  </v-autocomplete>

                  <!-- Delivery address (shown when customer selected) -->
                  <v-expand-transition>
                    <div v-if="selectedCustomer" class="mt-3">
                      <v-text-field
                        v-model="deliveryAddress"
                        label="ທີ່ຢູ່ຈັດສົ່ງ"
                        prepend-inner-icon="mdi-map-marker-outline"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                        class="mb-2"
                      />
                    </div>
                  </v-expand-transition>

                  <v-row dense class="mt-2">
                    <v-col cols="6">
                      <v-select
                        v-model="paymentMethod"
                        :items="paymentMethods"
                        label="ວິທີຊຳລະ"
                        prepend-inner-icon="mdi-credit-card-outline"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                      />
                    </v-col>
                    <v-col cols="6">
                      <v-select
                        v-model="orderType"
                        :items="orderTypes"
                        label="ປະເພດ"
                        prepend-inner-icon="mdi-tag-outline"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                      />
                    </v-col>
                  </v-row>

                  <v-textarea
                    v-model="orderNote"
                    label="ໝາຍເຫດ"
                    prepend-inner-icon="mdi-note-text-outline"
                    variant="outlined"
                    density="comfortable"
                    rows="2"
                    hide-details
                    class="mt-2"
                  />
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Cart -->
            <v-col cols="12">
              <v-card rounded="xl" elevation="2">
                <v-card-title class="d-flex align-center pa-4 pb-2">
                  <v-icon icon="mdi-cart-outline" color="deep-orange" class="me-2" />
                  <span class="text-subtitle-1 font-weight-bold">ກະຕ່າສິນຄ້າ</span>
                  <v-spacer />
                  <v-chip v-if="cart.length" color="deep-orange" variant="tonal" size="small">
                    {{ totalItems }} ຊ/ຕ
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

                <!-- Empty cart state -->
                <div v-if="!cart.length" class="d-flex flex-column align-center justify-center pa-8 text-medium-emphasis">
                  <v-icon icon="mdi-cart-off" size="48" class="mb-2 text-disabled" />
                  <span class="text-body-2">ກະຕ່າຍັງຫວ່າງ</span>
                  <span class="text-caption">ເລືອກສິນຄ້າຈາກດ້ານຊ້າຍ</span>
                </div>

                <!-- Cart Items -->
                <v-list v-else density="compact" class="px-2">
                  <v-list-item
                    v-for="(item, index) in cart"
                    :key="item.product.id"
                    :class="index !== cart.length - 1 ? 'border-b' : ''"
                    class="px-2 py-2"
                  >
                    <template #prepend>
                      <v-avatar rounded="lg" size="42" class="me-2">
                        <v-img
                          :src="item.product.images?.[0]?.image_url || '/placeholder-product.png'"
                          cover
                        >
                          <template #error>
                            <div class="d-flex align-center justify-center h-100 bg-grey-lighten-3">
                              <v-icon icon="mdi-image-off-outline" color="grey" size="18"/>
                            </div>
                          </template>
                        </v-img>
                      </v-avatar>
                    </template>

                    <v-list-item-title class="text-body-2 font-weight-medium">
                      {{ item.product.name }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="text-caption">
                      {{ formatCurrency(item.price) }} / ຊ//ຕ
                    </v-list-item-subtitle>

                    <template #append>
                      <div class="d-flex align-center gap-1">
                        <v-btn icon="mdi-minus" size="x-small" variant="outlined" density="compact" @click="decrementItem(item)" />
                        <span class="text-body-2 font-weight-bold" style="min-width:28px; text-align:center">{{ item.quantity }}</span>
                        <v-btn icon="mdi-plus" size="x-small" variant="outlined" density="compact" color="primary" @click="incrementItem(item)" />
                        <span class="text-body-2 font-weight-bold text-primary ms-2" style="min-width:80px; text-align:right">
                          {{ formatCurrency(item.price * item.quantity) }}
                        </span>
                        <v-btn icon="mdi-close" size="x-small" variant="text" color="error" density="compact" @click="removeItem(item)" />
                      </div>
                    </template>
                  </v-list-item>
                </v-list>

                <!-- Discount -->
                <div v-if="cart.length" class="px-4 pb-2 mt-1">
                  <v-text-field
                    v-model.number="discountAmount"
                    label="ສ່ວນຫຼຸດ (LAK)"
                    prepend-inner-icon="mdi-tag-minus-outline"
                    variant="outlined"
                    density="compact"
                    type="number"
                    min="0"
                    hide-details
                  />
                </div>

                <!-- Summary -->
                <div v-if="cart.length" class="px-4 pb-3">
                  <v-divider class="mb-2" />
                  <div class="d-flex justify-space-between text-body-2 mb-1">
                    <span class="text-medium-emphasis">ລວມ</span>
                    <span>{{ formatCurrency(subtotal) }}</span>
                  </div>
                  <div class="d-flex justify-space-between text-body-2 mb-1">
                    <span class="text-medium-emphasis">ພາສີ ({{ taxRate }}%)</span>
                    <span>{{ formatCurrency(taxAmount) }}</span>
                  </div>
                  <div class="d-flex justify-space-between text-body-2 mb-2">
                    <span class="text-medium-emphasis">ສ່ວນຫຼຸດ</span>
                    <span class="text-error">-{{ formatCurrency(discountAmount || 0) }}</span>
                  </div>
                  <v-divider class="mb-2" />
                  <div class="d-flex justify-space-between font-weight-bold text-h6">
                    <span>ລວມທັງໝົດ</span>
                    <span class="text-primary">{{ formatCurrency(totalAmount) }}</span>
                  </div>
                </div>

                <!-- Submit button -->
                <div class="px-4 pb-4">
                  <v-btn
                    block
                    color="primary"
                    size="large"
                    rounded="lg"
                    variant="flat"
                    prepend-icon="mdi-check-circle-outline"
                    :disabled="!cart.length"
                    :loading="submitting"
                    @click="submitOrder"
                  >
                    ຢືນຢັນລາຍການສັ່ງຊື້
                  </v-btn>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </div>

    <!-- ══ ORDERS LIST TAB ══════════════════════════════════════════ -->
    <div v-else>
      <v-card rounded="xl" elevation="2">
        <!-- Header -->
        <v-card-title class="d-flex align-center py-3 px-4 flex-wrap gap-2">
          <v-icon icon="mdi-clipboard-list-outline" color="primary" class="me-2" />
          <span class="text-subtitle-1 font-weight-bold">ລາຍການສັ່ງຊື້ທາງອອນລາຍ</span>
          <v-spacer />

          <v-text-field
            v-model="orderSearch"
            prepend-inner-icon="mdi-magnify"
            label="ຄົ້ນຫາ..."
            variant="outlined"
            density="compact"
            hide-details
            clearable
            style="max-width:220px"
            @update:modelValue="loadOrders"
          />
          <v-select
            v-model="orderStatusFilter"
            :items="orderStatusOptions"
            label="ສະຖານະ"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            style="max-width:160px"
            @update:modelValue="loadOrders"
          />
          <v-btn color="primary" variant="tonal" prepend-icon="mdi-refresh" @click="loadOrders">Refresh</v-btn>
        </v-card-title>
        <v-divider />

        <!-- Stats row -->
        <div class="d-flex gap-3 overflow-x-auto px-4 py-3">
          <v-chip
            v-for="stat in orderStats"
            :key="stat.label"
            :color="stat.color"
            variant="tonal"
            class="font-weight-medium"
          >
            <v-icon :icon="stat.icon" start />
            {{ stat.label }}: {{ stat.count }}
          </v-chip>
        </div>
        <v-divider />

        <!-- Table -->
        <v-data-table
          :headers="orderHeaders"
          :items="orders"
          :loading="loadingOrders"
          hover
          items-per-page="15"
        >
          <!-- Customer -->
          <template #item.customer="{ item }">
            <div v-if="item.customer" class="d-flex align-center gap-2">
              <v-avatar color="primary" size="28">
                <span class="text-caption text-white font-weight-bold" style="font-size:10px">
                  {{ item.customer.first_name?.[0] }}{{ item.customer.last_name?.[0] }}
                </span>
              </v-avatar>
              <span class="text-body-2">{{ item.customer.first_name }} {{ item.customer.last_name }}</span>
            </div>
            <span v-else class="text-medium-emphasis text-caption">— ບໍ່ລະບຸ</span>
          </template>

          <!-- Total -->
          <template #item.total_amount="{ item }">
            <span class="font-weight-bold text-primary">{{ formatCurrency(item.total_amount) }}</span>
          </template>

          <!-- Date -->
          <template #item.sale_date="{ item }">
            <span class="text-body-2">{{ formatDate(item.sale_date) }}</span>
          </template>

          <!-- Sale Status -->
          <template #item.sale_status="{ item }">
            <v-chip :color="statusColor(item.sale_status)" size="small" variant="tonal">
              <v-icon :icon="statusIcon(item.sale_status)" start size="12" />
              {{ statusLabel(item.sale_status) }}
            </v-chip>
          </template>

          <!-- Payment Status -->
          <template #item.payment_status="{ item }">
            <v-chip :color="paymentColor(item.payment_status)" size="small" variant="tonal">
              {{ paymentLabel(item.payment_status) }}
            </v-chip>
          </template>

          <!-- Actions -->
          <template #item.actions="{ item }">
            <div class="d-flex gap-1">
              <v-btn icon="mdi-eye-outline" variant="text" size="small" color="primary" @click="openOrderDetail(item)">
                <v-icon>mdi-eye-outline</v-icon>
                <v-tooltip activator="parent">ເບິ່ງລາຍລະອຽດ</v-tooltip>
              </v-btn>
              <v-btn
                v-if="item.sale_status === 'pending'"
                icon="mdi-check" variant="text" size="small" color="success"
                @click="updateOrderStatus(item, 'processing')"
              >
                <v-icon>mdi-check</v-icon>
                <v-tooltip activator="parent">ຮັບລາຍການ</v-tooltip>
              </v-btn>
              <v-btn
                v-if="item.sale_status === 'processing'"
                icon="mdi-truck-check-outline" variant="text" size="small" color="teal"
                @click="updateOrderStatus(item, 'completed')"
              >
                <v-icon>mdi-truck-check-outline</v-icon>
                <v-tooltip activator="parent">ຈັດສົ່ງສໍາເລັດ</v-tooltip>
              </v-btn>
              <v-btn
                v-if="['pending','processing'].includes(item.sale_status)"
                icon="mdi-close-circle-outline" variant="text" size="small" color="error"
                @click="updateOrderStatus(item, 'cancelled')"
              >
                <v-icon>mdi-close-circle-outline</v-icon>
                <v-tooltip activator="parent">ຍົກເລີກ</v-tooltip>
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </div>

    <!-- ══ VARIANT PICKER DIALOG ════════════════════════════════════ -->
    <v-dialog v-model="variantDialog" max-width="500" >
      <v-card v-if="variantProduct" rounded="xl">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-format-list-checks" color="primary" class="me-2" />
          ເລືອກຕົວເລືອກ
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <p class="text-body-1 font-weight-medium mb-3">{{ variantProduct.name }}</p>
          <v-list density="compact" rounded="lg" border>
            <v-list-item
              v-for="(variant, i) in variantProduct.variants"
              :key="variant.id"
              :title="`${variant.variant_type}: ${variant.variant_value}`"
              :subtitle="`ລາຄາ: ${formatCurrency(variant.price || variantProduct.selling_price)} · ຈໍານວນ: ${variant.quantity_in_stock}`"
              :class="i !== variantProduct.variants.length - 1 ? 'border-b' : ''"
              :disabled="variant.quantity_in_stock === 0"
              @click="addVariantToCart(variantProduct, variant)"
            >
              <template #prepend>
                <v-avatar color="primary" variant="tonal" size="36" rounded="lg">
                  <v-icon icon="mdi-tag-outline" size="18" />
                </v-avatar>
              </template>
              <template #append>
                <v-chip v-if="variant.quantity_in_stock === 0" color="error" size="x-small" variant="tonal">ໝົດ</v-chip>
                <v-icon v-else icon="mdi-chevron-right" color="grey" />
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="variantDialog = false">ປິດ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ══ ORDER DETAIL DIALOG ══════════════════════════════════════ -->
    <v-dialog v-model="detailDialog" max-width="700">
      <v-card v-if="detailOrder" rounded="xl">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-receipt-text-outline" color="primary" class="me-2" />
          ລາຍລະອຽດລາຍການ #{{ detailOrder.sale_number }}
          <v-spacer />
          <v-chip :color="statusColor(detailOrder.sale_status)" variant="tonal" size="small">
            {{ statusLabel(detailOrder.sale_status) }}
          </v-chip>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-row dense>
            <v-col cols="6">
              <div class="detail-label">ວັນທີສັ່ງ</div>
              <div class="detail-value">{{ formatDate(detailOrder.sale_date) }}</div>
            </v-col>
            <v-col cols="6">
              <div class="detail-label">ປະເພດ</div>
              <div class="detail-value">{{ detailOrder.sale_type }}</div>
            </v-col>
            <v-col cols="6">
              <div class="detail-label">ລູກຄ້າ</div>
              <div class="detail-value">
                {{ detailOrder.customer ? `${detailOrder.customer.first_name} ${detailOrder.customer.last_name}` : '—' }}
              </div>
            </v-col>
            <v-col cols="6">
              <div class="detail-label">ຊຳລະ</div>
              <div class="detail-value">
                <v-chip :color="paymentColor(detailOrder.payment_status)" size="small" variant="tonal">
                  {{ paymentLabel(detailOrder.payment_status) }}
                </v-chip>
              </div>
            </v-col>
            <v-col cols="6">
              <div class="detail-label">ຍອດລວມ</div>
              <div class="detail-value font-weight-bold text-primary">{{ formatCurrency(detailOrder.subtotal) }}</div>
            </v-col>
            <v-col cols="6">
              <div class="detail-label">ພາສີ</div>
              <div class="detail-value">{{ formatCurrency(detailOrder.tax_amount) }}</div>
            </v-col>
            <v-col cols="6">
              <div class="detail-label">ສ່ວນຫຼຸດ</div>
              <div class="detail-value text-error">-{{ formatCurrency(detailOrder.discount_amount) }}</div>
            </v-col>
            <v-col cols="6">
              <div class="detail-label">ຍອດສຸດທ້າຍ</div>
              <div class="detail-value font-weight-bold text-h6 text-primary">{{ formatCurrency(detailOrder.total_amount) }}</div>
            </v-col>
          </v-row>

          <!-- Change status -->
          <v-divider class="my-3" />
          <div class="d-flex align-center gap-2 flex-wrap">
            <span class="text-body-2 font-weight-medium">ປ່ຽນສະຖານະ:</span>
            <v-btn
              v-for="st in allowedStatusTransitions(detailOrder)"
              :key="st.value"
              :color="st.color"
              size="small"
              variant="tonal"
              :prepend-icon="st.icon"
              :loading="updatingStatus === st.value"
              @click="updateOrderStatus(detailOrder, st.value)"
            >{{ st.label }}</v-btn>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="detailDialog = false">ປິດ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ══ SUCCESS OVERLAY ══════════════════════════════════════════ -->
    <v-dialog v-model="successDialog" max-width="420" persistent>
      <v-card rounded="xl" class="text-center pa-2">
        <v-card-text class="pa-6">
          <div class="success-checkmark mb-4">
            <v-icon icon="mdi-check-circle" color="success" size="80" />
          </div>
          <h2 class="text-h5 font-weight-bold mb-1">ສ້າງລາຍການສໍາເລັດ!</h2>
          <p class="text-body-2 text-medium-emphasis mb-3">
            ລາຍການສັ່ງຊື້ <strong>#{{ createdOrder?.sale_number }}</strong> ຖືກບັນທຶກແລ້ວ
          </p>
          <v-chip color="success" variant="tonal" class="mb-4">
            ຍອດ: {{ formatCurrency(createdOrder?.total_amount) }}
          </v-chip>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0 d-flex gap-2">
          <v-btn
            block
            variant="tonal"
            color="primary"
            @click="successDialog = false; activeTab = 'list'; loadOrders()"
          >ເບິ່ງລາຍການ</v-btn>
          <v-btn
            block
            variant="flat"
            color="primary"
            @click="successDialog = false; resetOrder()"
          >ສ້າງລາຍການໃໝ່</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3500" location="bottom right">
      {{ snackbar.message }}
      <template #actions>
        <v-btn icon="mdi-close" variant="text" @click="snackbar.show = false" />
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const api = useApi()

// ── Tab ────────────────────────────────────────────────────────────
const activeTab = ref('create')

// ── Products ───────────────────────────────────────────────────────
const products        = ref([])
const categories      = ref([])
const loadingProducts = ref(false)
const productSearch   = ref('')
const categoryFilter  = ref(null)

const loadProducts = async () => {
  loadingProducts.value = true
  try {
    const params = new URLSearchParams({ pageSize: 200 })
    if (productSearch.value)  params.set('search',      productSearch.value)
    if (categoryFilter.value) params.set('category_id', categoryFilter.value)
    const res = await api(`/products?${params}`)
    if (res.success) products.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loadingProducts.value = false
  }
}

const loadCategories = async () => {
  try {
    const res = await api('/categories?pageSize=200')
    if (res.success) categories.value = res.data
  } catch (e) { console.error(e) }
}

const getStock = (p) => {
  if (p.variants?.length) return p.variants.reduce((s, v) => s + (v.quantity_in_stock || 0), 0)
  return p.quantity_in_stock ?? 0
}

// ── Cart ───────────────────────────────────────────────────────────
const cart = ref([])

const isInCart  = (id) => cart.value.some(c => c.product.id === id)
const cartQuantity = (id) => cart.value.find(c => c.product.id === id)?.quantity ?? 0

// Variant picker
const variantDialog  = ref(false)
const variantProduct = ref(null)

const handleProductClick = (product) => {
  if (getStock(product) === 0) return
  if (product.variants?.length > 1) {
    variantProduct.value = product
    variantDialog.value  = true
  } else {
    const price = product.variants?.[0]?.price || product.selling_price
    addToCartDirect(product, price)
  }
}

const addToCartDirect = (product, price) => {
  const existing = cart.value.find(c => c.product.id === product.id && !c.variantId)
  if (existing) {
    existing.quantity++
  } else {
    cart.value.push({ product, price: Number(price), quantity: 1, variantId: null })
  }
}

const addVariantToCart = (product, variant) => {
  variantDialog.value = false
  const price = Number(variant.price || product.selling_price)
  const existing = cart.value.find(c => c.variantId === variant.id)
  if (existing) {
    existing.quantity++
  } else {
    cart.value.push({ product, price, quantity: 1, variantId: variant.id, variantLabel: `${variant.variant_type}: ${variant.variant_value}` })
  }
}

const incrementItem = (item) => { item.quantity++ }
const decrementItem = (item) => {
  if (item.quantity > 1) item.quantity--
  else removeItem(item)
}
const removeItem = (item) => {
  cart.value = cart.value.filter(c => c !== item)
}
const clearCart = () => { cart.value = [] }

// ── Order Info ────────────────────────────────────────────────────
const customers       = ref([])
const selectedCustomer = ref(null)
const deliveryAddress  = ref('')
const paymentMethod    = ref('cash')
const orderType        = ref('online')
const orderNote        = ref('')
const discountAmount   = ref(0)
const taxRate          = ref(10)

const paymentMethods = ['cash', 'bank_transfer', 'qr_code', 'card', 'credit']
const orderTypes     = [
  { title: 'ອອນລາຍ (Online)', value: 'online' },
  { title: 'ໜ້າຮ້ານ (In-shop)', value: 'in_shop' }
]

const loadCustomers = async () => {
  try {
    const res = await api('/customers?pageSize=500')
    if (res.success) customers.value = res.data
  } catch (e) { console.error(e) }
}

const loadTaxRate = async () => {
  try {
    const res = await api('/shop-settings')
    if (res.success && res.data?.tax_rate != null) taxRate.value = Number(res.data.tax_rate)
  } catch (e) { console.error(e) }
}

// ── Totals ────────────────────────────────────────────────────────
const totalItems  = computed(() => cart.value.reduce((s, c) => s + c.quantity, 0))
const subtotal    = computed(() => cart.value.reduce((s, c) => s + c.price * c.quantity, 0))
const taxAmount   = computed(() => (subtotal.value * taxRate.value) / 100)
const totalAmount = computed(() => subtotal.value + taxAmount.value - (discountAmount.value || 0))

// ── Submit ────────────────────────────────────────────────────────
const submitting    = ref(false)
const successDialog = ref(false)
const createdOrder  = ref(null)

const submitOrder = async () => {
  if (!cart.value.length) return
  submitting.value = true
  try {
    const payload = {
      customer_id:     selectedCustomer.value?.id || null,
      sale_type:       orderType.value,
      payment_method:  paymentMethod.value,
      discount_amount: discountAmount.value || 0,
      delivery_address: deliveryAddress.value || null,
      notes:           orderNote.value || null,
      items: cart.value.map(c => ({
        product_id:  c.product.id,
        variant_id:  c.variantId || null,
        quantity:    c.quantity,
        unit_price:  c.price
      }))
    }
    const res = await api('/sales', { method: 'POST', body: payload })
    if (res.success) {
      createdOrder.value  = res.data
      successDialog.value = true
    } else {
      notify(res.message || 'ສ້າງລາຍການບໍ່ສໍາເລັດ', 'error')
    }
  } catch (e) {
    console.error(e)
    notify('ເກີດຂໍ້ຜິດພາດ', 'error')
  } finally {
    submitting.value = false
  }
}

const resetOrder = () => {
  cart.value           = []
  selectedCustomer.value = null
  deliveryAddress.value  = ''
  orderNote.value        = ''
  discountAmount.value   = 0
  paymentMethod.value    = 'cash'
  orderType.value        = 'online'
}

// ── Orders List ───────────────────────────────────────────────────
const orders           = ref([])
const loadingOrders    = ref(false)
const orderSearch      = ref('')
const orderStatusFilter = ref(null)
const detailDialog     = ref(false)
const detailOrder      = ref(null)
const updatingStatus   = ref(null)

const orderStatusOptions = ['pending', 'processing', 'completed', 'cancelled', 'refunded']

const orderHeaders = [
  { title: 'ເລກທີ',     key: 'sale_number',    width: 120 },
  { title: 'ວັນທີ',     key: 'sale_date' },
  { title: 'ລູກຄ້າ',   key: 'customer',       sortable: false },
  { title: 'ຍອດ',       key: 'total_amount' },
  { title: 'ສະຖານະ',   key: 'sale_status' },
  { title: 'ຊຳລະ',     key: 'payment_status' },
  { title: 'ຈັດການ',   key: 'actions',        sortable: false, align: 'end' }
]

const orderStats = computed(() => [
  { label: 'ລໍຖ້າ',         color: 'orange',  icon: 'mdi-clock-outline',       count: orders.value.filter(o => o.sale_status === 'pending').length },
  { label: 'ກຳລັງດຳເນີນ', color: 'blue',    icon: 'mdi-progress-clock',      count: orders.value.filter(o => o.sale_status === 'processing').length },
  { label: 'ສໍາເລັດ',      color: 'green',   icon: 'mdi-check-circle-outline', count: orders.value.filter(o => o.sale_status === 'completed').length },
  { label: 'ຍົກເລີກ',      color: 'red',     icon: 'mdi-close-circle-outline', count: orders.value.filter(o => o.sale_status === 'cancelled').length },
])

const loadOrders = async () => {
  loadingOrders.value = true
  try {
    const params = new URLSearchParams({ pageSize: 500, sale_type: 'online' })
    if (orderSearch.value)       params.set('search',      orderSearch.value)
    if (orderStatusFilter.value) params.set('sale_status', orderStatusFilter.value)
    const res = await api(`/sales?${params}`)
    if (res.success) orders.value = res.data
  } catch (e) {
    console.error(e)
    notify('ໂຫຼດລາຍການບໍ່ສໍາເລັດ', 'error')
  } finally {
    loadingOrders.value = false
  }
}

const openOrderDetail = (item) => {
  detailOrder.value  = item
  detailDialog.value = true
}

const allowedStatusTransitions = (order) => {
  const map = {
    pending:    [{ value: 'processing', label: 'ຮັບລາຍການ',   color: 'blue',    icon: 'mdi-check' },
                 { value: 'cancelled',  label: 'ຍົກເລີກ',     color: 'error',   icon: 'mdi-close-circle-outline' }],
    processing: [{ value: 'completed',  label: 'ຈັດສົ່ງສໍາເລັດ', color: 'teal',  icon: 'mdi-truck-check-outline' },
                 { value: 'cancelled',  label: 'ຍົກເລີກ',     color: 'error',   icon: 'mdi-close-circle-outline' }],
    completed:  [],
    cancelled:  [],
    refunded:   [],
  }
  return map[order?.sale_status] ?? []
}

const updateOrderStatus = async (order, newStatus) => {
  updatingStatus.value = newStatus
  try {
    const res = await api(`/sales/${order.id}/status`, { method: 'PUT', body: { status: newStatus } })
    if (res.success) {
      notify('ອັບເດດສະຖານະສໍາເລັດ', 'success')
      order.sale_status = newStatus
      if (detailOrder.value?.id === order.id) detailOrder.value.sale_status = newStatus
    } else {
      notify(res.message || 'ອັບເດດບໍ່ສໍາເລັດ', 'error')
    }
  } catch (e) {
    console.error(e)
    notify('ເກີດຂໍ້ຜິດພາດ', 'error')
  } finally {
    updatingStatus.value = null
  }
}

// ── Helpers ───────────────────────────────────────────────────────
const formatCurrency = (val) =>
  val != null
    ? new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(val)
    : '—'

const formatDate = (val) =>
  val ? new Date(val).toLocaleString('lo-LA', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : '—'

const statusColor = (s) => ({ pending: 'orange', processing: 'blue', completed: 'green', cancelled: 'red', refunded: 'purple' }[s] ?? 'grey')
const statusIcon  = (s) => ({ pending: 'mdi-clock-outline', processing: 'mdi-progress-clock', completed: 'mdi-check-circle-outline', cancelled: 'mdi-close-circle-outline', refunded: 'mdi-cash-refund' }[s] ?? '')
const statusLabel = (s) => ({ pending: 'ລໍຖ້າ', processing: 'ກຳລັງດຳເນີນ', completed: 'ສໍາເລັດ', cancelled: 'ຍົກເລີກ', refunded: 'ຄືນເງິນ' }[s] ?? s)

const paymentColor = (s) => ({ paid: 'green', partial: 'orange', pending: 'red', refunded: 'purple' }[s] ?? 'grey')
const paymentLabel = (s) => ({ paid: 'ຊຳລະແລ້ວ', partial: 'ບາງສ່ວນ', pending: 'ລໍຖ້າ', refunded: 'ຄືນ' }[s] ?? (s ?? '—'))

// Snackbar
const snackbar = ref({ show: false, message: '', color: 'success' })
const notify   = (message, color = 'success') => { snackbar.value = { show: true, message, color } }

// ── Init ──────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([loadProducts(), loadCategories(), loadCustomers(), loadTaxRate()])
})
</script>

<style scoped>
.orders-page {
  width: 100%;
}

.page-header {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding-bottom: 16px;
}

.product-grid-container {
  max-height: calc(100vh - 280px);
  overflow-y: auto;
  min-height: 300px;
}

.product-card {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  border: 2px solid transparent;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.12) !important;
}

.product-card--selected {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.04);
}

.out-of-stock-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.45);
}

.detail-label {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
}

.success-checkmark {
  animation: pop 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
}

@keyframes pop {
  0%   { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1);   opacity: 1; }
}

.border-b {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
