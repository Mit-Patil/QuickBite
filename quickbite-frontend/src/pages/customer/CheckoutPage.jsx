import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart } from '../../api/cartService';
import { getAddress } from '../../api/addressService';
import { placeOrder } from '../../api/orderService';
import Select from '../../components/Select';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import styles from './CheckoutPage.module.css';

const TAX_RATE = 0.05;
const DELIVERY_FEE = 30;

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
    try {
      const [cartRes, addressesRes] = await Promise.all([getCart(), getAddress()]);
      setCart(cartRes.data);
      setAddresses(addressesRes.data);
      const defaultAddress = addressesRes.data.find((a) => a.isDefault) || addressesRes.data[0];
      if (defaultAddress) setSelectedAddressId(defaultAddress.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
      navigate(`/customer/orders/${response.data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  }

  if (loading) return <p>Loading checkout...</p>;

  if (!cart || cart.items.length === 0) {
    return <p>Your cart is empty. Add something before checking out.</p>;
  }

  const taxAmount = (cart.subtotal * TAX_RATE).toFixed(2);
  const total = (cart.subtotal + Number(taxAmount) + DELIVERY_FEE).toFixed(2);

  return (
    <div className={styles.wrapper}>
      <h1>Checkout</h1>
      <ErrorMessage message={error} />

      <h3>{cart.restaurantName}</h3>
      <ul className={styles.itemList}>
        {cart.items.map((item) => (
          <li key={item.id}>
            {item.menuItemName}{item.variantName && ` (${item.variantName})`} × {item.quantity} — ₹{item.lineTotal}
          </li>
        ))}
      </ul>

      {addresses.length === 0 ? (
        <p>You have no saved addresses. Please add one before checking out.</p>
      ) : (
        <Select
          label="Delivery Address"
          name="address"
          value={selectedAddressId}
          onChange={(e) => setSelectedAddressId(e.target.value)}
          options={addresses.map((a) => ({
            value: a.id,
            label: `${a.addressLine}, ${a.city} - ${a.pincode}${a.isDefault ? ' (default)' : ''}`,
          }))}
        />
      )}

      <Select
        label="Payment Method"
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

      <div className={styles.summary}>
        <p>Subtotal: ₹{cart.subtotal}</p>
        <p>Tax: ₹{taxAmount}</p>
        <p>Delivery Fee: ₹{DELIVERY_FEE}</p>
        <p className={styles.total}>Total: ₹{total}</p>
      </div>

      <Button loading={placing} loadingText="Placing order..." type="button" onClick={handlePlaceOrder}>
        Place Order
      </Button>
    </div>
  );
}

export default CheckoutPage;