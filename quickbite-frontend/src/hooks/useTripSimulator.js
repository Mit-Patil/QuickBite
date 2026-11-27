import { useEffect, useRef, useState } from 'react';
import usePolling from './usePolling';
import { getRouteInfo } from '../api/orderService';
import { fetchRoadRoute } from '../utils/routing';
import { advanceAlong, moveToward } from '../utils/geo';

const STEP_MS = 2000;
const STEP_METERS = 25; // 25 m every 2 s is about 45 km/h

const toPoint = (lat, lng) => (lat == null || lng == null ? null : { lat, lng });

export default function useTripSimulator({ delivery, coords, setCoords }) {
  const [running, setRunning] = useState(false);
  const [route, setRoute] = useState(null); 
  const [error, setError] = useState('');
  const walk = useRef(null); 
  const coordsRef = useRef(coords);

  const orderId = delivery?.orderId;
  const active = Boolean(delivery) && delivery.status !== 'CANCELLED';
  const leg = delivery?.orderStatus === 'OUT_FOR_DELIVERY' ? 'customer' : 'restaurant';
  const ready = running && route?.orderId === orderId;

  useEffect(() => {
    coordsRef.current = coords;
  });

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

  useEffect(() => {
    if (!ready) {
      walk.current = null;
      return undefined;
    }
    const target = leg === 'customer' ? route.destination : route.restaurant;
    const origin = { lat: Number(coordsRef.current.lat), lng: Number(coordsRef.current.lng) };
    walk.current = { leg, status: 'loading', points: [], cursor: 0 };

    const controller = new AbortController();
    fetchRoadRoute(origin, target, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        walk.current = { leg, status: result ? 'ready' : 'failed', points: result?.path ?? [], cursor: 0 };
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        walk.current = { leg, status: 'failed', points: [], cursor: 0 };
      });
    return () => controller.abort();
  }, [ready, leg, route]);

  usePolling(
    () => {
      const state = walk.current;
      if (!delivery || !route || !state || state.leg !== leg || state.status === 'loading') return;

      const target = leg === 'customer' ? route.destination : route.restaurant;
      const current = { lat: Number(coords.lat), lng: Number(coords.lng) };
      if (Number.isNaN(current.lat) || Number.isNaN(current.lng)) return;

      let next;
      if (state.status === 'ready' && state.cursor < state.points.length) {
        const stepped = advanceAlong(state.points, state.cursor, current, STEP_METERS);
        state.cursor = stepped.cursor;
        next = stepped.position;
      } else {
        next = moveToward(current, target, STEP_METERS); 
      }
      setCoords({ lat: next.lat.toFixed(6), lng: next.lng.toFixed(6) });

      const arrived = next.lat === target.lat && next.lng === target.lng;
      if (leg === 'customer' && arrived) setRunning(false);
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