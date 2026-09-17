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