import { useEffect, useRef } from 'react';
import { useLive } from '../live/LiveProvider';
import usePolling from './usePolling';

const DEBOUNCE_MS = 400;
const SLOW_POLL_MS = 30000;
const FALLBACK_POLL_MS = 10000;

export default function useLiveRefresh(refetch, { orderId, restaurantId } = {}) {
  const live = useLive();
  const client = live?.client;
  const connected = Boolean(live?.connected);
  const saved = useRef(refetch);

  useEffect(() => {
    saved.current = refetch;
  });


  useEffect(() => {
    if (!client) return undefined;
    if (restaurantId) client.watch(restaurantId);

    let timer = null;
    const stopListening = client.onMessage((message) => {
      if (message.type !== 'order-changed') return;
      if (orderId && message.orderId !== orderId) return;
      clearTimeout(timer);
      timer = setTimeout(() => saved.current(), DEBOUNCE_MS);
    });

    return () => {
      stopListening();
      clearTimeout(timer);
      if (restaurantId) client.unwatch(restaurantId);
    };
  }, [client, orderId, restaurantId]);

  usePolling(refetch, connected ? SLOW_POLL_MS : FALLBACK_POLL_MS);
}