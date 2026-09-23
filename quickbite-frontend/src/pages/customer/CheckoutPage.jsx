import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCart } from '../../api/cartService';
import { getAddress } from '../../api/addressService';
import { placeOrder } from '../../api/orderService';
import { formatPrice } from '../../utils/format';
import Select from '../../components/Select';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import Notice from '../../components/Notice';
import styles from './CheckoutPage.module.css';

const TAX_RATE = 0.05;
const DELIVERY_FEE = 30;

const PAYMENT_HINTS = {
  COD: 'Pay in cash when your order arrives.',
  CARD: 'Online payment is simulated in this demo.',
  UPI: 'Online payment is simulated in this demo.',
  WALLET: 'Online payment is simulated in this demo.',
};

function CheckoutPage() {
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [cartResult, addressResult] = await Promise.allSettled([getCart(), getAddress()]);

    if (cartResult.status === 'fulfilled') {
      setCart(cartResult.value.data);
    } else if (cartResult.reason.status !== 400) {
      setError(cartResult.reason.message);
    }

    if (addressResult.status === 'fulfilled') {
      const list = addressResult.value.data;
      setAddresses(list);
      const preferred = list.find((a) => a.isDefault) || list[0];
      if (preferred) setSelectedAddressId(preferred.id);
    } else {
      setError(addressResult.reason.message);
    }

    setLoading(false);
  }

  async function handlePlaceOrder() {
    setError('');
    if (!selectedAddressId) {
      setError('Please select a delivery address');
      return;
    }
    setPlacing(true);
    try {
      const response = await placeOrder({
        deliveryAddressId: selectedAddressId,
        paymentMethod,
      });
      navigate(`/customer/orders/${response.data.id}`, { state: { justPlaced: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  }

  if (loading) return <p className={styles.loading}>Loading checkout...</p>;

  if (!cart || cart.items.length === 0) {
    return (
      <div>
        <h1 className={styles.title}>Checkout</h1>
        <ErrorMessage message={error} />
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Your cart is empty</p>
          <p className={styles.emptyText}>Add something before checking out.</p>
          <Button type="button" className={styles.emptyButton} onClick={() => navigate('/customer')}>
            Browse restaurants
          </Button>
        </div>
      </div>
    );
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const subtotal = Number(cart.subtotal);
  const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = subtotal + taxAmount + DELIVERY_FEE;

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Checkout</h1>
        <p className={styles.subtitle}>
          Ordering from <strong>{cart.restaurantName}</strong>
        </p>
      </header>

      <ErrorMessage message={error} />

      <div className={styles.layout}>
        <div className={styles.steps}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}><span className={styles.step}>1</span> Delivery address</h2>

            {addresses.length === 0 ? (
              <>
                <Notice variant="warning">You have no saved addresses. Add one to place your order.</Notice>
                <Button type="button" className={styles.inlineButton} onClick={() => navigate('/customer/addresses')}>
                  Add an address
                </Button>
              </>
            ) : (
              <>
                <Select
                  label="Deliver to"
                  name="address"
                  value={selectedAddressId}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                  options={addresses.map((a) => ({
                    value: a.id,
                    label: `${a.addressLine}, ${a.city} - ${a.pincode}${a.isDefault ? ' (default)' : ''}`,
                  }))}
                />
                {selectedAddress && selectedAddress.latitude == null && (
                  <Notice variant="warning">
                    This address has no map location, so the delivery partner may not find you.
                    Edit it under Addresses to add a pin.
                  </Notice>
                )}
                <Link to="/customer/addresses" className={styles.manage}>Manage addresses</Link>
              </>
            )}
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}><span className={styles.step}>2</span> Payment method</h2>
            <Select
              label="Pay with"
              name="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: 'COD', label: 'Cash on Delivery' },
                { value: 'CARD', label: 'Card' },
                { value: 'UPI', label: 'UPI' },
                { value: 'WALLET', label: 'Wallet' },
              ]}
            />
            <p className={styles.hint}>{PAYMENT_HINTS[paymentMethod]}</p>
          </section>
        </div>

        <aside className={styles.summary}>
          <h2 className={styles.cardTitle}>Order summary</h2>

          <ul className={styles.itemList}>
            {cart.items.map((item) => (
              <li key={item.id} className={styles.summaryItem}>
                <span className={styles.itemText}>
                  {item.quantity} × {item.menuItemName}
                  {item.variantName && <span className={styles.itemVariant}> ({item.variantName})</span>}
                </span>
                <span>₹{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <div className={styles.row}><span>Subtotal</span><span>₹{formatPrice(subtotal)}</span></div>
          <div className={styles.row}><span>Taxes ({Math.round(TAX_RATE * 100)}%)</span><span>₹{formatPrice(taxAmount)}</span></div>
          <div className={styles.row}><span>Delivery fee</span><span>₹{formatPrice(DELIVERY_FEE)}</span></div>
          <div className={styles.total}><span>Total</span><span>₹{formatPrice(total)}</span></div>
          <p className={styles.note}>Final amounts are confirmed when the order is placed.</p>

          <Button loading={placing} loadingText="Placing order..." type="button" onClick={handlePlaceOrder}>
            Place Order
          </Button>
          <Link to="/customer/cart" className={styles.backLink}>Edit cart</Link>
        </aside>
      </div>
    </div>
  );
}

export default CheckoutPage;