import { useRef, useState } from 'react';
import usePolling from '../../hooks/usePolling';
import {
  reportLocation, goOffline, getCurrentOffer, acceptOffer, declineOffer,
} from '../../api/deliveryService';
import { shortOrderId } from '../../utils/format';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';

const LOCATION_MS = 10000;
const OFFER_MS = 3000;

const toNumber = (value) => (value.trim() === '' ? NaN : Number(value));

function DeliveryHome() {
  const [online, setOnline] = useState(false);
  const [available, setAvailable] = useState(null);
  const [coords, setCoords] = useState({ lat: '21.14012', lng: '72.87820' });
  const [offer, setOffer] = useState(null); 
  const [now, setNow] = useState(Date.now());
  const [acceptedOrderId, setAcceptedOrderId] = useState(null);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');
  const latestOffer = useRef(0);

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
      if (response.data.available) setAcceptedOrderId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function refreshOffer() {
    const thisLoad = ++latestOffer.current;
    try {
      const response = await getCurrentOffer();
      if (thisLoad !== latestOffer.current) return;
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
      if (thisLoad === latestOffer.current) setError(err.message);
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
    latestOffer.current += 1;
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
      latestOffer.current += 1;
      setOffer(null);
      if (kind === 'accept') setAcceptedOrderId(orderId);
    } catch (err) {
      setError(err.message);
      refreshOffer();
    } finally {
      setActing(false);
    }
  }

  const remaining = offer ? Math.max(0, Math.ceil((offer.endsAt - now) / 1000)) : 0;

  usePolling(sendLocation, LOCATION_MS, { enabled: online, pauseWhenHidden: false });
  usePolling(refreshOffer, OFFER_MS, { enabled: online, pauseWhenHidden: false });
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
          disabled={Boolean(offer) || available === false}
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

      {acceptedOrderId && !offer && (
        <section>
          <h2>Delivery accepted</h2>
          <p>Order {shortOrderId(acceptedOrderId)}: head to the restaurant for pickup.</p>
        </section>
      )}
    </div>
  );
}

export default DeliveryHome;