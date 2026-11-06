import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { homePathForRole } from '../utils/roleHome';
import Notice from './Notice';

function MessagePage({ title, message, variant = 'warning' }) {
  const { user } = useAuth();

  return (
    <div>
      <h1>{title}</h1>
      <Notice variant={variant}>{message}</Notice>
      <Link to={homePathForRole(user?.role)}>{user ? 'Go to my home' : 'Go to sign in'}</Link>
    </div>
  );
}

export default MessagePage;