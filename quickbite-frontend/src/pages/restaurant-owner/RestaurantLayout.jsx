import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import styles from '../../styles/DashboardLayout.module.css';

function RestaurantLayout(){
    const { logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout(){
        logout();
        navigate('/login');
    }

    return (
        <div>
            <nav className={styles.nav}>
                <Link to="/restaurant">Dashboard</Link>
                <Link to="/restaurant/profile">Profile</Link>
                <button onClick={handleLogout}>Logout</button>
            </nav>
            <main className={styles.main}>
                <Outlet />
            </main>
        </div>
    );
}

export default RestaurantLayout;