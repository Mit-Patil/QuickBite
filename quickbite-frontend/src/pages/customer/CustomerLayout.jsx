import {Outlet, useNavigate, Link} from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import styles from './CustomerLayout.module.css';

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
                <button onClick={handleLogout}>Logout</button>
            </nav>
            <main className={styles.main}>
                <Outlet />
            </main>
        </div>
    );
}

export default CustomerLayout;