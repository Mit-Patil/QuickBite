import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMenuForRestaurant } from '../../api/menuItemService';
import { cloudinaryResize } from '../../utils/image';
import { formatPrice } from '../../utils/format';
import ErrorMessage from '../../components/ErrorMessage';
import Button from '../../components/Button';
import styles from './MenuPage.module.css';

function MenuItemRow({ item, restaurantId }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = item.imageUrl && !imageFailed;
  const outOfStock = !item.isStockUnlimited && item.stockQuantity === 0;

  return (
    <li className={styles.item}>
      {showImage ? (
        <img
          src={cloudinaryResize(item.imageUrl, 160)}
          alt={item.name}
          className={styles.thumb}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className={styles.thumbFallback} aria-hidden="true">🍽️</div>
      )}

      <div className={styles.info}>
        <p className={styles.name}>{item.name}</p>
        <p className={styles.meta}>{item.category || 'Uncategorised'} · ₹{formatPrice(item.price)}</p>
        <div className={styles.badges}>
          <span className={item.isAvailable ? styles.availableBadge : styles.unavailableBadge}>
            {item.isAvailable ? 'Available' : 'Unavailable'}
          </span>
          {!item.isStockUnlimited && (
            <span className={outOfStock ? styles.stockBadgeEmpty : styles.stockBadge}>
              {outOfStock ? 'Out of stock' : `${item.stockQuantity} in stock`}
            </span>
          )}
        </div>
      </div>

      <Link to={`/restaurant/${restaurantId}/menu/${item.id}/edit`} className={styles.editLink}>Edit</Link>
    </li>
  );
}

function MenuPage() {
  const { id } = useParams();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMenu();
  }, [id]);

  async function loadMenu() {
    try {
      const response = await getMenuForRestaurant(id);
      setItems(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p className={styles.loading}>Loading menu...</p>;

  return (
    <div>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Menu</h1>
          <p className={styles.subtitle}>{items.length} {items.length === 1 ? 'item' : 'items'}</p>
        </div>
        <Link to={`/restaurant/${id}/menu/new`}>
          <Button type="button" className={styles.addButton}>+ Add Menu Item</Button>
        </Link>
      </header>

      <ErrorMessage message={error} />

      {items.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No menu items yet</p>
          <p className={styles.emptyText}>Add your first dish to start taking orders.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <MenuItemRow key={item.id} item={item} restaurantId={id} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default MenuPage;