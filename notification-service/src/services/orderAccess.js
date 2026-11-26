const { orderServiceUrl } = require('../config/env');
const { ServiceUnavailableError } = require('../errors/AppError');

async function fetchAsUser(token, path) {
  let response;
  try {
    response = await fetch(`${orderServiceUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(3000),
    });
  } catch (err) {
    throw new ServiceUnavailableError('Order service not reachable');
  }
  if (response.status === 200) return response.json();
  if (response.status >= 500) throw new ServiceUnavailableError('Order service failed');
  return null;
}

const getOrderForCustomer = (token, orderId) => fetchAsUser(token, `/api/orders/${orderId}`);

async function ownsRestaurant(token, restaurantId) {
  const restaurants = await fetchAsUser(token, '/api/restaurants/my');
  return Array.isArray(restaurants)
    && restaurants.some((restaurant) => String(restaurant.id).toLowerCase() === restaurantId);
}

module.exports = { getOrderForCustomer, ownsRestaurant };