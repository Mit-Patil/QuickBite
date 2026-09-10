import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMenuForRestaurant } from '../../api/menuItemService';
import ErrorMessage from '../../components/ErrorMessage';
import styles from './MenuPage.module.css';

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

  if (loading) return <p>Loading menu...</p>;

  return (
    <div>
      <h1>Menu</h1>
      <ErrorMessage message={error} />

      {items.length === 0 ? (
        <p>No menu items yet.</p>
      ) : (
        <div className={styles.list}>
          {items.map((item) => (
            <div key={item.id} className={styles.item}>
              <div>
                <h4>{item.name}</h4>
                <p>{item.category}</p>
                <span className={item.isAvailable ? styles.availableBadge : styles.unavailableBadge}>
                  {item.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <p className={styles.price}>₹{item.price}</p>
              <Link to={`/restaurant/${id}/menu/${item.id}/edit`}>Edit</Link>
            </div>
          ))}
        </div>
      )}

      <Link to={`/restaurant/${id}/menu/new`} className={styles.addLink}>+ Add Menu Item</Link>
    </div>
  );
}

export default MenuPage;