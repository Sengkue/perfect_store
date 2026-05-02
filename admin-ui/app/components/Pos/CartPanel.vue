<template>
  <div class="cart-panel-container pa-2">
    <!-- Cart Items list wrapper -->
    <div class="cart-items-wrapper">
      <v-list class="bg-transparent" density="compact">
        <div v-if="cart.length === 0" class="text-center text-grey my-10">Cart is empty</div>
        <v-fade-transition group>
          <v-list-item v-for="(item, index) in cart" :key="item.id" class="px-0 mb-1 rounded" :class="expandedItem === item.id ? 'border-active' : 'border'" elevation="0">
            <div class="d-flex flex-column w-100 cursor-pointer" :class="expandedItem === item.id ? 'pa-2' : 'py-1 px-2'" @click="toggleExpand(item.id)">
              <div class="d-flex align-center justify-space-between" :class="expandedItem === item.id ? 'mb-2' : ''">
                <div class="d-flex align-center">
                  <v-icon size="x-small" class="mr-1 text-grey-darken-1">{{ expandedItem === item.id ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
                  <span class="mr-2 font-weight-bold text-caption">{{ item.quantity }}</span>
                  <span class="font-weight-medium text-caption text-truncate" style="max-width: 150px;">{{ item.name }}</span>
                </div>
                <div class="d-flex align-center">
                  <span class="font-weight-bold mr-2 text-caption">{{ formatKip(item.price * item.quantity) }}</span>
                  <v-btn icon="mdi-close-circle" variant="text" color="grey" size="x-small" @click.stop="$emit('remove', item.id)"></v-btn>
                </div>
              </div>

              <!-- Expandable Detail Row -->
              <v-expand-transition>
                <div v-if="expandedItem === item.id">
                  <v-row dense align="center" class="mt-1" @click.stop>
                    <v-col cols="6">
                      <div class="text-caption text-grey mb-1">Quantity</div>
                      <v-text-field
                        :model-value="item.quantity"
                        @update:model-value="(v) => $emit('update-qty', item.id, Number(v))"
                        type="number"
                        density="compact"
                        variant="outlined"
                        hide-details
                        min="1"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <div class="text-caption text-grey mb-1">Discount(%)</div>
                      <v-text-field
                        v-model="item.discountPercent"
                        type="number"
                        density="compact"
                        variant="outlined"
                        hide-details
                        min="0"
                        max="100"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </div>
              </v-expand-transition>
            </div>
          </v-list-item>
        </v-fade-transition>
      </v-list>
    </div>

    <!-- Cart Actions / Totals (Fixed at bottom) -->
    <div class="cart-footer mt-4 pb-2">
      <div class="d-flex justify-space-between mb-2 px-3 py-2 rounded text-warning font-weight-medium text-caption" style="background-color: rgba(var(--v-theme-warning), 0.1);">
        <span class="cursor-pointer">Add</span>
        <span class="cursor-pointer">Discount</span>
        <span class="cursor-pointer">Coupon</span>
        <span class="cursor-pointer">Note</span>
      </div>

      <div class="d-flex justify-space-between mb-1 text-subtitle-2">
        <span class="text-grey-darken-1">Subtotal</span>
        <span class="font-weight-bold">{{ formatKip(subtotal) }}</span>
      </div>
      <div class="d-flex justify-space-between mb-2 text-subtitle-2">
        <span class="text-grey-darken-1">Tax ({{ taxRate }}%)</span>
        <span class="font-weight-bold">{{ formatKip(tax) }}</span>
      </div>
      <v-divider class="my-2"></v-divider>
      <div class="d-flex justify-space-between mb-4 align-center">
        <span class="text-h6 font-weight-bold">Payable Amount</span>
        <span class="text-h6 font-weight-bold">{{ formatKip(total) }}</span>
      </div>

      <v-row dense>
        <v-col cols="6">
          <v-btn color="warning" block size="large" @click="$emit('hold')" prepend-icon="mdi-pause-circle-outline" class="text-none">Hold Order</v-btn>
        </v-col>
        <v-col cols="6">
          <v-btn color="success" block size="large" @click="$emit('proceed')" prepend-icon="mdi-check-circle-outline" class="text-none">Proceed</v-btn>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { formatKip } from '~/utils/format'

const props = defineProps({
  cart: { type: Array, required: true },
  taxRate: { type: Number, default: 10 }
})
defineEmits(['update-qty', 'remove', 'hold', 'proceed', 'add-customer'])

const expandedItem = ref(null)

const toggleExpand = (id) => {
  expandedItem.value = expandedItem.value === id ? null : id
}

watch(() => props.cart.length, (newLen, oldLen) => {
  if (newLen > oldLen && props.cart.length > 0) {
    expandedItem.value = props.cart[props.cart.length - 1].id
  }
})

const subtotal = computed(() => {
  return props.cart.reduce((sum, item) => {
    let itemTotal = item.price * item.quantity;
    if(item.discountPercent > 0) {
      itemTotal = itemTotal - (itemTotal * (item.discountPercent / 100));
    }
    return sum + itemTotal;
  }, 0)
})

const tax = computed(() => {
  return subtotal.value * (props.taxRate / 100); 
})

const total = computed(() => {
  return subtotal.value + tax.value;
})
</script>

<style scoped>
.cart-panel-container {
  display: grid;
  grid-template-rows: 1fr auto;
  height: 100%;
  max-height: 100vh; /* Force constraint */
  overflow: hidden;
}
.cart-items-wrapper {
  overflow-y: auto;
  min-height: 0;
}
.cart-footer {
  padding-top: 10px;
  background-color: rgb(var(--v-theme-surface)); /* Ensure it stays above nothing */
}
.cursor-pointer {
  cursor: pointer;
}
.border {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background-color: rgba(var(--v-theme-on-surface), 0.02);
}
.border-active {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-left: 3px solid #10b981;
  background-color: rgba(var(--v-theme-on-surface), 0.08);
}
/* custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1; 
  border-radius: 4px;
}
</style>
