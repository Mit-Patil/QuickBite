const { orderServiceUrl } = require('../config/env');
const { ServiceUnavailableError } = require('../errors/AppError');

async function getOrderForCustomer(token, orderId) {
  let response;
  try {
    response = await fetch(`${orderServiceUrl}/api/orders/${orderId}`, {
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

module.exports = { getOrderForCustomer };