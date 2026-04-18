<template>
  <v-tabs v-model="internalModel" color="primary" show-arrows>
    <v-tab v-for="category in categories" :key="category" :value="categories.indexOf(category)">
      {{ category }}
    </v-tab>
  </v-tabs>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps(['modelValue', 'categories'])
const emit = defineEmits(['update:modelValue'])

const internalModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>
