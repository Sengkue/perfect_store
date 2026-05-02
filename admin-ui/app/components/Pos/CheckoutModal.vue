<template>
  <v-dialog v-model="internalValue" max-width="650" persistent>
    <v-card class="rounded-xl elevation-24">
      <v-card-title class="bg-primary text-white d-flex align-center justify-space-between py-4 px-6">
        <span class="text-h6 font-weight-bold">ການຊຳລະເງິນ & ສັ່ງຊື້</span>
        <v-btn icon="mdi-close" variant="text" @click="close" color="white" size="small"></v-btn>
      </v-card-title>
      
      <v-card-text class="pa-6">
        <v-row>
          <!-- Left side: Summary -->
          <v-col cols="12" sm="5" class="border-e-sm pr-sm-6">
            <h3 class="text-subtitle-1 mb-4 font-weight-bold text-primary d-flex align-center">
              <v-icon size="small" class="mr-2">mdi-receipt-text</v-icon> ສະຫຼຸບການສັ່ງຊື້
            </h3>
            
            <div class="d-flex justify-space-between mb-2 text-body-2">
              <span class="text-medium-emphasis">ລາຄາລວມ:</span>
              <span class="font-weight-medium">{{ formatKip(subtotal) }}</span>
            </div>
            <div class="d-flex justify-space-between mb-4 text-body-2">
              <span class="text-medium-emphasis">ອາກອນ ({{ taxRate }}%):</span>
              <span class="font-weight-medium">{{ formatKip(taxAmount) }}</span>
            </div>
            
            <v-text-field
              v-model.number="discount"
              label="ສ່ວນຫຼຸດ (₭)"
              density="compact"
              hide-details
              variant="outlined"
              type="number"
              min="0"
              prefix="₭"
              class="mb-6"
              color="primary"
            ></v-text-field>
            
            <v-card variant="tonal" color="primary" class="pa-4 rounded-lg mt-auto">
              <div class="text-caption text-primary mb-1 text-uppercase font-weight-bold">ລວມທັງໝົດ</div>
              <div class="text-h5 font-weight-black text-primary">{{ formatKip(finalTotal) }}</div>
            </v-card>
          </v-col>
          
          <!-- Right side: Payment Details -->
          <v-col cols="12" sm="7" class="pl-sm-6">
            <h3 class="text-subtitle-1 mb-4 font-weight-bold text-primary d-flex align-center">
              <v-icon size="small" class="mr-2">mdi-credit-card</v-icon> ລາຍລະອຽດການຊຳລະ
            </h3>
            
            <v-autocomplete
              v-model="selectedCustomer"
              :items="customers"
              item-title="name"
              item-value="id"
              label="ເລືອກລູກຄ້າ"
              variant="outlined"
              density="compact"
              hide-details
              class="mb-4"
              color="primary"
              clearable>
              <template v-slot:append-inner>
                <v-icon color="primary" @click.stop="showAddCustomer = true" class="cursor-pointer">mdi-account-plus</v-icon>
              </template>
            </v-autocomplete>

            <v-select
              v-model="paymentMethod"
              :items="paymentMethods"
              label="ວິທີຊຳລະເງິນ"
              variant="outlined"
              density="compact"
              hide-details
              class="mb-4"
              color="primary"
            ></v-select>

            <v-text-field
              v-model.number="amountTendered"
              label="ຈຳນວນເງິນທີ່ຮັບມາ"
              variant="outlined"
              type="number"
              hide-details
              class="mb-4"
              color="primary"
              prefix="₭"
              style="font-size: 1.1rem; font-weight: bold;"
            ></v-text-field>
            
            <v-card v-if="amountTendered >= finalTotal" variant="tonal" color="success" class="pa-4 rounded-lg">
              <div class="d-flex justify-space-between align-center">
                <span class="font-weight-medium">ເງິນທອນ:</span>
                <span class="font-weight-black text-h5">{{ formatKip(changeDue) }}</span>
              </div>
            </v-card>
            
            <v-card v-else-if="amountTendered > 0" variant="tonal" color="warning" class="pa-4 rounded-lg">
              <div class="d-flex justify-space-between align-center">
                <span class="font-weight-medium">ຍອດຄົງເຫຼືອ:</span>
                <span class="font-weight-black text-h5">{{ formatKip(finalTotal - amountTendered) }}</span>
              </div>
              <div class="text-caption mt-2 opacity-80">ລາຍການນີ້ຈະຖືກບັນທຶກເປັນການຊຳລະບາງສ່ວນ.</div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
      
      <v-divider class="opacity-20"></v-divider>
      
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="close" class="px-4 text-none font-weight-medium">ຍົກເລີກ</v-btn>
        <v-btn 
          color="primary" 
          variant="flat" 
          size="large" 
          @click="confirm" 
          :disabled="!canProceed"
          class="px-6 rounded-lg text-none font-weight-bold elevation-2"
        >
          <v-icon start>mdi-check-circle</v-icon>
          {{ amountTendered < finalTotal ? 'ຊຳລະບາງສ່ວນ & ສຳເລັດ' : 'ຊຳລະ & ສຳເລັດ' }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Quick Add Customer Dialog inside Modal -->
    <v-dialog v-model="showAddCustomer" max-width="400">
      <v-card class="rounded-xl">
        <v-card-title class="pa-4 bg-primary text-white text-subtitle-1 font-weight-bold">ເພີ່ມລູກຄ້າໃໝ່</v-card-title>
        <v-card-text class="pt-6">
          <v-text-field v-model="newCustomer.first_name" label="ຊື່" variant="outlined" density="compact" class="mb-3" color="primary"></v-text-field>
          <v-text-field v-model="newCustomer.last_name" label="ນາມສະກຸນ" variant="outlined" density="compact" class="mb-3" color="primary"></v-text-field>
          <v-text-field v-model="newCustomer.phone" label="ເບີໂທລະສັບ" variant="outlined" density="compact" color="primary" hide-details></v-text-field>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showAddCustomer = false">ຍົກເລີກ</v-btn>
          <v-btn color="primary" variant="flat" class="px-4" @click="saveNewCustomer">ບັນທຶກ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { formatKip } from '~/utils/format'
import { showToast } from '#imports'

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
