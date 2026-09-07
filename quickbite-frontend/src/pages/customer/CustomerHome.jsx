import { useEffect, useState } from "react";
import { browseRestaurants } from "../../api/restaurantService";
import {Link} from 'react-router-dom';
import Input from '../../components/Input';
import Buttton from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import styles from './CustomerHome.module.css';


function CustomerHome(){
  const [restaurants, setRestaurants] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [city, setCity] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(()=>{
    loadRestauarnts();
  }, [city, page]);

  async function loadRestauarnts() {
    setLoading(true);
    setError('');
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
    setCity(cityInput);
  }

  return (
    <div>
      <h1>Restaurants</h1>

      <form onSubmit={handleSearch} className={styles.searchForm}>
        <Input label="City" name="city" value={cityInput} onChange={(e) => setCityInput(e.target.value)} />
        <Buttton type="submit">Search</Buttton>
      </form>

      <ErrorMessage message={error} />

      {loading ? (
        <p>Loading restaurants...</p>
      ): restaurants.length === 0 ? (
        <p>No Restaurants found.</p>
      ):(
        <div className={styles.grid}>
          {restaurants.map((restaurant) =>(
            <Link key={restaurant.id} to={`/customer/restaurant/${restaurant.id}`} className={styles.card}>
              <h3>{restaurant.name}</h3>
              <p>{restaurant.cuisineType}</p>
              <p>{restaurant.city}</p>
              <span className={restaurant.isOpen ? styles.openBadge : styles.closedBadge}>
                {restaurant.isOpen ? 'Open' : 'Close'}
              </span>
            </Link>
          ))}
        </div>
      )}

        <div className={styles.pagination}>
          <button disabled={page === 0} onClick={() => setPage(page-1)}>Previous</button>
          <span>Page {page+1} of {totalPages || 1}</span>
          <button disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
    </div>

  );
}

export default CustomerHome;