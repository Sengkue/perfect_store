export default defineNuxtRouteMiddleware(async (to, from) => {
  const token = useCookie('auth_token')
  
  // If no auth token and not navigating to login, redirect to login
  if (!token.value && to.path !== '/login') {
    return navigateTo('/login')
  }

  // If auth token exists and navigating to login, redirect to dashboard
  if (token.value && to.path === '/login') {
    return navigateTo('/')
  }

  // Permission-based page access control
  if (token.value && to.path !== '/login') {
    const { hasPermission, permissionsLoaded, loadPermissions, userRole } = usePermissions()

    // Load permissions if not yet loaded
    if (!permissionsLoaded.value) {
      await loadPermissions()
    }

    // Root bypasses all route checks
    if (userRole.value === 'root') return

    // Map routes to required permissions
    const routePermissions: Record<string, string> = {
      '/categories':       'categories.view',
      '/products':         'products.view',
      '/suppliers':        'suppliers.view',
      '/purchase-orders':  'purchase_orders.view',
      '/imports':          'imports.view',
      '/sales':            'sales.view',
      '/orders':           'sales.view',
      '/customers':        'customers.view',
      '/employees':        'users.view',
      '/users':            'users.view',
      '/permissions':      'permissions.manage',
      '/settings':         'settings.view',
      '/pos':              'pos.access',
    }

    // Check if the current route requires a permission
    for (const [routePath, permName] of Object.entries(routePermissions)) {
      if (to.path.startsWith(routePath)) {
        if (!hasPermission(permName)) {
          return navigateTo('/')
        }
        break
      }
    }
  }
})
