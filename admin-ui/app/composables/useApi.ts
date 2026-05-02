import { useRuntimeConfig, useNuxtApp } from '#app'
import { showToast } from './useToast'

export const useApi = () => {
  const config = useRuntimeConfig()
  
  return $fetch.create({
    baseURL: config.public.apiBaseUrl,
    onRequest({ request, options }) {
      const token = useCookie('auth_token').value
      if (token) {
        options.headers = new Headers(options.headers || {})
        options.headers.set('Authorization', `Bearer ${token}`)
      }
    },
    onResponseError({ response }) {
      const { status, _data } = response
      const message = _data?.message || _data?.error || 'ເກີດຂໍ້ຜິດພາດບາງຢ່າງ'

      if (status === 401) {
        // Handle unauthorized
        const token = useCookie('auth_token')
        token.value = null
        navigateTo('/login')
        return
      }

      if (status === 403) {
        showToast('Access Denied: ທ່ານບໍ່ມີສິດເຂົ້າເຖິງຂໍ້ມູນນີ້', 'error')
        return
      }

      if (status === 400) {
        showToast(message, 'warning')
        return
      }

      if (status >= 500) {
        showToast('System Error: ເກີດຂໍ້ຜິດພາດທາງລະບົບ ກະລຸນາລອງໃໝ່ພາຍຫຼັງ', 'error')
        return
      }

      // Default error toast for other statuses
      showToast(message, 'error')
    }
  })
}
