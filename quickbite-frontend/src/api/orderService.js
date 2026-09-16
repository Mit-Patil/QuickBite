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