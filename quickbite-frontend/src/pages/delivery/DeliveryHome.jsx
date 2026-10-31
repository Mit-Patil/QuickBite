import { useState } from 'react';
import usePolling from '../../hooks/usePolling';
import useRequestGuard from '../../hooks/useRequestGuard';
import {
  reportLocation, goOffline, getCurrentOffer, acceptOffer, declineOffer, getCurrentDelivery, runDeliveryAction,
} from '../../api/deliveryService';
import { partnerActions, partnerStatusText } from '../../utils/orderStatus';
import { shortOrderId } from '../../utils/format';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';

const LOCATION_MS = 10000;
const OFFER_MS = 3000;
const DELIVERY_MS = 5000;

const toNumber = (value) => (value.trim() === '' ? NaN : Number(value));

function DeliveryHome() {
  const [online, setOnline] = useState(false);
  const [available, setAvailable] = useState(null);
  const [coords, setCoords] = useState({ lat: '21.14012', lng: '72.87820' });
  const [offer, setOffer] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [delivery, setDelivery] = useState(null);
  const [dismissedId, setDismissedId] = useState(null);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');
  const offerGuard = useRequestGuard();
  const deliveryGuard = useRequestGuard();

  async function sendLocation() {
    const lat = toNumber(coords.lat);
    const lng = toNumber(coords.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setError('Enter a valid latitude and longitude');
      return;
    }
    try {
      const response = await reportLocation(lat, lng);
      setAvailable(response.data.available);
    } catch (err) {
      setError(err.message);
    }
  }

  async function refreshOffer() {
    const token = offerGuard.start();
    try {
      const response = await getCurrentOffer();
      if (!offerGuard.isCurrent(token)) return;
      const data = response.data;
      if (!data) {
        setOffer(null);
        return;
      }
      setOffer((prev) =>
        prev && prev.orderId === data.orderId
          ? prev
          : { orderId: data.orderId, distanceKm: data.distanceKm, endsAt: Date.now() + data.secondsLeft * 1000 }
      );
    } catch (err) {
      if (offerGuard.isCurrent(token)) setError(err.message);
    }
  }

  async function refreshDelivery() {
    const token = deliveryGuard.start();
    try {
      const response = await getCurrentDelivery();
      if (!deliveryGuard.isCurrent(token)) return;
      setDelivery(response.data || null);
    } catch (err) {
      if (deliveryGuard.isCurrent(token)) setError(err.message);
    }
  }

  async function handleToggleOnline() {
    setError('');
    if (!online) {
      setOnline(true);
      return;
    }
    setOnline(false);
    setAvailable(null);
    setOffer(null);
    offerGuard.invalidate();
    try {
      await goOffline();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleOfferAction(kind) {
    if (!offer) return;
    const { orderId } = offer;
    setError('');
    setActing(true);
    try {
      if (kind === 'accept') await acceptOffer(orderId);
      else await declineOffer(orderId);
      offerGuard.invalidate();
      setOffer(null);
      if (kind === 'accept') refreshDelivery();
    } catch (err) {
      setError(err.message);
      refreshOffer();
    } finally {
      setActing(false);
    }
  }

  async function handleDeliveryAction(action) {
    setError('');
    setActing(true);
    try {
      await runDeliveryAction(action.key, delivery.orderId);
    } catch (err) {
      setError(err.message);
    } finally {
      setActing(false);
    }
    refreshDelivery();
  }

  const remaining = offer ? Math.max(0, Math.ceil((offer.endsAt - now) / 1000)) : 0;
  const hasActiveDelivery = Boolean(delivery) && delivery.status !== 'CANCELLED';
  const showDelivery = Boolean(delivery)
    && !(delivery.status === 'CANCELLED' && delivery.orderId === dismissedId);

  usePolling(sendLocation, LOCATION_MS, { enabled: online, pauseWhenHidden: false });
  usePolling(refreshOffer, OFFER_MS, { enabled: online, pauseWhenHidden: false });
  usePolling(refreshDelivery, DELIVERY_MS);
  usePolling(() => setNow(Date.now()), 1000, { enabled: Boolean(offer) });

  return (
    <div>
      <h1>Delivery partner</h1>
      <ErrorMessage message={error} />

      <section>
        <p>
          <strong>
            {online ? (available === false ? 'Online · busy' : 'Online · available') : 'Offline'}
          </strong>
        </p>
        <label>
          Latitude{' '}
          <input value={coords.lat} onChange={(e) => setCoords({ ...coords, lat: e.target.value })} />
        </label>{' '}
        <label>
          Longitude{' '}
          <input value={coords.lng} onChange={(e) => setCoords({ ...coords, lng: e.target.value })} />
        </label>
        <Button
          type="button"
          onClick={handleToggleOnline}
          disabled={online && (Boolean(offer) || available === false || hasActiveDelivery)}
        >
          {online ? 'Go offline' : 'Go online'}
        </Button>
      </section>

      {offer && (
        <section>
          <h2>New delivery offer</h2>
          <p>Order {shortOrderId(offer.orderId)} · {offer.distanceKm} km to pickup</p>
          <p><strong>{remaining}s left</strong></p>
          <Button
            type="button"
            loading={acting}
            loadingText="Accepting..."
            disabled={acting || remaining === 0}
            onClick={() => handleOfferAction('accept')}
          >
            Accept
          </Button>
          <button type="button" onClick={() => handleOfferAction('decline')} disabled={acting}>
            Decline
          </button>
        </section>
      )}

      {showDelivery && (
        <section>
          <h2>{delivery.status === 'CANCELLED' ? 'Delivery cancelled' : 'Current delivery'}</h2>
          <p>Order {shortOrderId(delivery.orderId)} · {delivery.restaurantName}</p>
          <p><strong>{partnerStatusText(delivery)}</strong></p>
          {delivery.status === 'CANCELLED' && (
            <button type="button" onClick={() => setDismissedId(delivery.orderId)}>Dismiss</button>
          )}
          {partnerActions(delivery).map((action) => (
            <Button
              key={action.key}
              type="button"
              loading={acting}
              loadingText="Updating..."
              disabled={acting || action.disabled}
              onClick={() => handleDeliveryAction(action)}
            >
              {action.label}
            </Button>
          ))}
        </section>
      )}
    </div>
  );
}

export default DeliveryHome;