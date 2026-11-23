import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { createLiveSocket } from './liveSocket';

const LiveContext = createContext(null);

const NOTIFICATION_URL = import.meta.env.VITE_NOTIFICATION_SERVICE_URL;
const SOCKET_URL = NOTIFICATION_URL ? `${NOTIFICATION_URL.replace(/^http/, 'ws')}/ws` : null;

export function LiveProvider({ children }) {
  const { user } = useAuth();
  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!SOCKET_URL || !user || user.role !== 'CUSTOMER') return undefined;

    const socket = createLiveSocket(SOCKET_URL, () => localStorage.getItem('token'));
    const stopListening = socket.onState(setConnected);
    socket.connect();
    setClient(socket);

    return () => {
      stopListening();
      socket.close();
      setClient(null);
      setConnected(false);
    };
  }, [user]);

  const value = useMemo(() => (client ? { client, connected } : null), [client, connected]);
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLive() {
  return useContext(LiveContext);
}