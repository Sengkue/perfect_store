<template>
  <v-card rounded="lg" elevation="2">
    <v-card-title class="d-flex align-center py-3 px-4">
      <span class="text-h6 font-weight-bold">Products</span>
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        append-inner-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
        density="compact"
        class="mr-4"
        style="max-width: 250px"
      ></v-text-field>
      <v-btn color="primary" prepend-icon="mdi-plus">Add Product</v-btn>
    </v-card-title>
    <v-divider></v-divider>

    <v-data-table
      :headers="headers"
      :items="products"
      :loading="loading"
      :search="search"
      hover
    >
      <template v-slot:item.price="{ item }">
        ${{ Number(item.selling_price).toFixed(2) }}
      </template>
      <template v-slot:item.actions="{ item }">
        <v-btn icon="mdi-pencil" variant="text" size="small" color="primary"></v-btn>
        <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteProduct(item.id)"></v-btn>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const api = useApi()
const products = ref([])
const loading = ref(false)
const search = ref('')

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Image', key: 'image', sortable: false },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Barcode', key: 'barcode', sortable: false },
  { title: 'Category', key: 'category.category_name', sortable: true },
  { title: 'Price', key: 'price', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
]

const loadProducts = async () => {
  loading.value = true
  try {
    const res = await api('/products?pageSize=1000') // Simplification for now
    if (res.success) {
      products.value = res.data
    }
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const deleteProduct = async (id) => {
  if (!confirm('Are you sure you want to delete this product?')) return
  try {
    const res = await api(`/products/${id}`, { method: 'DELETE' })
    if (res.success) {
      loadProducts()
    } else {
      alert(res.message)
    }
  } catch (err) {
    console.error(err)
    alert('Failed to delete product')
  }
}

onMounted(() => {
  loadProducts()
})
</script>
