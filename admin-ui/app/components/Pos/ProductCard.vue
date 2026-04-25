<template>
  <v-card class="product-card d-flex flex-column" elevation="1" hover @click="addItem">
    <v-img :src="productImage" height="110" cover class="bg-grey-lighten-2"></v-img>
    <v-card-text class="d-flex flex-column flex-grow-1 align-center text-center pa-2">
      <div class="text-caption font-weight-bold mb-1 text-truncate w-100">{{ product.name }}</div>
      <div class="text-body-2 font-weight-bold text-primary mt-auto">{{ formatKip(product.price) }}</div>
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
  emit('add-to-cart', props.product)
}
</script>

<style scoped>
.product-card {
  border-radius: 10px;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  height: 185px;
}
.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
}
</style>
