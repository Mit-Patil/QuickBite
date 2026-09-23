import { orderClient } from './axiosClient';

export function addToCart(data) {
  return orderClient.post('/api/cart/items', data);
}

export function getCart() {
  return orderClient.get('/api/cart');
}

export function removeCartItem(cartItemId) {
  return orderClient.delete(`/api/cart/items/${cartItemId}`);
}

export function clearCart() {
  return orderClient.delete('/api/cart');
}

export function updateCartItemQuantity(cartItemId, quantity) {
  return orderClient.put(`/api/cart/items/${cartItemId}`, { quantity });
}