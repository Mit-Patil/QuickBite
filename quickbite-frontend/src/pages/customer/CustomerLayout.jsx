import AppShell from '../../components/AppShell';

const LINKS = [
  { to: '/customer', label: 'Home', icon: '🏠', end: true },
  { to: '/customer/cart', label: 'Cart', icon: '🛒' },
  { to: '/customer/orders', label: 'Orders', icon: '📋' },
  { to: '/customer/addresses', label: 'Addresses', icon: '📍' },
  { to: '/customer/profile', label: 'Profile', icon: '👤' },
];

function CustomerLayout() {
  return <AppShell links={LINKS} />;
}

export default CustomerLayout;