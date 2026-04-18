<template>
  <v-card class="product-card d-flex flex-column" elevation="1" hover @click="addItem">
    <v-img :src="product.image" height="140" cover class="bg-grey-lighten-2"></v-img>
    <v-card-text class="d-flex flex-column flex-grow-1 align-center text-center pa-3">
      <div class="text-subtitle-1 font-weight-medium mb-1 text-truncate w-100">{{ product.name }}</div>
      <div class="text-h6 font-weight-bold text-primary mt-auto">${{ product.price.toFixed(2) }}</div>
    </v-card-text>
  </v-card>
</template>

<script setup>
const props = defineProps(['product'])
const emit = defineEmits(['add-to-cart'])

const addItem = () => {
  emit('add-to-cart', props.product)
}
</script>

<style scoped>
.product-card {
  border-radius: 12px;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  height: 220px;
}
.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
}
</style>
