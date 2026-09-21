import { MAP_CONFIG } from '../config/map';

function toPlace(raw) {
  const a = raw.address || {};
  return {
    lat: parseFloat(raw.lat),
    lng: parseFloat(raw.lon),
    displayName: raw.display_name,
    city: a.city || a.town || a.village || a.municipality || a.state_district || '',
    pincode: a.postcode || '',
  };
}

async function request(path, params) {
  const query = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    'accept-language': 'en',
    ...params,
  });
  if (MAP_CONFIG.contactEmail) {
    query.set('email', MAP_CONFIG.contactEmail);
  }

  const response = await fetch(`${MAP_CONFIG.nominatimUrl}${path}?${query}`);
  if (!response.ok) {
    throw new Error('Location service is unavailable. Please try again.');
  }
  return response.json();
}

export async function searchPlaces(text) {
  const q = text.trim();
  if (!q) return [];
  const results = await request('/search', { q, limit: '5', countrycodes: 'in' });
  return results.map(toPlace);
}

export async function reverseGeocode(lat, lng) {
  const result = await request('/reverse', { lat: String(lat), lon: String(lng) });
  if (result.error) return null;
  return { ...toPlace(result), lat, lng };
}