import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getOrdersForRestaurant, runOwnerAction } from '../../api/orderService';
import { formatPrice, formatDateTime, shortOrderId } from '../../utils/format';
import { ownerActions } from '../../utils/orderStatus';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import styles from './OrdersPage.module.css';

const POLL_MS = 10000;

function OrdersPage() {
  const { id } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState(null);

  const latestLoad = useRef(0);


  useEffect(() => {
    loadOrders();
    const timer = setInterval(() => {
      if (!document.hidden) loadOrders();
    }, POLL_MS);    
    return () => clearInterval(timer);
  }, [id]);

  async function loadOrders() {
    const thisLoad = ++latestLoad.current;
    try {
      const response = await getOrdersForRestaurant(id);
      if (thisLoad !== latestLoad.current) return;
      const sorted = [...response.data].sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));
      setOrders(sorted);
    } catch (err) {
      if(thisLoad == latestLoad.current) setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(order, action) {
    let reason;
    if (action.prompt) {
      reason = window.prompt(action.prompt)?.trim();
      if (!reason) return;
    }

    setError('');
    setActioningId(order.id);
    try {
      const response = await runOwnerAction(action.key, order.id, reason);
      latestLoad.current += 1;
      setOrders((prev) => prev.map((o) => (o.id === order.id ? response.data : o)));
    } catch (err) {
      setError(err.message);
      loadOrders();
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
            const actions = ownerActions(order);

            return (
              <li key={order.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.ref}>{shortOrderId(order.id)}</p>
                    <p className={styles.date}>{formatDateTime(order.placedAt)}</p>
                  </div>
                  <StatusBadge status={order.status} role="owner" />
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

                {order.status === 'CONFIRMED' && (
                  <p className={styles.muted}>Accept within 2 minutes or the order is cancelled.</p>
                )}
                {order.status === 'ACCEPTED' && (
                  <p className={styles.muted}>
                    {order.deliveryPartnerId ? 'Delivery partner assigned' : 'Finding a delivery partner…'}
                  </p>
                )}

                {order.cancellationReason && (
                  <p className={styles.cancelReason}>Cancelled: {order.cancellationReason}</p>
                )}

                {actions.length > 0 && (
                  <div className={styles.actions}>
                    {actions.map((action) =>
                      action.danger ? (
                        <button
                          key={action.key}
                          type="button"
                          className={styles.cancelButton}
                          onClick={() => handleAction(order, action)}
                          disabled={busy}
                        >
                          {action.label}
                        </button>
                      ) : (
                        <Button
                          key={action.key}
                          type="button"
                          loading={busy}
                          loadingText="Updating..."
                          disabled={busy || action.disabled}
                          onClick={() => handleAction(order, action)}
                          className={styles.actionButton}
                        >
                          {action.label}
                        </Button>
                      )
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