import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getRestaurantById, getMenuForRestaurant } from "../../api/restaurantService";
import ErrorMessage from "../../components/ErrorMessage";
import styles from './RestaurantDetailPage.module.css';

function RestaurantDetailPage(){
    const {id} = useParams();

    const [restaurant, setRestaurant] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() =>{
        loadData();
    }, [id]);

    async function loadData() {
        setLoading(true);
        setError('');
        try {
            const [restaurantRes, menuRes] = await Promise.all([
                getRestaurantById(id),
                getMenuForRestaurant(id),
            ]);

            setRestaurant(restaurantRes.data);
            setMenuItems(menuRes.data);
        } catch (err) {
            setError(err);
        }finally{
            setLoading(false);
        }
    }

    if(loading) return <p>Loading restaurant...</p>;

    return (
        <div>
            <ErrorMessage message={error} />

            {restaurant && (
                <div className={styles.header}>
                    <h1>{restaurant.name}</h1>
                    <p>{restaurant.cusinType} . {restaurant.city}</p>
                    <span className={restaurant.isOpen ? styles.openBadge : styles.closedBadge}>
                        {restaurant.isOpen ? 'Open' : 'Closed'}
                    </span>
                </div>
            )}

            <h2>Menu</h2>
            {menuItems.length === 0 ? (
                <p>No menu items available.</p>
            ):(
                <div className={styles.menuList}>
                    {menuItems.map((item) =>(
                        <div key={item.id} className={styles.menuItem}>
                            <div>
                                <h4>{item.name}</h4>
                                <p>{item.description}</p>
                                <span className={item.isVeg ? styles.vegBadge : styles.nonVegBadge}>
                                    {item.isVeg ? 'Veg' : 'Non-Veg'}
                                </span>
                            </div>
                            <p className={styles.price}>Rs.{item.price}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

}

export default RestaurantDetailPage;