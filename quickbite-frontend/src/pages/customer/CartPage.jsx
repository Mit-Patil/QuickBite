import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, removeCartItem, clearCart, updateCartItemQuantity } from '../../api/cartService';
import { formatPrice } from '../../utils/format';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import styles from './CartPage.module.css';

function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart(showSpinner = true) {
    if (showSpinner) setLoading(true);
    setError('');
    try {
      const response = await getCart();
      setCart(response.data);
    } catch (err) {
      setCart(null);
      if (err.status !== 400) setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(cartItemId) {
    setBusy(cartItemId);
    try {
      await removeCartItem(cartItemId);
      await loadCart(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleQuantityChange(cartItemId, newQuantity) {
    if (newQuantity < 1) return;
    setError('');
    setBusy(cartItemId);
    try {
      const response = await updateCartItemQuantity(cartItemId, newQuantity);
      setCart(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleClear() {
    if (!window.confirm('Remove everything from your cart?')) return;
    setBusy('clear');
    try {
      await clearCart();
      setCart(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <p className={styles.loading}>Loading cart...</p>;

  if (!cart || cart.items.length === 0) {
    return (
      <div>
        <h1 className={styles.title}>My Cart</h1>
        <ErrorMessage message={error} />
        <div className={styles.empty}>
          <p className={styles.emptyIcon}>🛒</p>
          <p className={styles.emptyTitle}>Your cart is empty</p>
          <p className={styles.emptyText}>Add something delicious from a restaurant to get started.</p>
          <Button type="button" className={styles.emptyButton} onClick={() => navigate('/customer')}>
            Browse restaurants
          </Button>
        </div>
      </div>
    );
  }

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>My Cart</h1>
        <p className={styles.subtitle}>
          From <strong>{cart.restaurantName}</strong> · {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </p>
      </header>

      <ErrorMessage message={error} />

      <div className={styles.layout}>
        <ul className={styles.list}>
          {cart.items.map((item) => {
            const rowBusy = busy === item.id;
            return (
              <li key={item.id} className={styles.item}>
                <div className={styles.info}>
                  <h3 className={styles.itemName}>{item.menuItemName}</h3>
                  {item.variantName && <span className={styles.variant}>{item.variantName}</span>}
                  {item.selectedAddonNames.length > 0 && (
                    <p className={styles.addons}>+ {item.selectedAddonNames.join(', ')}</p>
                  )}
                  {item.specialInstructions && (
                    <p className={styles.instructions}>Note: {item.specialInstructions}</p>
                  )}
                  <p className={styles.unitPrice}>₹{formatPrice(item.unitPrice)} each</p>

                  <div className={styles.stepper}>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={rowBusy || item.quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className={styles.qtyValue}>{rowBusy ? '…' : item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      disabled={rowBusy}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className={styles.itemRight}>
                  <p className={styles.lineTotal}>₹{formatPrice(item.lineTotal)}</p>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => handleRemove(item.id)}
                    disabled={rowBusy}
                  >
                    {rowBusy && busy === item.id ? '...' : 'Remove'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className={styles.summary}>
          <h2 className={styles.summaryTitle}>Order summary</h2>
          <div className={styles.row}>
            <span>Subtotal</span>
            <span>₹{formatPrice(cart.subtotal)}</span>
          </div>
          <p className={styles.note}>Taxes and delivery fee are calculated at checkout.</p>

          <Button type="button" onClick={() => navigate('/customer/checkout')}>
            Proceed to Checkout
          </Button>
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClear}
            disabled={busy !== null}
          >
            {busy === 'clear' ? 'Clearing...' : 'Clear cart'}
          </button>
        </aside>
      </div>
    </div>
  );
}

export default CartPage;