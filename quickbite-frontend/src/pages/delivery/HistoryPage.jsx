import DeliveryHistory from '../../components/DeliveryHistory';
import { getDeliveryHistory } from '../../api/deliveryService';

function HistoryPage() {
  return <DeliveryHistory title="My deliveries" fetchHistory={getDeliveryHistory} />;
}

export default HistoryPage;