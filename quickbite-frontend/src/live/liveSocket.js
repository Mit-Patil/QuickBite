const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 15000;
const RETRY_SUBSCRIBE_MS = 5000;
const NO_RETRY_CODES = new Set([1008, 4400, 4401]);
const RETRY_KEY = {
  'track-error': (message) => `track:${message.orderId}`,
  'watch-error': (message) => `watch:${message.restaurantId}`,
};

export function createLiveSocket(url, getToken) {
  const messageListeners = new Set();
  const stateListeners = new Set();
  const subscriptions = new Map();

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

  function subscribe(key, message) {
    subscriptions.set(key, message);
    send(message);
  }

  function unsubscribe(key, message) {
    subscriptions.delete(key);
    send(message);
  }

  function resubscribe(key) {
    if (subscriptions.has(key)) send(subscriptions.get(key));
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
        subscriptions.forEach((subscription) => send(subscription)); // nudges are lost offline, so ask again
        return;
      }
      if (message.reason === 'UNAVAILABLE' && Object.hasOwn(RETRY_KEY, message.type)) {
        const key = RETRY_KEY[message.type](message);
        setTimeout(() => resubscribe(key), RETRY_SUBSCRIBE_MS);
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
    track: (orderId) => subscribe(`track:${orderId}`, { type: 'track', orderId }),
    untrack: (orderId) => unsubscribe(`track:${orderId}`, { type: 'untrack', orderId }),
    watch: (restaurantId) => subscribe(`watch:${restaurantId}`, { type: 'watch', restaurantId }),
    unwatch: (restaurantId) => unsubscribe(`watch:${restaurantId}`, { type: 'unwatch', restaurantId }),
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