import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyRestaurants } from '../../api/restaurantService';
import { cloudinaryResize } from '../../utils/image';
import ErrorMessage from '../../components/ErrorMessage';
import Button from '../../components/Button';
import styles from './RestaurantDashboard.module.css';

function RestaurantCard({ r }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = r.imageUrl && !imageFailed;

  return (
    <div className={`${styles.card} ${!r.isOpen ? styles.cardClosed : ''}`}>
      <div className={styles.media}>
        {showImage ? (
          <img
            src={cloudinaryResize(r.imageUrl, 500)}
            alt={r.name}
            loading="lazy"
            className={styles.image}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className={styles.fallback} aria-hidden="true">{r.name.charAt(0).toUpperCase()}</div>
        )}
        <span className={r.isOpen ? styles.openBadge : styles.closedBadge}>
          {r.isOpen ? 'Open' : 'Closed'}
        </span>
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>{r.name}</h3>
        <p className={styles.meta}>{r.cuisineType || 'Multi-cuisine'} · {r.city}</p>

        <div className={styles.actions}>
          <Link to={`/restaurant/${r.id}/edit`} className={styles.actionLink}>Edit</Link>
          <Link to={`/restaurant/${r.id}/menu`} className={styles.actionLink}>Manage Menu</Link>
          <Link to={`/restaurant/${r.id}/orders`} className={styles.actionLink}>View Orders</Link>
        </div>
      </div>
    </div>
  );
}

function RestaurantDashboard() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRestaurants();
  }, []);

  async function loadRestaurants() {
    try {
      const response = await getMyRestaurants();
      setRestaurants(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p className={styles.loading}>Loading your restaurants...</p>;

  return (
    <div>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>My Restaurants</h1>
          <p className={styles.subtitle}>{restaurants.length} {restaurants.length === 1 ? 'restaurant' : 'restaurants'}</p>
        </div>
        <Link to="/restaurant/new">
          <Button type="button" className={styles.addButton}>+ Add New Restaurant</Button>
        </Link>
      </header>

      <ErrorMessage message={error} />

      {restaurants.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No restaurants yet</p>
          <p className={styles.emptyText}>Add your first restaurant to start receiving orders.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {restaurants.map((r) => <RestaurantCard key={r.id} r={r} />)}
        </div>
      )}
    </div>
  );
}

export default RestaurantDashboard;