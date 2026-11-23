import { useEffect, useState } from 'react';
import { useLive } from '../live/LiveProvider';

export default function useOrderTracking(orderId, enabled = true) {
  const live = useLive();
  const client = live?.client;
  const [position, setPosition] = useState(null);
  const [state, setState] = useState('idle'); 
  const [error, setError] = useState('');

  useEffect(() => {
    setPosition(null);
    setError('');
    setState('idle');
    if (!enabled || !orderId || !client) return undefined;

    const stopListening = client.onMessage((message) => {
      if (message.orderId !== orderId) return;
      if (message.type === 'tracking') {
        setState('tracking');
        setError('');
      } else if (message.type === 'location') {
        setPosition({ lat: message.lat, lng: message.lng, phase: message.phase, at: message.at });
      } else if (message.type === 'tracking-ended') {
        setState('ended');
      } else if (message.type === 'track-error') {
        setState('error');
        setError(message.reason);
      }
    });
    client.track(orderId);

    return () => {
      stopListening();
      client.untrack(orderId);
    };
  }, [orderId, enabled, client]);

  return { position, state, error, available: Boolean(client), connected: Boolean(live?.connected) };
}