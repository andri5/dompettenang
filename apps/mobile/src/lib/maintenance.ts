/**
 * Maintenance mode — mirrors web VITE_MAINTENANCE_MODE
 */
export const isMaintenanceMode =
  String(process.env.EXPO_PUBLIC_MAINTENANCE_MODE || '').toLowerCase() === 'true';
