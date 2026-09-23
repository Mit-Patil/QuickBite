import { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import { browseRestaurants } from "../../api/restaurantService";
import { cloudinaryResize } from '../../utils/image';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import styles from './CustomerHome.module.css';

function RestaurantCard({ restaurant }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = restaurant.imageUrl && !imageFailed;

  return (
    <Link
      to={`/customer/restaurant/${restaurant.id}`}
      className={`${styles.card} ${!restaurant.isOpen ? styles.cardClosed : ''}`}
    >
      <div className={styles.media}>
        {showImage ? (
          <img
            src={cloudinaryResize(restaurant.imageUrl, 700)}
            alt={restaurant.name}
            loading="lazy"
            className={styles.image}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className={styles.fallback} aria-hidden="true">
            {restaurant.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className={restaurant.isOpen ? styles.openBadge : styles.closedBadge}>
          {restaurant.isOpen ? 'Open' : 'Closed'}
        </span>
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>{restaurant.name}</h3>
        <p className={styles.meta}>{restaurant.cuisineType || 'Multi-cuisine'}</p>
        <p className={styles.location}>
          📍 {restaurant.city}
          {restaurant.restaurantType === 'CLOUD_KITCHEN' ? ' · Cloud kitchen' : ''}
        </p>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <div className={styles.skeletonMedia} />
      <div className={styles.body}>
        <div className={`${styles.skeletonLine} ${styles.skeletonLineWide}`} />
        <div className={styles.skeletonLine} />
      </div>
    </div>
  );
}

function CustomerHome(){
  const [restaurants, setRestaurants] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [city, setCity] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(()=>{
    loadRestaurants();
  }, [city, page]);

  async function loadRestaurants() {
    setLoading(true);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const response = await browseRestaurants(city, page, 10);
      setRestaurants(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      setError(err.message);
    }finally{
      setLoading(false);
    }
  }

  function handleSearch(e){
    e.preventDefault();
    setPage(0);
    setCity(cityInput.trim());
  }

  function handleClear(){
    setCityInput('');
    setPage(0);
    setCity('');
  }

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Restaurants</h1>
        <p className={styles.subtitle}>
          {city ? `Showing restaurants in ${city}` : 'Discover places to order from'}
        </p>
      </header>

      <form onSubmit={handleSearch} className={styles.searchForm}>
        <Input
          label="City"
          name="city"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          placeholder="Search by city, e.g. Surat"
        />
        <Button type="submit" className={styles.searchButton}>Search</Button>
      </form>

      <ErrorMessage message={error} />

      {loading ? (
        <div className={styles.grid} aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : restaurants.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No restaurants found{city ? ` in ${city}` : ''}</p>
          <p className={styles.emptyText}>Try a different city or check the spelling.</p>
          {city && (
            <button type="button" onClick={handleClear}>Show all restaurants</button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {restaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
          <span className={styles.pageInfo}>Page {page + 1} of {totalPages}</span>
          <button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}

export default CustomerHome;