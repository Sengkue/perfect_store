<template>
  <v-snackbar
    v-model="show"
    :color="color"
    :timeout="3000"
    location="top right"
  >
    {{ message }}
    <template v-slot:actions>
      <v-btn
        color="white"
        variant="text"
        @click="show = false"
      >
        Close
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup>
import { useToastState } from '#imports'

const { show, message, color } = useToastState()
</script>
