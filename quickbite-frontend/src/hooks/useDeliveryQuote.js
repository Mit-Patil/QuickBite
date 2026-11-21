import { useEffect, useState } from 'react';
import { getDeliveryQuote } from '../api/orderService';
import useRequestGuard from './useRequestGuard';

export default function useDeliveryQuote(addressId, enabled = true) {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const guard = useRequestGuard();

  useEffect(() => {
    setQuote(null);
    setError('');
    if (!enabled || !addressId) {
      guard.invalidate();
      setLoading(false);
      return;
    }
    const token = guard.start();
    setLoading(true);
    getDeliveryQuote(addressId)
      .then((response) => { if (guard.isCurrent(token)) setQuote(response.data); })
      .catch((err) => { if (guard.isCurrent(token)) setError(err.message); })
      .finally(() => { if (guard.isCurrent(token)) setLoading(false); });
  }, [addressId, enabled]);

  return { quote, loading, error };
}