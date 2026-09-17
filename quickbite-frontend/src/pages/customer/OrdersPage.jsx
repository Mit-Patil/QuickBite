import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../../api/orderService';
import ErrorMessage from '../../components/ErrorMessage';
import styles from './OrdersPage.module.css';

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const response = await getMyOrders();
      setOrders(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p>Loading orders...</p>;

  return (
    <div>
      <h1>My Orders</h1>
      <ErrorMessage message={error} />

      {orders.length === 0 ? (
        <p>You haven't placed any orders yet.</p>
      ) : (
        <div className={styles.list}>
          {orders.map((order) => (
            <Link key={order.id} to={`/customer/orders/${order.id}`} className={styles.card}>
              <div>
                <h4>{order.restaurantName}</h4>
                <p>{new Date(order.placedAt).toLocaleString()}</p>
              </div>
              <div className={styles.right}>
                <span className={styles[`status-${order.status}`] || styles.statusDefault}>
                  {order.status}
                </span>
                <p className={styles.total}>₹{order.totalAmount}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrdersPage;