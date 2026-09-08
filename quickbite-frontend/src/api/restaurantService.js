import { orderClient } from './axiosClient';

export function browseRestaurants(city, page = 0, size = 10) {
  return orderClient.get('/api/restaurants', {
    params: { city: city || undefined, page, size },
  });
}

export function getRestaurantById(id){
    return orderClient.get(`/api/restaurants/${id}`);
}

export function getMenuForRestaurant(id){
    return orderClient.get(`/api/restaurants/${id}/menu-items`);
}

export function createRestaurant(data) {
  return orderClient.post('/api/restaurants', data);
}

export function getMyRestaurants() {
  return orderClient.get('/api/restaurants/my');
}

export function updateRestaurant(id, data) {
  return orderClient.put(`/api/restaurants/${id}`, data);
}