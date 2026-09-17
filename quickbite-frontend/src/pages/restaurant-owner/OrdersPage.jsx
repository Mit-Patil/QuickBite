import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getOrdersForRestaurant, updateOrderStatus, cancelOrder } from '../../api/orderService';
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
      setOrders(response.data);
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

  if (loading) return <p>Loading orders...</p>;

  return (
    <div>
      <h1>Orders</h1>
      <ErrorMessage message={error} />

      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <div className={styles.list}>
          {orders.map((order) => (
            <div key={order.id} className={styles.card}>
              <div className={styles.header}>
                <span>{new Date(order.placedAt).toLocaleString()}</span>
                <span className={styles.status}>{order.status}</span>
              </div>

              <ul>
                {order.items.map((item, i) => (
                  <li key={i}>
                    {item.itemName}{item.variantName && ` (${item.variantName})`} × {item.quantity}
                  </li>
                ))}
              </ul>

              <p className={styles.total}>Total: ₹{order.totalAmount}</p>

              {order.cancellationReason && (
                <p className={styles.cancelled}>Cancelled: {order.cancellationReason}</p>
              )}

              <div className={styles.actions}>
                {(NEXT_STATUSES[order.status] || []).map((nextStatus) => (
                  <Button
                    key={nextStatus}
                    type="button"
                    loading={actioningId === order.id}
                    onClick={() => handleStatusChange(order.id, nextStatus)}
                    className={styles.actionButton}
                  >
                    Mark as {nextStatus.replace(/_/g, ' ')}
                  </Button>
                ))}
                {CANCELLABLE.includes(order.status) && (
                  <button onClick={() => handleCancel(order.id)} disabled={actioningId === order.id}>
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrdersPage;