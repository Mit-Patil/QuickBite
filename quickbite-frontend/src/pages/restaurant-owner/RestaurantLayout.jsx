import AppShell from '../../components/AppShell';

const LINKS = [
  { to: '/restaurant', label: 'Dashboard', icon: '🍴', end: true },
  { to: '/restaurant/profile', label: 'Profile', icon: '👤' },
];

function RestaurantLayout() {
  return <AppShell links={LINKS} roleLabel="Restaurant" />;
}

export default RestaurantLayout;