export default defineNuxtRouteMiddleware((to, from) => {
  const token = useCookie('auth_token')
  
  // If no auth token and not navigating to login, redirect to login
  if (!token.value && to.path !== '/login') {
    return navigateTo('/login')
  }

  // If auth token exists and navigating to login, redirect to dashboard
  if (token.value && to.path === '/login') {
    return navigateTo('/')
  }
})
