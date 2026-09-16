import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderById } from '../../api/orderService';
import ErrorMessage from '../../components/ErrorMessage';
import styles from './CheckoutPage.module.css';

function OrderConfirmationPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function loadOrder() {
    try {
      const response = await getOrderById(orderId);
      setOrder(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p>Loading order...</p>;

  return (
    <div className={styles.wrapper}>
      <ErrorMessage message={error} />
      {order && (
        <>
          <h1>Order Confirmed</h1>
          <p>Status: {order.status}</p>
          <h3>{order.restaurantName}</h3>
          <ul className={styles.itemList}>
            {order.items.map((item, i) => (
              <li key={i}>
                {item.itemName}{item.variantName && ` (${item.variantName})`} × {item.quantity} — ₹{item.lineTotal}
                {item.addons.length > 0 && (
                  <span> (+ {item.addons.map((a) => a.addonName).join(', ')})</span>
                )}
              </li>
            ))}
          </ul>
          <div className={styles.summary}>
            <p>Subtotal: ₹{order.subtotal}</p>
            <p>Tax: ₹{order.taxAmount}</p>
            <p>Delivery Fee: ₹{order.deliveryFee}</p>
            <p className={styles.total}>Total: ₹{order.totalAmount}</p>
          </div>
          <Link to="/customer/orders">View all orders</Link>
        </>
      )}
    </div>
  );
}

export default OrderConfirmationPage;