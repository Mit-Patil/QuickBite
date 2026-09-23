import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyOrders } from '../../api/orderService';
import { formatPrice, formatDateTime, shortOrderId } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import styles from './OrdersPage.module.css';

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const response = await getMyOrders();
      // newest first, whatever order the backend returns them in
      const sorted = [...response.data].sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));
      setOrders(sorted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p className={styles.loading}>Loading orders...</p>;

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>My Orders</h1>
        <p className={styles.subtitle}>Track current orders and revisit past ones</p>
      </header>

      <ErrorMessage message={error} />

      {orders.length === 0 && !error ? (
        <div className={styles.empty}>
          <p className={styles.emptyIcon}>📋</p>
          <p className={styles.emptyTitle}>No orders yet</p>
          <p className={styles.emptyText}>When you place an order, it will show up here.</p>
          <Button type="button" className={styles.emptyButton} onClick={() => navigate('/customer')}>
            Browse restaurants
          </Button>
        </div>
      ) : (
        <ul className={styles.list}>
          {orders.map((order) => (
            <li key={order.id}>
              <Link to={`/customer/orders/${order.id}`} className={styles.card}>
                <div className={styles.info}>
                  <h3 className={styles.name}>{order.restaurantName}</h3>
                  <p className={styles.meta}>{formatDateTime(order.placedAt)}</p>
                  <p className={styles.ref}>{shortOrderId(order.id)}</p>
                </div>
                <div className={styles.right}>
                  <StatusBadge status={order.status} />
                  <p className={styles.amount}>₹{formatPrice(order.totalAmount)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default OrdersPage;