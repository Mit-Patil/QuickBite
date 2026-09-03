import { userClient } from './axiosClient';

export function registerCustomer(data) {
  return userClient.post('/api/users/register', data);
}

export function registerRestaurantOwner(data) {
  return userClient.post('/api/users/register/restaurant-owner', data);
}

export function registerDeliveryPartner(data) {
  return userClient.post('/api/users/register/delivery-partner', data);
}

export function login(credentials) {
  return userClient.post('/api/users/login', credentials);
}

export function getMe() {
  return userClient.get('/api/users/me');
}