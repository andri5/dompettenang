/**
 * Maintenance mode flag (build-time via Vite env)
 */

export const isMaintenanceMode =
  String(import.meta.env.VITE_MAINTENANCE_MODE || '').toLowerCase() === 'true';
