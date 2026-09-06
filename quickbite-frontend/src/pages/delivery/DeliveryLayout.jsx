import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import styles from '../../styles/DashboardLayout.module.css';

function DeliveryLayout(){
    const {logout} = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        logout();
        navigate('/login');
    }

    return (
        <div>
            <nav className={styles.nav}>
                <Link to="/delivery">Home</Link>
                <Link to="/delivery/profile">Profile</Link>
                <button onClick={handleLogout}>Logout</button>
            </nav>
            <main className={styles.main}>
                <Outlet />
            </main>
        </div>
    );
}

export default DeliveryLayout;