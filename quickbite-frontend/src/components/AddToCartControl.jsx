import { useState, useEffect } from 'react';
import { addToCart } from '../api/cartService';
import Button from './Button';
import ErrorMessage from './ErrorMessage';
import Checkbox from './Checkbox';
import RadioOption from './RadioOption';
import styles from './AddToCartControl.module.css';

function AddToCartControl({ item, onAdded }) {
  const hasVariants = item.variants.length > 0;
  const defaultVariant = item.variants.find((v) => v.isDefault) || item.variants[0];

  const [variantId, setVariantId] = useState(defaultVariant ? defaultVariant.id : '');
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 2000);
    return () => clearTimeout(timer);
    }, [added]);

  function toggleAddon(addonId) {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  }

  async function handleAdd() {
    setError('');
    if (hasVariants && !variantId) {
      setError('Please select an option');
      return;
    }
    setSubmitting(true);
    try {
      await addToCart({
        menuItemId: item.id,
        variantId: hasVariants ? variantId : null,
        addonIds: selectedAddonIds,
        quantity,
        specialInstructions: null,
      });
      setAdded(true);
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!item.isAvailable) {
    return <p className={styles.unavailable}>Currently unavailable</p>;
  }

  return (
    <div className={styles.control}>
      <ErrorMessage message={error} />

      {hasVariants && (
        <div className={styles.options}>
            {item.variants.map((v) => (
            <RadioOption
                key={v.id}
                label={`${v.name} — ₹${v.price}`}
                name={`variant-${item.id}`}
                value={v.id}
                checked={variantId === v.id}
                onChange={() => setVariantId(v.id)}
            />
            ))}
        </div>
      )}

        {item.addons.map((a) => (
        <Checkbox
            key={a.id}
            label={`${a.name} — ${a.price > 0 ? `₹${a.price}` : 'Free'}`}
            name={`addon-${a.id}`}
            checked={selectedAddonIds.includes(a.id)}
            onChange={() => toggleAddon(a.id)}
        />
        ))}

      <div className={styles.row}>
        <div className={styles.quantityStepper}>
          <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
          <span>{quantity}</span>
          <button type="button" onClick={() => setQuantity(quantity + 1)}>+</button>
        </div>

        <Button loading={submitting} loadingText="Adding..." type="button" onClick={handleAdd} className={styles.addButton}>
          {added ? 'Added ✓' : 'Add to Cart'}
        </Button>
      </div>
    </div>
  );
}

export default AddToCartControl;