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

export function updateCustomerProfile(data){
  return userClient.put('/api/users/me/customer', data);
}


export function updateRestaurantOwnerProfile(data){
  return userClient.put('/api/users/me/restaurant-owner', data);
}

export function updateDeliveryPartnerProfile(data) {
  return userClient.put('/api/users/me/delivery-partner', data);
}