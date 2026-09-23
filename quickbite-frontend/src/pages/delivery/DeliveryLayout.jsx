import AppShell from '../../components/AppShell';

const LINKS = [
  { to: '/delivery', label: 'Home', icon: '🏍️', end: true },
  { to: '/delivery/profile', label: 'Profile', icon: '👤' },
];

function DeliveryLayout() {
  return <AppShell links={LINKS} roleLabel="Delivery" />;
}

export default DeliveryLayout;