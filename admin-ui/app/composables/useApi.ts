import { useRuntimeConfig, useNuxtApp } from '#app'

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
      if (response.status === 401) {
        // Handle unauthorized, might redirect to login
        const token = useCookie('auth_token')
        token.value = null
        navigateTo('/login')
      }
    }
  })
}
