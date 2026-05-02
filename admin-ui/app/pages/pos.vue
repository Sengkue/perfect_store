<template>
  <v-container fluid class="fill-height pa-0 ma-0 bg-background">
    <v-row class="fill-height ma-0">
      
      <!-- Left Area: Search, Categories & Products -->
      <v-col cols="12" md="8" class="d-flex flex-column h-100 pa-4 border-e border-grey-lighten-2">
        <div class="d-flex align-center justify-space-between mb-4">
            <v-text-field
                v-model="searchQuery"
                prepend-inner-icon="mdi-barcode-scan"
                label="ສະແກນບາໂຄ້ດ ຫຼື ຄົ້ນຫາສິນຄ້າ..."
                variant="solo"
                density="comfortable"
                hide-details
                clearable
                autofocus
                class="flex-grow-1 mr-4 rounded-lg elevation-1"
            ></v-text-field>

            <v-btn
                v-if="heldOrders.length > 0"
                color="warning"
                variant="flat"
                class="text-none font-weight-bold"
                prepend-icon="mdi-pause-circle-outline"
                @click="showHeldOrders = true"
            >
                ລາຍການທີ່ພັກໄວ້ ({{ heldOrders.length }})
            </v-btn>
        </div>

        <PosCategoryTabs v-model="activeCategory" :categories="categories.map(c => c.category_name)" class="mb-2" />
        
        <v-row dense class="flex-grow-1 overflow-y-auto w-100 ma-0 mt-2 align-content-start">
          <v-col v-for="product in filteredProducts" :key="product.id" class="pos-product-col px-1 mb-2">
            <PosProductCard :product="product" @add-to-cart="addToCart" />
          </v-col>
          <v-col cols="12" v-if="filteredProducts.length === 0" class="text-center mt-10">
              <v-icon size="64" color="grey-lighten-1">mdi-package-variant</v-icon>
              <h3 class="text-h6 text-grey mt-4">ບໍ່ພົບສິນຄ້າ.</h3>
          </v-col>
        </v-row>
      </v-col>

      <!-- Right Area: Cart Panel -->
      <v-col cols="12" md="4" class="h-100 pa-0 bg-surface border-s border-grey-lighten-2" style="display: flex; flex-direction: column; overflow: hidden;">
        <!-- We keep the CartPanel as the view, but hook its Proceed to our new Modal -->
        <PosCartPanel 
          :cart="cart" 
          :tax-rate="taxRate"
          style="height: 100%; flex-grow: 1; overflow: hidden;"
          @update-qty="updateCartQty" 
          @remove="removeFromCart"
          @hold="holdOrder"
          @proceed="openCheckoutModal"
          @add-customer="showAddCustomer = true"
        />
      </v-col>
    </v-row>

    <PosCheckoutModal 
        v-model="isCheckoutOpen" 
        :subtotal="cartSubtotal"
        :tax-rate="taxRate"
        @checkout="executeCheckout"
    />

    <!-- Quick Add Customer Dialog inside POS -->
    <v-dialog v-model="showAddCustomer" max-width="400">
      <v-card>
        <v-card-title>ເພີ່ມລູກຄ້າໃໝ່</v-card-title>
        <v-card-text class="pt-4">
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

    <!-- Held Orders Dialog -->
    <v-dialog v-model="showHeldOrders" max-width="500">
        <v-card>
            <v-card-title>ລາຍການທີ່ພັກໄວ້</v-card-title>
            <v-list lines="two">
                <v-list-item v-for="(order, index) in heldOrders" :key="index" border>
                    <template v-slot:title>
                        <strong class="text-primary">ລາຍການທີ #{{ index + 1 }}</strong> - {{ order.items.length }} ລາຍການ
                    </template>
                    <template v-slot:subtitle>
                        ພັກໄວ້ເມື່ອ {{ new Date(order.time).toLocaleTimeString() }}
                    </template>
                    <template v-slot:append>
                        <v-btn icon="mdi-restore" color="success" variant="text" @click="restoreOrder(index)"></v-btn>
                        <v-btn icon="mdi-delete" color="error" variant="text" @click="deleteHeldOrder(index)"></v-btn>
                    </template>
                </v-list-item>
            </v-list>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="showHeldOrders = false">ປິດ</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { formatKip } from '~/utils/format'
import { showToast } from '#imports'

definePageMeta({
  layout: 'default',
  fluid: true
})

// Audio
const sounds = {
  scanner: typeof Audio !== 'undefined' ? new Audio('/sounds/scanner_beep.mp3') : null,
  click: typeof Audio !== 'undefined' ? new Audio('/sounds/UI_click.mp3') : null,
  cash: typeof Audio !== 'undefined' ? new Audio('/sounds/cash_register_beep.mp3') : null,
  error: typeof Audio !== 'undefined' ? new Audio('/sounds/error.mp3') : null,
  success: typeof Audio !== 'undefined' ? new Audio('/sounds/success_transaction_chim.mp3') : null,
}

const playSound = (type) => {
  if (typeof window !== 'undefined' && localStorage.getItem('pos_sound_enabled') === 'false') return;
  
  if (sounds[type]) {
    sounds[type].currentTime = 0
    sounds[type].play().catch(e => console.warn(`Audio ${type} play failed:`, e))
  }
}

const api = useApi()

// State
const searchQuery = ref('')
const activeCategory = ref(0)
const categories = ref([{ id: 0, category_name: 'All' }])
const products = ref([])
const taxRate = ref(0)
const shopSettings = ref({ shop_name: 'PERFECT STORE', phone: '', address: '' })

const cart = ref([])
const isCheckoutOpen = ref(false)
const showHeldOrders = ref(false)
const heldOrders = ref([])

const showAddCustomer = ref(false)
const newCustomer = ref({ first_name: '', last_name: '', phone: '' })

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
            newCustomer.value = { first_name: '', last_name: '', phone: '' }
        } else {
            showToast(res.message || 'ບໍ່ສາມາດເພີ່ມລູກຄ້າໄດ້. ເບີໂທລະສັບອາດມີໃນລະບົບແລ້ວ.', 'error')
        }
    } catch(err) {
        showToast('ບໍ່ສາມາດບັນທຶກລູກຄ້າໄດ້. ຂໍ້ຜິດພາດຂອງເຊີເວີ.', 'error')
        console.error(err)
    }
}

onMounted(async () => {
  // Load settings
  try {
    const settingsRes = await api('/shop-settings')
    if (settingsRes.success && settingsRes.data) {
      shopSettings.value = Object.assign(shopSettings.value, settingsRes.data)
      if (settingsRes.data.tax_rate !== undefined) {
        taxRate.value = Number(settingsRes.data.tax_rate)
      }
    }
  } catch(err) {
    console.error('Failed to load settings', err)
  }

  // Load Categories
  try {
    const catRes = await api('/categories')
    if (catRes.success) {
      categories.value = [{ id: 0, category_name: 'ທັງໝົດ' }, ...catRes.data]
    }

    // Load Products
    const prodRes = await api('/products?pageSize=1000') // fetch more to allow local filter
    if (prodRes.success && prodRes.data) {
      products.value = prodRes.data.map(p => {
        const stockQty = p.variants ? p.variants.reduce((sum, v) => sum + (v.quantity_in_stock || 0), 0) : 0;
        return {
          ...p,
          stockQty,
          price: Number(p.selling_price),
          image: p.images?.length > 0 ? p.images[0].image_url : null
        };
      })
    }
  } catch (err) {
    console.error('Error fetching POS data', err)
  }

  // Load Held orders from local storage
  const savedHolds = localStorage.getItem('held_orders')
  if (savedHolds) {
      try {
          heldOrders.value = JSON.parse(savedHolds)
      } catch (e) {}
  }
})

// Auto-scan feature logic: If exact barcode matches, add and clear
watch(searchQuery, (val) => {
    if (!val) return;
    const exactMatch = products.value.find(p => p.barcode === val.trim());
    if (exactMatch) {
        playSound('scanner');
        addToCart(exactMatch, true);
        searchQuery.value = ''; // clear scanner
    }
})

const filteredProducts = computed(() => {
  let result = products.value

  // Category filter
  if (activeCategory.value !== 0) {
      const category = categories.value[activeCategory.value]
      if (category) {
          result = result.filter(p => p.category_id === category.id)
      }
  }

  // Text / Barcode search
  if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase().trim()
      result = result.filter(p => 
          p.name.toLowerCase().includes(q) || 
          (p.barcode && p.barcode.toLowerCase() === q)
      )
  }

  return result
})

// === Cart Logic ===
const addToCart = (product, fromScanner = false) => {
  const existing = cart.value.find(item => item.id === product.id)
  if (existing) {
    if (existing.quantity >= product.stockQty) {
      playSound('error');
      return showToast(`Not enough stock. Only ${product.stockQty} available.`, 'warning');
    }
    existing.quantity += 1
  } else {
    if (product.stockQty <= 0) {
      playSound('error');
      return showToast('Product is out of stock!', 'error');
    }
    cart.value.push({ ...product, quantity: 1, discountPercent: 0 })
  }
  if (!fromScanner) playSound('click');
}

const updateCartQty = (id, newQty) => {
  const item = cart.value.find(item => item.id === id)
  if (item) {
    if (newQty > item.stockQty) {
      item.quantity = item.stockQty;
      return showToast(`Maximum stock available is ${item.stockQty}.`, 'warning');
    }
    item.quantity = newQty
    if (item.quantity <= 0) removeFromCart(id)
  }
}

const removeFromCart = (id) => {
  cart.value = cart.value.filter(item => item.id !== id)
}

// === Held Orders ===
const holdOrder = () => {
  if(cart.value.length === 0) return showToast('Cart is empty!', 'warning');
  heldOrders.value.push({ time: new Date().toISOString(), items: [...cart.value] })
  localStorage.setItem('held_orders', JSON.stringify(heldOrders.value))
  cart.value = []
}

const restoreOrder = (index) => {
    if (cart.value.length > 0) {
        if (!confirm('ມີສິນຄ້າຢູ່ໃນກະຕ່າແລ້ວ. ຕ້ອງການຂຽນທັບ ຫຼື ບໍ່?')) return;
    }
    cart.value = heldOrders.value[index].items
    heldOrders.value.splice(index, 1)
    localStorage.setItem('held_orders', JSON.stringify(heldOrders.value))
    showHeldOrders.value = false
}

const deleteHeldOrder = (index) => {
    heldOrders.value.splice(index, 1)
    localStorage.setItem('held_orders', JSON.stringify(heldOrders.value))
}

// === Checkout ===
const cartSubtotal = computed(() => {
    let sub = 0;
    cart.value.forEach(item => {
      let itemTotal = item.price * item.quantity;
      if (item.discountPercent > 0) {
        itemTotal -= (itemTotal * (item.discountPercent / 100));
      }
      sub += itemTotal;
    });
    return sub;
})

const openCheckoutModal = () => {
    if (cart.value.length === 0) return showToast('Cart is empty!', 'warning');
    isCheckoutOpen.value = true;
}

const executeCheckout = async (checkoutData) => {
    try {
        const payloadTax = cartSubtotal.value * (taxRate.value / 100);
        const payloadTotal = cartSubtotal.value - checkoutData.discount_amount + payloadTax;

        const saleData = {
            sale_type: 'in_shop',
            total_amount: payloadTotal,
            tax_amount: payloadTax,
            discount_amount: checkoutData.discount_amount,
            amount_paid: checkoutData.amount_paid,
            payment_method: checkoutData.payment_method,
            customer_id: checkoutData.customer_id,
            items: cart.value.map(item => {
                const itemDiscount = (item.price * item.quantity) * (item.discountPercent / 100);
                return {
                    product_id: item.id,
                    quantity: item.quantity,
                    unit_price: item.price,
                    discount_per_item: itemDiscount / item.quantity
                }
            })
        }

        const res = await api('/sales', {
            method: 'POST',
            body: saleData
        });

        if (res.success) {
            playSound('success');
            if (res.data) {
                printReceipt(res.data);
            }
            cart.value = [];
            isCheckoutOpen.value = false;
        } else {
            showToast(res.message || 'Complete failed', 'error');
        }
    } catch(err) {
        console.error(err)
        showToast('Server Error during checkout.', 'error')
    }
}

const printReceipt = (sale) => {
    const date = new Date(sale.createdAt || sale.sale_date || new Date()).toLocaleString();
    const itemsHtml = (sale.details || []).map(d => `
        <tr>
            <td style="text-align: left; padding: 4px 0;">${d.product?.name || 'Item'}</td>
            <td style="text-align: center; padding: 4px 0;">${d.quantity}</td>
            <td style="text-align: right; padding: 4px 0;">${formatKip(Number(d.unit_price))}</td>
            <td style="text-align: right; padding: 4px 0;">${formatKip(Number(d.subtotal))}</td>
        </tr>
    `).join('');

    const html = `
        <html>
            <head>
                <title>Receipt</title>
                <style>
                    body { font-family: 'Courier New', Courier, monospace; width: 300px; margin: 0 auto; color: #000; font-size: 14px; }
                    h2 { text-align: center; margin-bottom: 5px; font-size: 20px; }
                    p { text-align: center; margin: 2px 0; font-size: 12px; }
                    hr { border-top: 1px dashed #000; margin: 10px 0; }
                    table { width: 100%; font-size: 12px; border-collapse: collapse; }
                    th { border-bottom: 1px dashed #000; padding: 4px 0; }
                    .totals { width: 100%; font-size: 12px; margin-top: 10px; }
                    .totals td { padding: 4px 0; }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .bold { font-weight: bold; }
                    @media print {
                        body { width: 100%; }
                    }
                </style>
            <body>
                <h2>${shopSettings.value.shop_name || 'PERFECT STORE'}</h2>
                ${shopSettings.value.address ? '<p>' + shopSettings.value.address + '</p>' : ''}
                ${shopSettings.value.phone ? '<p>Tel: ' + shopSettings.value.phone + '</p>' : ''}
                ${shopSettings.value.tax_number ? '<p>Tax No: ' + shopSettings.value.tax_number + '</p>' : ''}
                <hr />
                <p>Receipt #: ${sale.sale_number}</p>
                <p>Date: ${date}</p>
                ${sale.customer ? '<p>Customer: ' + sale.customer.first_name + ' ' + sale.customer.last_name + '</p>' : ''}
                <hr />
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: left;">Item</th>
                            <th style="text-align: center;">Qty</th>
                            <th style="text-align: right;">Price</th>
                            <th style="text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                <hr />
                <table class="totals">
                    <tr>
                        <td>Subtotal:</td>
                        <td class="text-right">${formatKip(Number(sale.subtotal))}</td>
                    </tr>
                    <tr>
                        <td>Tax:</td>
                        <td class="text-right">${formatKip(Number(sale.tax_amount))}</td>
                    </tr>
                    <tr>
                        <td>Discount:</td>
                        <td class="text-right">-${formatKip(Number(sale.discount_amount || 0))}</td>
                    </tr>
                    <tr class="bold">
                        <td>Total:</td>
                        <td class="text-right">${formatKip(Number(sale.total_amount))}</td>
                    </tr>
                    <tr>
                        <td>Amount Paid:</td>
                        <td class="text-right">${formatKip(Number(sale.amount_paid || sale.total_amount))}</td>
                    </tr>
                    <tr>
                        <td>Change:</td>
                        <td class="text-right">${formatKip(Math.max(0, Number(sale.amount_paid || sale.total_amount) - Number(sale.total_amount)))}</td>
                    </tr>
                </table>
                <hr />
                <p class="text-center bold">ຂອບໃຈທີ່ມາອຸດໜູນ!</p>
                <p class="text-center">ໂອກາດໜ້າເຊີນໃໝ່.</p>
            </body>
        </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    iframe.srcdoc = html;
    
    iframe.onload = () => {
        setTimeout(() => {
            iframe.contentWindow.print();
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 500);
    };
};
</script>

<style scoped>
.fill-height {
  height: calc(100vh - 64px);
  overflow: hidden;
}
.overflow-y-auto {
  overflow-y: auto;
}
.pos-product-col {
  width: 50%;
  flex: 0 0 50%;
  max-width: 50%;
}

@media (min-width: 600px) {
  .pos-product-col {
    width: 33.33%;
    flex: 0 0 33.33%;
    max-width: 33.33%;
  }
}

@media (min-width: 960px) {
  .pos-product-col {
    width: 25%;
    flex: 0 0 25%;
    max-width: 25%;
  }
}

@media (min-width: 1264px) {
  .pos-product-col {
    width: 20%;
    flex: 0 0 20%;
    max-width: 20%;
  }
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
