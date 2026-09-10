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