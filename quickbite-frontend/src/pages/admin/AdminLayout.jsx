import AppShell from '../../components/AppShell';

const LINKS = [
  { to: '/admin/rider-history', label: 'Rider history', icon: '🏍️' },
];

function AdminLayout() {
  return <AppShell links={LINKS} roleLabel="Admin" />;
}

export default AdminLayout;