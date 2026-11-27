import { useEffect, useRef, useState } from 'react';
import { fetchRoadRoute } from '../utils/routing';

export default function useRoadRoute(from, to, key) {
  const [route, setRoute] = useState(null);
  const originRef = useRef(from);
  const toLat = to?.lat;
  const toLng = to?.lng;

  useEffect(() => {
    originRef.current = from;
  });

  useEffect(() => {
    const origin = originRef.current;
    setRoute(null);
    if (!origin || toLat == null || toLng == null) return undefined;

    const controller = new AbortController();
    fetchRoadRoute(origin, { lat: toLat, lng: toLng }, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setRoute(result); })
      .catch(() => {});
    return () => controller.abort();
  }, [key, toLat, toLng]);

  return route;
}