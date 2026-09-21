export const MAP_CONFIG = {
  tileUrl:
    import.meta.env.VITE_MAP_TILE_URL ||
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    import.meta.env.VITE_MAP_ATTRIBUTION ||
    '&copy; OpenStreetMap contributors',
  defaultCenter: [23.0225, 72.5714],
  defaultZoom: 13,
  nominatimUrl:
    import.meta.env.VITE_NOMINATIM_URL || 'https://nominatim.openstreetmap.org',
  contactEmail: import.meta.env.VITE_GEOCODING_EMAIL || '',
  maxUsableAccuracyMeters: 5000,
};