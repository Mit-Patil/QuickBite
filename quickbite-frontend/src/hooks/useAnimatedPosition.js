import { useEffect, useRef, useState } from 'react';

export default function useAnimatedPosition(target, durationMs = 4000) {
  const lat = target?.lat;
  const lng = target?.lng;
  const [position, setPosition] = useState(null);
  const shown = useRef(null); 

  useEffect(() => {
    if (lat == null || lng == null) {
      shown.current = null;
      setPosition(null);
      return undefined;
    }
    if (!shown.current) {
      shown.current = { lat, lng };
      setPosition({ lat, lng });
      return undefined;
    }

    const from = shown.current;
    const started = performance.now();
    let frame;

    function step(now) {
      const progress = Math.min(1, (now - started) / durationMs);
      const next = {
        lat: from.lat + (lat - from.lat) * progress,
        lng: from.lng + (lng - from.lng) * progress,
      };
      shown.current = next;
      setPosition(next);
      if (progress < 1) frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [lat, lng, durationMs]);

  return position;
}