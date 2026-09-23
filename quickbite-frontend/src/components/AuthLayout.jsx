import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import styles from './AuthLayout.module.css';

const FEATURES = [
  { icon: '🍽️', text: 'Order from restaurants in your city' },
  { icon: '🧩', text: 'Customize dishes with variants and add-ons' },
  { icon: '↩️', text: 'Secure payments, automatic refunds on cancellation' },
];

const ROLES = [
  { to: '/register/customer', label: 'Customer' },
  { to: '/register/restaurant', label: 'Restaurant' },
  { to: '/register/delivery-partner', label: 'Delivery' },
];

function AuthLayout() {
  const { pathname } = useLocation();
  const isRegister = pathname.startsWith('/register');

  return (
    <div className={styles.page}>
      <section className={styles.brand}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>Q+</span>
          <span className={styles.logoText}>QuickBite+</span>
        </div>

        <h1 className={styles.headline}>
          Your favourite food,
          <span className={styles.highlight}> at your door.</span>
        </h1>
        <p className={styles.subtext}>
          Order from local restaurants, customize every dish, and pay securely.
        </p>

        <ul className={styles.features}>
          {FEATURES.map((f) => (
            <li key={f.text} className={styles.feature}>
              <span className={styles.featureIcon}>{f.icon}</span>
              {f.text}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.cardWrap}>
        <div className={styles.card}>
          <nav className={styles.tabs} aria-label="Authentication">
            <Link
              to="/login"
              replace
              className={`${styles.tab} ${!isRegister ? styles.tabActive : ''}`}
            >
              Sign In
            </Link>
            <Link
              to="/register/customer"
              replace
              className={`${styles.tab} ${isRegister ? styles.tabActive : ''}`}
            >
              Register
            </Link>
          </nav>

          {isRegister && (
            <>
              <p className={styles.rolesLabel}>Join as</p>
              <nav className={styles.roles} aria-label="Account type">
                {ROLES.map((r) => (
                  <NavLink
                    key={r.to}
                    to={r.to}
                    replace
                    className={({ isActive }) =>
                      `${styles.role} ${isActive ? styles.roleActive : ''}`
                    }
                  >
                    {r.label}
                  </NavLink>
                ))}
              </nav>
            </>
          )}

          <div key={pathname} className={styles.content}>
            <Outlet />
          </div>
        </div>
      </section>
    </div>
  );
}

export default AuthLayout;