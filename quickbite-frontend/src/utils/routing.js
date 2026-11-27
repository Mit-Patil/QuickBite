import { MAP_CONFIG } from '../config/map';

const RETRY_DELAY_MS = 1200;
const cache = new Map();

async function requestRoute(from, to, attempt = 0) {
  const coordinates = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `${MAP_CONFIG.routingUrl}/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
  const response = await fetch(url);

  if ((response.status === 429 || response.status >= 500) && attempt < 1) {
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return requestRoute(from, to, attempt + 1);
  }
  if (!response.ok) {
    console.warn('Routing request failed with status', response.status);
    return null;
  }

  const data = await response.json();
  const route = data.routes?.[0];
  if (data.code !== 'Ok' || !route) {
    console.warn('Routing returned', data.code);
    return null;
  }
  return {
    path: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  };
}

const keyOf = (from, to) =>
  [from, to].map((point) => `${point.lat.toFixed(4)},${point.lng.toFixed(4)}`).join(';');

export function fetchRoadRoute(from, to) {
  const key = keyOf(from, to);
  if (!cache.has(key)) {
    const request = requestRoute(from, to)
      .then((route) => {
        if (!route) cache.delete(key);
        return route;
      })
      .catch((error) => {
        console.warn('Routing request error', error.message);
        cache.delete(key);
        throw error;
      });
    cache.set(key, request);
  }
  return cache.get(key);
}