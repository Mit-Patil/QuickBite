import { useEffect, useState } from 'react';
import DeliveryHistory from '../../components/DeliveryHistory';
import Select from '../../components/Select';
import ErrorMessage from '../../components/ErrorMessage';
import { getAdminPartners, getAdminDeliveryHistory } from '../../api/deliveryService';
import { shortPartnerId } from '../../utils/format';

const ALL_RIDERS = '';

function RiderHistoryPage() {
  const [partners, setPartners] = useState([]);
  const [partnerId, setPartnerId] = useState(ALL_RIDERS);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminPartners()
      .then((response) => setPartners(response.data))
      .catch((err) => setError(err.message));
  }, []);

  const options = [
    { value: ALL_RIDERS, label: 'All riders' },
    ...partners.map((p) => ({
      value: p.partnerId,
      label: `${shortPartnerId(p.partnerId)} · ${p.deliveries} deliveries`,
    })),
  ];

  return (
    <div>
      <Select label="Rider" name="rider" value={partnerId} onChange={(e) => setPartnerId(e.target.value)} options={options} />
      <ErrorMessage message={error} />
      <DeliveryHistory
        key={partnerId}
        title="Rider history"
        fetchHistory={(query) => getAdminDeliveryHistory({ ...query, partnerId: partnerId || undefined })}
      />
    </div>
  );
}

export default RiderHistoryPage;