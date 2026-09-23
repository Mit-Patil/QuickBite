import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import styles from './AppShell.module.css';

function AppShell({ links, roleLabel }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <div className={styles.brand}>
            <span className={styles.logoMark}>Q+</span>
            <span>QuickBite+</span>
            {roleLabel && <span className={styles.roleTag}>{roleLabel}</span>}
          </div>

          <nav className={styles.desktopNav} aria-label="Main">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <button type="button" className={styles.logout} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <nav className={styles.tabBar} aria-label="Main">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `${styles.tab} ${isActive ? styles.tabActive : ''}`
            }
          >
            <span className={styles.tabIcon}>{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default AppShell;