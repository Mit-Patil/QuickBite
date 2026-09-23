import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getRestaurantById, getMenuForRestaurant } from "../../api/restaurantService";
import { cloudinaryResize } from "../../utils/image";
import { formatPrice, formatTime } from "../../utils/format";
import AddToCartControl from "../../components/AddToCartControl";
import Button from "../../components/Button";
import Checkbox from "../../components/Checkbox";
import ErrorMessage from "../../components/ErrorMessage";
import Notice from "../../components/Notice";
import styles from './RestaurantDetailPage.module.css';

function MenuItemCard({ item, onAdded }) {
    const [imageFailed, setImageFailed] = useState(false);

    const variants = item.variants ?? [];
    const addons = item.addons ?? [];
    const hasVariants = variants.length > 0;
    const soldOut = !item.isAvailable || (!item.isStockUnlimited && item.stockQuantity === 0);
    const startingPrice = hasVariants
        ? Math.min(...variants.map((v) => Number(v.price)))
        : Number(item.price);

    const hintParts = [];
    if (hasVariants) hintParts.push(`${variants.length} ${variants.length === 1 ? 'variant' : 'variants'}`);
    if (addons.length > 0) hintParts.push(`${addons.length} ${addons.length === 1 ? 'add-on' : 'add-ons'}`);

    return (
        <li className={`${styles.item} ${soldOut ? styles.itemSoldOut : ''}`}>
            <div className={styles.itemTop}>
                <div className={styles.itemText}>
                    <span
                        role="img"
                        aria-label={item.isVeg ? 'Vegetarian' : 'Non-vegetarian'}
                        className={`${styles.vegMark} ${item.isVeg ? styles.veg : styles.nonVeg}`}
                    />
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <p className={styles.price}>{hasVariants && 'From '}₹{formatPrice(startingPrice)}</p>
                    {item.description && <p className={styles.description}>{item.description}</p>}
                    {hintParts.length > 0 && (
                        <p className={styles.hint}>Customisable · {hintParts.join(' · ')}</p>
                    )}
                </div>

                {imageFailed || !item.imageUrl ? (
                    <div className={styles.itemImageFallback} aria-hidden="true">🍽️</div>
                ) : (
                    <img
                        src={cloudinaryResize(item.imageUrl, 240)}
                        alt={item.name}
                        loading="lazy"
                        className={styles.itemImage}
                        onError={() => setImageFailed(true)}
                    />
                )}
            </div>

            <AddToCartControl item={item} onAdded={onAdded} />
        </li>
    );
}

function RestaurantDetailPage(){
    const { id } = useParams();
    const navigate = useNavigate();

    const [restaurant, setRestaurant] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [vegOnly, setVegOnly] = useState(false);
    const [heroFailed, setHeroFailed] = useState(false);
    const [addedCount, setAddedCount] = useState(0);

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
            setError(err.message);
        }finally{
            setLoading(false);
        }
    }

    if (loading) return <p className={styles.loading}>Loading restaurant...</p>;

    if (!restaurant) {
        return (
            <div>
                <ErrorMessage message={error} />
                <Link to="/customer" className={styles.back}>← All restaurants</Link>
            </div>
        );
    }

    const visibleItems = vegOnly ? menuItems.filter((item) => item.isVeg) : menuItems;

    // group by category, keeping the order categories first appear in
    const groups = new Map();
    for (const item of visibleItems) {
        const key = item.category?.trim() || 'Other';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(item);
    }

    const hours = restaurant.twentyFourSeven
        ? 'Open 24/7'
        : `${formatTime(restaurant.openingTime)} – ${formatTime(restaurant.closingTime)}`;

    return (
        <div>
            <Link to="/customer" className={styles.back}>← All restaurants</Link>

            <ErrorMessage message={error} />

            <header className={`${styles.hero} ${!restaurant.isOpen ? styles.heroClosed : ''}`}>
                {restaurant.imageUrl && !heroFailed && (
                    <img
                        src={cloudinaryResize(restaurant.imageUrl, 1200)}
                        alt={restaurant.name}
                        className={styles.heroImage}
                        onError={() => setHeroFailed(true)}
                    />
                )}
                <div className={styles.heroOverlay} />

                <div className={styles.heroContent}>
                    <span className={restaurant.isOpen ? styles.openBadge : styles.closedBadge}>
                        {restaurant.isOpen ? 'Open' : 'Closed'}
                    </span>
                    <h1 className={styles.heroTitle}>{restaurant.name}</h1>
                    <p className={styles.heroSub}>
                        {restaurant.cuisineType || 'Multi-cuisine'}
                        {restaurant.restaurantType === 'CLOUD_KITCHEN' ? ' · Cloud kitchen' : ''}
                    </p>
                    <div className={styles.metaRow}>
                        <span>📍 {restaurant.addressLine}, {restaurant.city}</span>
                        <span>🕒 {hours}</span>
                    </div>
                </div>
            </header>

            {restaurant.description && <p className={styles.about}>{restaurant.description}</p>}

            {!restaurant.isOpen && (
                <Notice variant="warning">
                    This restaurant is closed right now. You can browse the menu, but ordering is unavailable.
                </Notice>
            )}

            <div className={styles.toolbar}>
                <h2 className={styles.menuTitle}>Menu</h2>
                <Checkbox
                    label="Veg only"
                    name="vegOnly"
                    checked={vegOnly}
                    onChange={(e) => setVegOnly(e.target.checked)}
                />
            </div>

            {groups.size === 0 ? (
                <div className={styles.empty}>
                    <p className={styles.emptyTitle}>
                        {vegOnly ? 'No vegetarian items on this menu' : 'No menu items yet'}
                    </p>
                    <p className={styles.emptyText}>
                        {vegOnly ? 'Turn off the filter to see everything.' : 'Check back soon.'}
                    </p>
                </div>
            ) : (
                [...groups.entries()].map(([category, items]) => (
                    <section key={category} className={styles.category}>
                        <h3 className={styles.categoryTitle}>{category}</h3>
                        <ul className={styles.menuList}>
                            {items.map((item) => (
                                <MenuItemCard
                                    key={item.id}
                                    item={item}
                                    onAdded={() => setAddedCount((c) => c + 1)}
                                />
                            ))}
                        </ul>
                    </section>
                ))
            )}

            {addedCount > 0 && (
                <div className={styles.cartBar} role="status">
                    <span>Added to cart</span>
                    <Button type="button" className={styles.cartButton} onClick={() => navigate('/customer/cart')}>
                        View cart
                    </Button>
                </div>
            )}
        </div>
    );
}

export default RestaurantDetailPage;