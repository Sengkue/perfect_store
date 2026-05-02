<template>
  <v-card 
    class="product-card d-flex flex-column" 
    :class="{ 'is-out-of-stock': product.stockQty <= 0 }"
    elevation="1" 
    :hover="product.stockQty > 0" 
    @click="addItem"
  >
    <v-img :src="productImage" height="110" cover class="bg-surface-variant position-relative">
      <div v-if="product.stockQty <= 0" class="out-of-stock-overlay d-flex align-center justify-center">
        <v-icon color="error" size="48" class="bg-surface rounded-circle pa-1 elevation-2">mdi-cart-off</v-icon>
      </div>
    </v-img>
    <v-card-text class="d-flex flex-column flex-grow-1 align-center text-center pa-2">
      <div class="text-caption font-weight-bold mb-1 text-truncate w-100">{{ product.name }}</div>
      <div class="text-body-2 font-weight-bold mt-auto" :class="product.stockQty > 0 ? 'text-primary' : 'text-error'">
        <span v-if="product.stockQty > 0">{{ formatKip(product.price) }}</span>
        <span v-else>ໝົດສິນຄ້າ</span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { formatKip } from '~/utils/format'

const props = defineProps(['product'])
const emit = defineEmits(['add-to-cart'])

const productImage = computed(() => {
  return props.product.image || '/images/product-placeholder.png'
})

const addItem = () => {
  // Pos.vue already checks if it's out of stock and shows a toast, 
  // but we can also prevent emitting if we want, but letting it emit 
  // allows pos.vue to show the 'Product is out of stock!' error toast.
  emit('add-to-cart', props.product)
}
</script>

<style scoped>
.product-card {
  border-radius: 10px;
  transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
  cursor: pointer;
  height: 185px;
}
.product-card:not(.is-out-of-stock):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
}
.is-out-of-stock {
  opacity: 0.7;
}
.position-relative {
  position: relative;
}
.out-of-stock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(var(--v-theme-surface), 0.5);
}
</style>
