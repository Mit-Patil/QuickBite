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