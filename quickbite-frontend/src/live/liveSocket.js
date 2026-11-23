const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 15000;
const RETRY_TRACK_MS = 5000;
const NO_RETRY_CODES = new Set([1008, 4400, 4401]);

export function createLiveSocket(url, getToken) {
  const messageListeners = new Set();
  const stateListeners = new Set();
  const tracked = new Set(); 

  let socket = null;
  let ready = false;
  let stopped = false;
  let attempt = 0;
  let reconnectTimer = null;

  function setReady(value) {
    ready = value;
    stateListeners.forEach((listener) => listener(value));
  }

  function send(message) {
    if (socket && ready) socket.send(JSON.stringify(message));
  }

  function sendTrack(orderId) {
    if (tracked.has(orderId)) send({ type: 'track', orderId });
  }

  function scheduleReconnect() {
    const delay = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS) + Math.random() * 300;
    attempt += 1;
    reconnectTimer = setTimeout(connect, delay);
  }

  function connect() {
    const token = getToken();
    if (stopped || !token) return;

    const ws = new WebSocket(url);
    socket = ws;

    ws.onopen = () => ws.send(JSON.stringify({ type: 'auth', token }));

    ws.onmessage = (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (message.type === 'ready') {
        attempt = 0;
        setReady(true);
        tracked.forEach((orderId) => sendTrack(orderId)); 
        return;
      }
      if (message.type === 'track-error' && message.reason === 'UNAVAILABLE') {
        setTimeout(() => sendTrack(message.orderId), RETRY_TRACK_MS);
      }
      messageListeners.forEach((listener) => listener(message));
    };

    ws.onclose = (event) => {
      if (socket === ws) {
        socket = null;
        setReady(false);
      }
      if (!stopped && !NO_RETRY_CODES.has(event.code)) scheduleReconnect();
    };
  }

  return {
    connect,
    close() {
      stopped = true;
      clearTimeout(reconnectTimer);
      if (socket) socket.close();
    },
    track(orderId) {
      tracked.add(orderId);
      sendTrack(orderId);
    },
    untrack(orderId) {
      tracked.delete(orderId);
      send({ type: 'untrack', orderId });
    },
    onMessage(listener) {
      messageListeners.add(listener);
      return () => messageListeners.delete(listener);
    },
    onState(listener) {
      stateListeners.add(listener);
      return () => stateListeners.delete(listener);
    },
  };
}