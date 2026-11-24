const EARTH_RADIUS_M = 6371000;
const toRad = (degrees) => (degrees * Math.PI) / 180;

export function distanceMeters(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function moveToward(from, to, stepMeters) {
  const remaining = distanceMeters(from, to);
  if (remaining <= stepMeters) return { lat: to.lat, lng: to.lng };
  const fraction = stepMeters / remaining;
  return {
    lat: from.lat + (to.lat - from.lat) * fraction,
    lng: from.lng + (to.lng - from.lng) * fraction,
  };
}