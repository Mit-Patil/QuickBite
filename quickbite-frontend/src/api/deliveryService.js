import { deliveryClient } from './axiosClient';

export const reportLocation = (lat, lng) =>
  deliveryClient.post('/api/delivery/location', { lat, lng });

export const goOffline = () => deliveryClient.post('/api/delivery/offline');

export const getCurrentOffer = () => deliveryClient.get('/api/delivery/offers/current');

export const acceptOffer = (orderId) =>
  deliveryClient.post(`/api/delivery/offers/${orderId}/accept`);

export const declineOffer = (orderId) =>
  deliveryClient.post(`/api/delivery/offers/${orderId}/decline`);

export const getCurrentDelivery = () => deliveryClient.get('/api/delivery/orders/current');

export const pickUpOrder = (orderId) =>
  deliveryClient.post(`/api/delivery/orders/${orderId}/pickup`);

export const deliverOrder = (orderId) =>
  deliveryClient.post(`/api/delivery/orders/${orderId}/deliver`);

export function runDeliveryAction(key, orderId) {
  switch (key) {
    case 'pickup':  return pickUpOrder(orderId);
    case 'deliver': return deliverOrder(orderId);
    default:        throw new Error(`Unknown action: ${key}`);
  }
}

export const getAdminPartners = () => deliveryClient.get('/api/delivery/admin/partners');

export const getDeliveryHistory = ({ month, page, size, status }) =>
  deliveryClient.get('/api/delivery/history', { params: { month, page, size, status } });

export const getAdminDeliveryHistory = ({ partnerId, month, page, size, status }) =>
  deliveryClient.get('/api/delivery/admin/history', { params: { partnerId, month, page, size, status } });