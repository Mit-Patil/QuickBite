import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { getOrderById } from '../../api/orderService';
import { formatPrice, formatDateTime, shortOrderId } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import Notice from '../../components/Notice';
import styles from './OrderConfirmationPage.module.css';

const STEPS = [
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'PREPARING', label: 'Preparing' },
  { status: 'READY_FOR_PICKUP', label: 'Ready' },
  { status: 'OUT_FOR_DELIVERY', label: 'On the way' },
  { status: 'DELIVERED', label: 'Delivered' },
];

function getHeadline(status, justPlaced) {
  if (status === 'CANCELLED') {
    return { icon: '✖', tone: 'danger', title: 'Order cancelled', text: 'This order was cancelled.' };
  }
  if (status === 'PAYMENT_FAILED') {
    return { icon: '!', tone: 'danger', title: 'Payment failed', text: 'The payment did not go through, so this order was not placed.' };
  }
  if (status === 'DELIVERED') {
    return { icon: '🎉', tone: 'success', title: 'Delivered', text: 'Enjoy your meal!' };
  }
  if (justPlaced) {
    return { icon: '✓', tone: 'success', title: 'Order placed!', text: 'The restaurant has received your order.' };
  }
  return { icon: '🧾', tone: 'success', title: 'Order details', text: '' };
}

function OrderConfirmationPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const justPlaced = Boolean(location.state?.justPlaced);

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

  if (loading) return <p className={styles.loading}>Loading order...</p>;

  if (!order) {
    return (
      <div className={styles.wrapper}>
        <ErrorMessage message={error} />
        <Link to="/customer/orders" className={styles.backLink}>Back to my orders</Link>
      </div>
    );
  }

  const headline = getHeadline(order.status, justPlaced);
  const currentStep = STEPS.findIndex((s) => s.status === order.status);

  return (
    <div className={styles.wrapper}>
      <section className={styles.hero}>
        <div className={`${styles.icon} ${styles[headline.tone]}`}>{headline.icon}</div>
        <h1 className={styles.title}>{headline.title}</h1>
        {headline.text && <p className={styles.text}>{headline.text}</p>}
        <p className={styles.ref}>
          {shortOrderId(order.id)} · {formatDateTime(order.placedAt)}
        </p>
        <StatusBadge status={order.status} />
      </section>

      {order.status === 'CANCELLED' && order.cancellationReason && (
        <Notice variant="warning">Reason: {order.cancellationReason}</Notice>
      )}

      {currentStep >= 0 && (
        <ol className={styles.progress} aria-label="Order progress">
          {STEPS.map((step, i) => (
            <li
              key={step.status}
              className={`${styles.stepItem} ${i <= currentStep ? styles.stepDone : ''} ${i === currentStep ? styles.stepCurrent : ''}`}
            >
              <span className={styles.dot} />
              <span className={styles.stepLabel}>{step.label}</span>
            </li>
          ))}
        </ol>
      )}

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{order.restaurantName}</h2>
        <ul className={styles.itemList}>
          {order.items.map((item, i) => (
            <li key={i} className={styles.item}>
              <div className={styles.itemInfo}>
                <p className={styles.itemName}>
                  {item.quantity} × {item.itemName}
                  {item.variantName && <span className={styles.muted}> ({item.variantName})</span>}
                </p>
                {item.addons?.length > 0 && (
                  <p className={styles.itemExtra}>+ {item.addons.map((a) => a.addonName).join(', ')}</p>
                )}
                {item.specialInstructions && (
                  <p className={styles.itemExtra}>Note: {item.specialInstructions}</p>
                )}
              </div>
              <span className={styles.itemPrice}>₹{formatPrice(item.lineTotal)}</span>
            </li>
          ))}
        </ul>

        <div className={styles.row}><span>Subtotal</span><span>₹{formatPrice(order.subtotal)}</span></div>
        <div className={styles.row}><span>Taxes</span><span>₹{formatPrice(order.taxAmount)}</span></div>
        <div className={styles.row}><span>Delivery fee</span><span>₹{formatPrice(order.deliveryFee)}</span></div>
        <div className={styles.total}><span>Total</span><span>₹{formatPrice(order.totalAmount)}</span></div>
      </section>

      <div className={styles.actions}>
        <Button type="button" onClick={() => navigate('/customer')}>Order more food</Button>
        <Link to="/customer/orders" className={styles.backLink}>View all orders</Link>
      </div>
    </div>
  );
}

export default OrderConfirmationPage;