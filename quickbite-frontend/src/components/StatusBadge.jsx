import styles from './StatusBadge.module.css';

const STATUS_META = {
  PENDING: { label: 'Pending', tone: 'neutral' },
  PAYMENT_PROCESSING: { label: 'Processing payment', tone: 'neutral' },
  CONFIRMED: { label: 'Confirmed', tone: 'info' },
  PREPARING: { label: 'Preparing', tone: 'warm' },
  READY_FOR_PICKUP: { label: 'Ready for pickup', tone: 'warm' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', tone: 'info' },
  DELIVERED: { label: 'Delivered', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'danger' },
  PAYMENT_FAILED: { label: 'Payment failed', tone: 'danger' },
};

function StatusBadge({ status, className = '' }) {
  const meta = STATUS_META[status] || { label: status, tone: 'neutral' };
  return <span className={`${styles.badge} ${styles[meta.tone]} ${className}`}>{meta.label}</span>;
}

export default StatusBadge;