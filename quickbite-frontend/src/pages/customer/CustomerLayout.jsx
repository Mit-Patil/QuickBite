import {Outlet, useNavigate, Link} from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import styles from '../../styles/DashboardLayout.module.css';

function CustomerLayout(){
    const { logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout(){
        logout();
        navigate('/login');
    }

    return (
        <div>
            <nav className={styles.nav}>
                <Link to="/customer">Home</Link>
                <Link to="/customer/addresses">Addresses</Link>
                <Link to="/customer/profile">Profile</Link>
                <Link to="/customer/cart">Cart</Link>
                <Link to="/customer/orders">My Orders</Link>
                <button onClick={handleLogout}>Logout</button>
            </nav>
            <main className={styles.main}>
                <Outlet />
            </main>
        </div>
    );
}

export default CustomerLayout;