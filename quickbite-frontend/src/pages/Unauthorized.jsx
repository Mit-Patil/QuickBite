import MessagePage from '../components/MessagePage';

function Unauthorized() {
  return <MessagePage title="Not allowed" message="You do not have access to that page." />;
}

export default Unauthorized;