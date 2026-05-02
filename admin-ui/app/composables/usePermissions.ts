/**
 * Composable for permission-based access control.
 * Provides reactive permission state and helper methods.
 *
 * Usage:
 *   const { hasPermission, isRoot, loadPermissions } = usePermissions()
 *   if (hasPermission('products.edit')) { ... }
 */
export const usePermissions = () => {
  // Shared state across all components
  const permissions = useState<string[]>('user_permissions', () => [])
  const userRole = useState<string>('user_role', () => 'staff')
  const permissionsLoaded = useState<boolean>('permissions_loaded', () => false)

  const isRoot = computed(() => userRole.value === 'root')

  /**
   * Check if the current user has a specific permission.
   * Root always returns true. Wildcard '*' means all permissions.
   */
  const hasPermission = (permName: string): boolean => {
    if (userRole.value === 'root') return true
    if (permissions.value.includes('*')) return true
    return permissions.value.includes(permName)
  }

  /**
   * Check if user has ANY of the listed permissions.
   */
  const hasAnyPermission = (...permNames: string[]): boolean => {
    if (userRole.value === 'root') return true
    if (permissions.value.includes('*')) return true
    return permNames.some(p => permissions.value.includes(p))
  }

  /**
   * Load permissions from /auth/me API.
   * Called once on app init (from layout or middleware).
   */
  const loadPermissions = async () => {
    const api = useApi()
    try {
      const res = await api('/auth/me')
      if (res.success && res.data) {
        userRole.value = res.data.role || 'staff'
        permissions.value = res.data.permissions || []
        permissionsLoaded.value = true
      }
    } catch (e) {
      // Silent fail — user may not be authenticated yet
      console.error('Failed to load permissions:', e)
    }
  }

  /**
   * Clear permissions (on logout).
   */
  const clearPermissions = () => {
    permissions.value = []
    userRole.value = 'staff'
    permissionsLoaded.value = false
  }

  return {
    permissions,
    userRole,
    permissionsLoaded,
    isRoot,
    hasPermission,
    hasAnyPermission,
    loadPermissions,
    clearPermissions
  }
}
