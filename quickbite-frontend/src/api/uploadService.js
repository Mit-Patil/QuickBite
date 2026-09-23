import { userClient, orderClient } from './axiosClient';

export function uploadCustomerProfilePicture(file) {
  const formData = new FormData();
  formData.append('file', file);
  return userClient.post('/api/users/me/profile-picture', formData);
}

export function uploadDeliveryPartnerPicture(file) {
  const formData = new FormData();
  formData.append('file', file);
  return userClient.post('/api/users/me/delivery-partner-picture', formData);
}

export function uploadRestaurantLogo(file) {
  const formData = new FormData();
  formData.append('file', file);
  return userClient.post('/api/users/me/restaurant-logo', formData);
}

export function uploadMenuItemPicture(menuItemId, file) {
  const formData = new FormData();
  formData.append('file', file);
  return orderClient.post(`/api/menu-items/${menuItemId}/picture`, formData);
}

export function uploadRestaurantImage(restaurantId, file) {
  const formData = new FormData();
  formData.append('file', file);
  return orderClient.post(`/api/restaurants/${restaurantId}/restaurant-picture`, formData);
}