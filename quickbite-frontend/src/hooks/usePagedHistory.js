import { useEffect, useRef, useState } from 'react';
import useRequestGuard from './useRequestGuard';
import { currentMonthKey } from '../utils/format';

const DEFAULT_PAGE_SIZE = 10;

export default function usePagedHistory(fetchHistory, { pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const [month, setMonthValue] = useState(currentMonthKey);
  const [page, setPage] = useState(0);
  const [status, setStatusValue] = useState('DELIVERED');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const guard = useRequestGuard();
  const fetchRef = useRef(fetchHistory);

  useEffect(() => {
    fetchRef.current = fetchHistory;
  });

  useEffect(() => {
    const token = guard.start();
    setLoading(true);
    setError('');
    fetchRef.current({ month, page, size: pageSize, status })
      .then((response) => {
        if (guard.isCurrent(token)) setData(response.data);
      })
      .catch((err) => {
        if (guard.isCurrent(token)) {
          setData(null);
          setError(err.message);
        }
      })
      .finally(() => {
        if (guard.isCurrent(token)) setLoading(false);
      });
    return () => guard.invalidate();
  }, [month, page, pageSize, status]);

  function setMonth(value) {
    setMonthValue(value);
    setPage(0);
  }

  function setStatus(value) {
    setStatusValue(value);
    setPage(0);
  }

  return { month, page, status, data, loading, error, setMonth, setPage, setStatus };
}