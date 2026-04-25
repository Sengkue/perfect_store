<template>
  <v-dialog v-model="internalValue" max-width="600" persistent>
    <v-card class="rounded-lg">
      <v-card-title class="bg-primary text-white d-flex align-center justify-space-between py-3">
        <span>ການຊຳລະເງິນ & ສັ່ງຊື້</span>
        <v-btn icon="mdi-close" variant="text" @click="close" color="white"></v-btn>
      </v-card-title>
      
      <v-card-text class="pt-4">
        <v-row>
          <v-col cols="12" sm="6">
            <h3 class="text-subtitle-1 mb-2 font-weight-bold text-grey-darken-2">ສະຫຼຸບການສັ່ງຊື້</h3>
            <div class="d-flex justify-space-between mb-1">
              <span>ລາຄາລວມ:</span>
              <span>{{ formatKip(subtotal) }}</span>
            </div>
            <div class="d-flex justify-space-between mb-1">
              <span>ອາກອນ ({{ taxRate }}%):</span>
              <span>{{ formatKip(taxAmount) }}</span>
            </div>
            
            <div class="d-flex align-center mt-3 mb-4">
              <v-text-field
                v-model.number="discount"
                label="ສ່ວນຫຼຸດທັງໝົດ (₭)"
                density="compact"
                hide-details
                variant="outlined"
                type="number"
                min="0"
                prefix="₭"
              ></v-text-field>
            </div>
            
            <v-divider class="my-2"></v-divider>
            <div class="d-flex justify-space-between text-h6 font-weight-black mt-2">
              <span>ລວມທັງໝົດ:</span>
              <span class="text-primary">{{ formatKip(finalTotal) }}</span>
            </div>
          </v-col>
          
          <v-col cols="12" sm="6" class="bg-grey-lighten-4 rounded pa-4">
            <h3 class="text-subtitle-1 mb-3 font-weight-bold">ລາຍລະອຽດການຊຳລະ</h3>
            
            <v-autocomplete
              v-model="selectedCustomer"
              :items="customers"
              item-title="name"
              item-value="id"
              label="ເລືອກລູກຄ້າ"
              variant="outlined"
              density="compact"
              hide-details
              class="mb-3 bg-white"
              clearable>
              <template v-slot:append>
                <v-btn icon="mdi-account-plus" color="primary" variant="flat" size="small" @click="showAddCustomer = true"></v-btn>
              </template>
            </v-autocomplete>

            <v-select
              v-model="paymentMethod"
              :items="paymentMethods"
              label="ວິທີຊຳລະເງິນ"
              variant="outlined"
              density="compact"
              hide-details
              class="mb-3 bg-white"
            ></v-select>

            <v-text-field
              v-model.number="amountTendered"
              label="ຈຳນວນເງິນທີ່ຮັບມາ"
              variant="outlined"
              type="number"
              hide-details
              class="mb-3 bg-white"
              prefix="₭"
            ></v-text-field>
            
            <v-card v-if="amountTendered >= finalTotal" class="bg-success text-white pa-3 mb-2" flat>
              <div class="d-flex justify-space-between">
                <span>ເງິນທອນ:</span>
                <span class="font-weight-black text-h6">{{ formatKip(changeDue) }}</span>
              </div>
            </v-card>
            <v-card v-else-if="amountTendered > 0" class="bg-warning text-white pa-3 mb-2" flat>
              <div class="d-flex justify-space-between">
                <span>ຍອດຄົງເຫຼືອ:</span>
                <span class="font-weight-black text-h6">{{ formatKip(finalTotal - amountTendered) }}</span>
              </div>
              <div class="text-caption mt-1">ລາຍການນີ້ຈະຖືກບັນທຶກເປັນການຊຳລະບາງສ່ວນ.</div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
      
      <v-divider></v-divider>
      
      <v-card-actions class="pa-3">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="close">ຍົກເລີກ</v-btn>
        <v-btn color="primary" variant="flat" size="large" @click="confirm" :disabled="!canProceed">
          {{ amountTendered < finalTotal ? 'ຊຳລະບາງສ່ວນ & ສຳເລັດ' : 'ຊຳລະ & ສຳເລັດ' }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Quick Add Customer Dialog inside Modal -->
    <v-dialog v-model="showAddCustomer" max-width="400">
      <v-card>
        <v-card-title>ເພີ່ມລູກຄ້າໃໝ່</v-card-title>
        <v-card-text>
          <v-text-field v-model="newCustomer.first_name" label="ຊື່" variant="outlined" density="compact" class="mb-2"></v-text-field>
          <v-text-field v-model="newCustomer.last_name" label="ນາມສະກຸນ" variant="outlined" density="compact" class="mb-2"></v-text-field>
          <v-text-field v-model="newCustomer.phone" label="ເບີໂທລະສັບ" variant="outlined" density="compact" class="mb-2"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showAddCustomer = false">ຍົກເລີກ</v-btn>
          <v-btn color="primary" @click="saveNewCustomer">ບັນທຶກ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { formatKip } from '~/utils/format'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  subtotal: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 }
})

const emit = defineEmits(['update:modelValue', 'checkout'])
const api = useApi()

const internalValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const discount = ref(0)
const amountTendered = ref(0)
const paymentMethod = ref('cash')
const paymentMethods = [
  { title: 'ເງິນສົດ', value: 'cash' },
  { title: 'ບັດເຄຣດິດ', value: 'credit_card' },
  { title: 'ໂອນເງິນ', value: 'bank_transfer' },
  { title: 'ສະແກນ QR', value: 'qr_payment' }
]

const selectedCustomer = ref(null)
const customers = ref([])

const showAddCustomer = ref(false)
const newCustomer = ref({ first_name: '', last_name: '', phone: '' })

const taxAmount = computed(() => {
  // apply global discount to subtotal before tax if needed, 
  // but usually tax is computed on subtotal in standard retail
  return props.subtotal * (props.taxRate / 100)
})

const finalTotal = computed(() => {
  return props.subtotal + taxAmount.value - (discount.value || 0)
})

const changeDue = computed(() => {
  const tender = amountTendered.value || 0
  return tender >= finalTotal.value ? tender - finalTotal.value : 0
})

const canProceed = computed(() => {
  return amountTendered.value >= 0 // allow 0 for full layaway
})

const loadCustomers = async () => {
  try {
    const res = await api('/customers?pageSize=1000')
    if (res.success && res.data) {
      customers.value = res.data.map(c => ({
        id: c.id,
        name: `${c.first_name} ${c.last_name} (${c.phone || 'N/A'})`
      }))
    }
  } catch(e) {
    console.error('Failed to load customers', e)
  }
}

watch(() => props.modelValue, (val) => {
  if (val) {
    // Reset state on open
    discount.value = 0
    amountTendered.value = finalTotal.value // Default to exact amount
    paymentMethod.value = 'cash'
    selectedCustomer.value = null
    loadCustomers()
  }
})

const close = () => {
  internalValue.value = false
}

const confirm = () => {
  emit('checkout', {
    discount_amount: discount.value || 0,
    amount_paid: amountTendered.value || 0,
    payment_method: paymentMethod.value,
    customer_id: selectedCustomer.value
  })
}

const saveNewCustomer = async () => {
  if (!newCustomer.value.first_name || !newCustomer.value.last_name) {
    return showToast('First Name and Last Name are required!', 'error')
  }

  const payload = { ...newCustomer.value }
  if (!payload.phone || payload.phone.trim() === '') {
    delete payload.phone // Prevent DB unique constraint crash on empty strings
  }

  try {
    const res = await api('/customers', {
      method: 'POST',
      body: payload
    })
    if (res.success && res.data) {
      showToast('ເພີ່ມລູກຄ້າສຳເລັດ!', 'success')
      showAddCustomer.value = false
      await loadCustomers()
      selectedCustomer.value = res.data.id
      newCustomer.value = { first_name: '', last_name: '', phone: '' }
    } else {
      showToast(res.message || 'ບໍ່ສາມາດເພີ່ມລູກຄ້າໄດ້. ເບີໂທລະສັບອາດມີໃນລະບົບແລ້ວ.', 'error')
    }
  } catch(err) {
    showToast('ບໍ່ສາມາດບັນທຶກລູກຄ້າໄດ້. ຂໍ້ຜິດພາດຂອງເຊີເວີ.', 'error')
    console.error(err)
  }
}
</script>
