const { restaurantServiceUrl } = require('../config/env');
const {
  ValidationError, ForbiddenError, NotFoundError, ConflictError, ServiceUnavailableError,
} = require('../errors/AppError');

async function readMessage(res) {
  const raw = await res.text();
  try {
    const data = JSON.parse(raw);
    return data.error || Object.values(data).join(', ');
  } catch {
    return raw;
  }
}

async function changeOrderStatus(orderId, action, authHeader) {
  let res;
  try {
    res = await fetch(`${restaurantServiceUrl}/api/orders/${orderId}/${action}`, {
      method: 'PATCH',
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new ServiceUnavailableError('Order service is not reachable, please try again');
  }

  if (res.ok) return res.json();

  const message = await readMessage(res);
  switch (res.status) {
    case 400: throw new ValidationError(message);
    case 403: throw new ForbiddenError(message || 'Not allowed');
    case 404: throw new NotFoundError(message);
    case 409: throw new ConflictError(message);
    default: throw new ServiceUnavailableError('Order service could not process the request');
  }
}

module.exports = { changeOrderStatus };