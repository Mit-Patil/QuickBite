import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getOrdersForRestaurant, updateOrderStatus, cancelOrder } from '../../api/orderService';
import { formatPrice, formatDateTime, shortOrderId } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import styles from './OrdersPage.module.css';

const NEXT_STATUSES = {
  CONFIRMED: ['PREPARING'],
  PREPARING: ['READY_FOR_PICKUP'],
  READY_FOR_PICKUP: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
};

const CANCELLABLE = ['CONFIRMED', 'PREPARING'];

function OrdersPage() {
  const { id } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, [id]);

  async function loadOrders() {
    try {
      const response = await getOrdersForRestaurant(id);
      const sorted = [...response.data].sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));
      setOrders(sorted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(orderId, status) {
    setError('');
    setActioningId(orderId);
    try {
      const response = await updateOrderStatus(orderId, status);
      setOrders(orders.map((o) => (o.id === orderId ? response.data : o)));
    } catch (err) {
      setError(err.message);
    } finally {
      setActioningId(null);
    }
  }

  async function handleCancel(orderId) {
    const reason = window.prompt('Reason for cancellation:');
    if (!reason) return;

    setError('');
    setActioningId(orderId);
    try {
      const response = await cancelOrder(orderId, reason);
      setOrders(orders.map((o) => (o.id === orderId ? response.data : o)));
    } catch (err) {
      setError(err.message);
    } finally {
      setActioningId(null);
    }
  }

  if (loading) return <p className={styles.loading}>Loading orders...</p>;

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Orders</h1>
        <p className={styles.subtitle}>{orders.length} {orders.length === 1 ? 'order' : 'orders'} total</p>
      </header>

      <ErrorMessage message={error} />

      {orders.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No orders yet</p>
          <p className={styles.emptyText}>Orders placed for this restaurant will show up here.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {orders.map((order) => {
            const busy = actioningId === order.id;
            const nextStatuses = NEXT_STATUSES[order.status] || [];

            return (
              <li key={order.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.ref}>{shortOrderId(order.id)}</p>
                    <p className={styles.date}>{formatDateTime(order.placedAt)}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <ul className={styles.itemList}>
                  {order.items.map((item, i) => (
                    <li key={i} className={styles.itemRow}>
                      {item.quantity} × {item.itemName}
                      {item.variantName && <span className={styles.muted}> ({item.variantName})</span>}
                    </li>
                  ))}
                </ul>

                <p className={styles.total}>Total: ₹{formatPrice(order.totalAmount)}</p>

                {order.cancellationReason && (
                  <p className={styles.cancelReason}>Cancelled: {order.cancellationReason}</p>
                )}

                {(nextStatuses.length > 0 || CANCELLABLE.includes(order.status)) && (
                  <div className={styles.actions}>
                    {nextStatuses.map((nextStatus) => (
                      <Button
                        key={nextStatus}
                        type="button"
                        loading={busy}
                        loadingText="Updating..."
                        disabled={busy}
                        onClick={() => handleStatusChange(order.id, nextStatus)}
                        className={styles.actionButton}
                      >
                        Mark as {nextStatus.replace(/_/g, ' ')}
                      </Button>
                    ))}
                    {CANCELLABLE.includes(order.status) && (
                      <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={() => handleCancel(order.id)}
                        disabled={busy}
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default OrdersPage;