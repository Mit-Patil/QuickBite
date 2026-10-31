export const ORDER_STATUS = {
  PENDING:            { owner: 'Payment pending',    customer: 'Placing your order',         tone: 'neutral' },
  PAYMENT_PROCESSING: { owner: 'Payment processing', customer: 'Processing payment',         tone: 'neutral' },
  CONFIRMED:          { owner: 'New order',          customer: 'Waiting for the restaurant', tone: 'warning' },
  ACCEPTED:           { owner: 'Accepted',           customer: 'Restaurant accepted',        tone: 'info',    partner: 'Restaurant accepted. Head to the restaurant.' },
  PREPARING:          { owner: 'Preparing',          customer: 'Being prepared',             tone: 'info',    partner: 'The restaurant is preparing the order.' },
  READY_FOR_PICKUP:   { owner: 'Ready for pickup',   customer: 'Ready for pickup',           tone: 'info',    partner: 'The order is ready. Pick it up.' },
  OUT_FOR_DELIVERY:   { owner: 'Out for delivery',   customer: 'On the way',                 tone: 'info',    partner: 'On the way to the customer.' },
  DELIVERED:          { owner: 'Delivered',          customer: 'Delivered',                  tone: 'success', partner: 'Delivered.' },
  CANCELLED:          { owner: 'Cancelled',          customer: 'Cancelled',                  tone: 'danger',  partner: 'The restaurant cancelled this order.' },
  PAYMENT_FAILED:     { owner: 'Payment failed',     customer: 'Payment failed',             tone: 'danger' },
};

export const statusLabel = (status, role = 'customer') =>
  ORDER_STATUS[status]?.[role] ?? status;

export const statusTone = (status) => ORDER_STATUS[status]?.tone ?? 'neutral';

export function ownerActions(order) {
  switch (order.status) {
    case 'CONFIRMED':
      return [
        { key: 'accept', label: 'Accept' },
        { key: 'reject', label: 'Reject', danger: true, prompt: 'Reason for rejecting this order:' },
      ];
    case 'ACCEPTED':
      return [
        { key: 'prepare', label: 'Start preparing', disabled: !order.deliveryPartnerId },
        { key: 'cancel', label: 'Cancel order', danger: true, prompt: 'Reason for cancellation:' },
      ];
    case 'PREPARING':
      return [
        { key: 'ready', label: 'Mark ready for pickup' },
        { key: 'cancel', label: 'Cancel order', danger: true, prompt: 'Reason for cancellation:' },
      ];
    default:
      return [];
  }
}

export const partnerStatusText = (delivery) =>
  statusLabel(delivery.status === 'CANCELLED' ? 'CANCELLED' : delivery.orderStatus, 'partner');

export function partnerActions(delivery) {
  if (delivery.status === 'CANCELLED') return [];
  switch (delivery.orderStatus) {
    case 'ACCEPTED':
    case 'PREPARING':
      return [{ key: 'pickup', label: 'Picked up', disabled: true }];
    case 'READY_FOR_PICKUP':
      return [{ key: 'pickup', label: 'Picked up' }];
    case 'OUT_FOR_DELIVERY':
      return [{ key: 'deliver', label: 'Delivered' }];
    default:
      return [];
  }
}