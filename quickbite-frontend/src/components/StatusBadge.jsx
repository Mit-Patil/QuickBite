import styles from './StatusBadge.module.css';
import { statusLabel, statusTone } from '../utils/orderStatus';

function StatusBadge({ status, role = 'customer', className = '' }) {
  return (
    <span className={`${styles.badge} ${styles[statusTone(status)]} ${className}`}>
      {statusLabel(status, role)}
    </span>
  );
}

export default StatusBadge;