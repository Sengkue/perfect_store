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

  // Check roles for page access
  if (token.value && to.path !== '/login') {
    let userRole = 'staff'
    try {
      // Basic JWT decode to get the role
      const payload = JSON.parse(atob((token.value as string).split('.')[1]))
      if (payload && payload.role) {
        userRole = payload.role
      }
    } catch (e) {
      // Token parsing failed, fallback to 'staff'
    }

    // Routes only accessible to Admins
    const adminRoutes = ['/employees', '/users', '/permissions', '/settings']
    // Routes accessible to Admins and Managers
    const managerRoutes = ['/categories', '/products', '/suppliers', '/purchase-orders', '/imports']

    // Block non-admins from admin routes
    if (adminRoutes.some(path => to.path.startsWith(path))) {
      if (userRole !== 'admin') return navigateTo('/')
    }

    // Block staff from manager+ routes
    if (managerRoutes.some(path => to.path.startsWith(path))) {
       if (!['admin', 'manager'].includes(userRole)) return navigateTo('/')
    }
  }
})
