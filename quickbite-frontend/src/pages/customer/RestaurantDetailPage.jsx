import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getRestaurantById, getMenuForRestaurant } from "../../api/restaurantService";
import ErrorMessage from "../../components/ErrorMessage";
import styles from './RestaurantDetailPage.module.css';
import AddToCartControl from "../../components/AddToCartControl";

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
                {menuItems.map((item) => (
                    <div key={item.id} className={styles.menuItem}>
                    <div className={styles.menuItemMain}>
                        <div>
                        <h4>{item.name}</h4>
                        <p>{item.description}</p>
                        <span className={item.isVeg ? styles.vegBadge : styles.nonVegBadge}>
                            {item.isVeg ? 'Veg' : 'Non-Veg'}
                        </span>
                        {!item.isAvailable && <span className={styles.unavailableBadge}>Unavailable</span>}
                        </div>

                        {item.variants.length > 0 ? (
                        <p className={styles.price}>From ₹{Math.min(...item.variants.map((v) => v.price))}</p>
                        ) : (
                        <p className={styles.price}>₹{item.price}</p>
                        )}
                    </div>

                    {item.variants.length > 0 && (
                        <div className={styles.subList}>
                        <strong>Variants:</strong>
                        <ul>
                            {item.variants.map((v) => (
                            <li key={v.id}>{v.name} — ₹{v.price}{v.isDefault && ' (default)'}</li>
                            ))}
                        </ul>
                        </div>
                    )}

                    {item.addons.length > 0 && (
                        <div className={styles.subList}>
                        <strong>Available Addons:</strong>
                        <ul>
                            {item.addons.map((a) => (
                            <li key={a.id}>{a.name} — {a.price > 0 ? `₹${a.price}` : 'Free'}</li>
                            ))}
                        </ul>
                        </div>
                    )}
                    <AddToCartControl item={item} onAdded={() => {}} />
                    </div>
                ))}
                </div>
            )}
        </div>
    );

}

export default RestaurantDetailPage;