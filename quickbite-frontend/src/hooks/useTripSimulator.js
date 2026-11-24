import { useEffect, useState } from 'react';
import usePolling from './usePolling';
import { getRouteInfo } from '../api/orderService';
import { moveToward } from '../utils/geo';

const STEP_MS = 2000;
const STEP_METERS = 25; // 25 m every 2 s is about 45 km/h

const toPoint = (lat, lng) => (lat == null || lng == null ? null : { lat, lng });

export default function useTripSimulator({ delivery, coords, setCoords }) {
  const [running, setRunning] = useState(false);
  const [route, setRoute] = useState(null);
  const [error, setError] = useState('');

  const orderId = delivery?.orderId;
  const active = Boolean(delivery) && delivery.status !== 'CANCELLED';

  useEffect(() => {
    if (running && !active) setRunning(false); // delivered or cancelled: nothing left to simulate
  }, [running, active]);

  useEffect(() => {
    if (!running || !orderId) return undefined;
    let cancelled = false;
    getRouteInfo(orderId)
      .then((response) => {
        if (cancelled) return;
        const data = response.data;
        const restaurant = toPoint(data.restaurantLatitude, data.restaurantLongitude);
        const destination = toPoint(data.deliveryLatitude, data.deliveryLongitude);
        if (!restaurant || !destination) {
          setError('This order has no map points to follow');
          setRunning(false);
          return;
        }
        setRoute({ orderId, restaurant, destination });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setRunning(false);
      });
    return () => { cancelled = true; };
  }, [running, orderId]);

  const ready = running && route?.orderId === orderId;

  usePolling(
    () => {
      if (!delivery || !route) return;
      const pickedUp = delivery.orderStatus === 'OUT_FOR_DELIVERY';
      const target = pickedUp ? route.destination : route.restaurant;
      const current = { lat: Number(coords.lat), lng: Number(coords.lng) };
      if (Number.isNaN(current.lat) || Number.isNaN(current.lng)) return;

      const next = moveToward(current, target, STEP_METERS);
      setCoords({ lat: next.lat.toFixed(6), lng: next.lng.toFixed(6) });
      if (pickedUp && next.lat === target.lat && next.lng === target.lng) setRunning(false);
    },
    STEP_MS,
    { enabled: ready, pauseWhenHidden: false }
  );

  return {
    running,
    error,
    start() {
      setError('');
      setRunning(true);
    },
    stop() {
      setRunning(false);
    },
  };
}