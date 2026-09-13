import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCart, removeCartItem, clearCart } from '../../api/cartService';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import styles from './CartPage.module.css';

function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
    setLoading(true);
    setError('');
    try {
      const response = await getCart();
      setCart(response.data);
    } catch (err) {
      setCart(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(cartItemId) {
    try {
      await removeCartItem(cartItemId);
      await loadCart();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleClear() {
    try {
      await clearCart();
      setCart(null);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p>Loading cart...</p>;

  if (!cart || cart.items.length === 0) {
    return (
      <div>
        <h1>My Cart</h1>
        <p>Your cart is empty.</p>
        <Link to="/customer">Browse restaurants</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>My Cart</h1>
      <h3>{cart.restaurantName}</h3>
      <ErrorMessage message={error} />

      <div className={styles.list}>
        {cart.items.map((item) => (
          <div key={item.id} className={styles.item}>
            <div>
              <h4>{item.menuItemName}{item.variantName && ` (${item.variantName})`}</h4>
              {item.selectedAddonNames.length > 0 && (
                <p className={styles.addons}>+ {item.selectedAddonNames.join(', ')}</p>
              )}
              {item.specialInstructions && <p className={styles.instructions}>Note: {item.specialInstructions}</p>}
              <p>Qty: {item.quantity} × ₹{item.unitPrice}</p>
            </div>
            <div className={styles.itemRight}>
              <p className={styles.lineTotal}>₹{item.lineTotal}</p>
              <button onClick={() => handleRemove(item.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.summary}>
        <p className={styles.subtotal}>Subtotal: ₹{cart.subtotal}</p>
        <button onClick={handleClear} className={styles.clearButton}>Clear Cart</button>
      </div>

      <Link to="/customer/checkout">
        <Button type="button">Proceed to Checkout</Button>
      </Link>
    </div>
  );
}

export default CartPage;