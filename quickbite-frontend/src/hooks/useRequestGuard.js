import { useRef } from 'react';

export default function useRequestGuard() {
  const counter = useRef(0);
  return {
    start: () => ++counter.current,
    isCurrent: (token) => token === counter.current,
    invalidate: () => { counter.current += 1; },
  };
}