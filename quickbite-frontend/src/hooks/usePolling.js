import { useEffect, useRef } from 'react';

export default function usePolling(callback, intervalMs, { enabled = true, pauseWhenHidden = true } = {}) {
  const saved = useRef(callback);

  useEffect(() => {
    saved.current = callback;
  });

  useEffect(() => {
    if (!enabled) return undefined;
    saved.current();
    const timer = setInterval(() => {
      if (pauseWhenHidden && document.hidden) return;
      saved.current();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs, enabled, pauseWhenHidden]);
}