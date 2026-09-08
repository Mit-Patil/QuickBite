import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyRestaurants } from '../../api/restaurantService';
import ErrorMessage from '../../components/ErrorMessage';
import styles from './RestaurantDashboard.module.css';

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

  if (loading) return <p>Loading your restaurants...</p>;

  return (
    <div>
      <h1>My Restaurants</h1>
      <ErrorMessage message={error} />

      {restaurants.length === 0 ? (
        <p>You haven't added a restaurant yet.</p>
      ) : (
        <div className={styles.list}>
          {restaurants.map((r) => (
            <div key={r.id} className={styles.card}>
              <h3>{r.name}</h3>
              <p>{r.cuisineType} · {r.city}</p>
              <span className={r.isOpen ? styles.openBadge : styles.closedBadge}>
                {r.isOpen ? 'Open' : 'Closed'}
              </span>
              <div className={styles.actions}>
                <Link to={`/restaurant/${r.id}/edit`}>Edit</Link>
                <Link to={`/restaurant/${r.id}/menu`}>Manage Menu</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link to="/restaurant/new" className={styles.addLink}>+ Add New Restaurant</Link>
    </div>
  );
}

export default RestaurantDashboard;