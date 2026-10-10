const { restaurantServiceUrl } = require('../config/env');
const { NotFoundError } = require('../errors/AppError');
const { withRetry } = require('../utils/retry');

async function getRestaurantLocation(restaurantId) {
  return withRetry(async () => {
    const res = await fetch(`${restaurantServiceUrl}/api/restaurants/${restaurantId}`, {
      signal: AbortSignal.timeout(3000),
    });

    if (res.status === 404) throw new NotFoundError(`Restaurant ${restaurantId} not found`);
    if (!res.ok) throw new Error(`Restaurant service responded ${res.status}`);

    const { latitude, longitude } = await res.json();
    return { latitude, longitude };
  });
}

module.exports = { getRestaurantLocation };