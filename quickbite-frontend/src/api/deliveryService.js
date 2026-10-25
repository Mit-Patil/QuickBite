import { deliveryClient } from './axiosClient';

export const reportLocation = (lat, lng) =>
  deliveryClient.post('/api/delivery/location', { lat, lng });

export const goOffline = () => deliveryClient.post('/api/delivery/offline');

export const getCurrentOffer = () => deliveryClient.get('/api/delivery/offers/current');

export const acceptOffer = (orderId) =>
  deliveryClient.post(`/api/delivery/offers/${orderId}/accept`);

export const declineOffer = (orderId) =>
  deliveryClient.post(`/api/delivery/offers/${orderId}/decline`);