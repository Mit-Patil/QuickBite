import { orderClient } from './axiosClient';

export function getMenuForRestaurant(restaurantId) {
  return orderClient.get(`/api/restaurants/${restaurantId}/menu-items`);
}

export function createMenuItem(restaurantId, data) {
  return orderClient.post(`/api/restaurants/${restaurantId}/menu-items`, data);
}

export function getMenuItemById(id) {
  return orderClient.get(`/api/menu-items/${id}`);
}

export function updateMenuItem(id, data) {
  return orderClient.put(`/api/menu-items/${id}`, data);
}

export function addVariant(menuItemId, data) {
  return orderClient.post(`/api/menu-items/${menuItemId}/variants`, data);
}

export function getAddonsForRestaurant(restaurantId) {
  return orderClient.get(`/api/restaurants/${restaurantId}/addons`);
}

export function createAddon(restaurantId, data) {
  return orderClient.post(`/api/restaurants/${restaurantId}/addons`, data);
}

export function attachAddon(menuItemId, addonId) {
  return orderClient.post(`/api/menu-items/${menuItemId}/addons`, { addonId });
}

export function updateVariant(itemId, variantId, data) {
  return orderClient.put(`/api/menu-items/${itemId}/variants/${variantId}`, data);
}

export function deleteVariant(itemId, variantId) {
  return orderClient.delete(`/api/menu-items/${itemId}/variants/${variantId}`);
}

export function updateAddon(restaurantId, addonId, data) {
  return orderClient.put(`/api/restaurants/${restaurantId}/addons/${addonId}`, data);
}

export function detachAddon(itemId, addonId) {
  return orderClient.delete(`/api/menu-items/${itemId}/addons/${addonId}`);
}