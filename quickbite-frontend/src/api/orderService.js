import { orderClient } from './axiosClient';

export function placeOrder(data) {
  return orderClient.post('/api/orders', data);
}

export function getMyOrders() {
  return orderClient.get('/api/orders');
}

export function getOrderById(id) {
  return orderClient.get(`/api/orders/${id}`);
}

export function getOrdersForRestaurant(restaurantId) {
  return orderClient.get(`/api/restaurants/${restaurantId}/orders`);
}

export function updateOrderStatus(orderId, status) {
  return orderClient.patch(`/api/orders/${orderId}/status`, { status });
}

export function cancelOrder(orderId, reason) {
  return orderClient.patch(`/api/orders/${orderId}/cancel`, { reason });
}

export const acceptOrder = (orderId) =>
  orderClient.patch(`/api/orders/${orderId}/accept`);

export const rejectOrder = (orderId, reason) =>
  orderClient.patch(`/api/orders/${orderId}/reject`, { reason });

export function runOwnerAction(key, orderId, reason) {
  switch (key) {
    case 'accept':  return acceptOrder(orderId);
    case 'reject':  return rejectOrder(orderId, reason);
    case 'cancel':  return cancelOrder(orderId, reason);
    case 'prepare': return updateOrderStatus(orderId, 'PREPARING');
    case 'ready':   return updateOrderStatus(orderId, 'READY_FOR_PICKUP');
    default:        throw new Error(`Unknown action: ${key}`);
  }
}