import { useEffect, useState } from 'react';
import { getTrackingInfo } from '../api/orderService';
import useOrderTracking from '../hooks/useOrderTracking';
import { isTrackable, PHASE_LABEL } from '../utils/orderStatus';
import TrackingMap from './TrackingMap';

const toPoint = (lat, lng) => (lat == null || lng == null ? null : { lat, lng });

function connectionLabel(available, connected) {
  if (!available) return 'Live updates are off';
  return connected ? 'Connected' : 'Reconnecting...';
}

function OrderTracking({ order }) {
  const enabled = isTrackable(order.status);
  const { position, state, error, available, connected } = useOrderTracking(order.id, enabled);
  const [places, setPlaces] = useState(undefined); // undefined = loading, null = unavailable

  useEffect(() => {
    setPlaces(undefined);
    if (!enabled) return undefined;
    let cancelled = false;
    getTrackingInfo(order.id)
      .then((response) => { if (!cancelled) setPlaces(response.data); })
      .catch(() => { if (!cancelled) setPlaces(null); });
    return () => { cancelled = true; };
  }, [order.id, enabled]);

  if (!enabled) return null;

  const restaurant = places ? toPoint(places.restaurantLatitude, places.restaurantLongitude) : null;
  const destination = places ? toPoint(places.deliveryLatitude, places.deliveryLongitude) : null;

  let mapView = <p>Loading map...</p>;
  if (places !== undefined) {
    mapView = restaurant && destination
      ? <TrackingMap restaurant={restaurant} destination={destination} rider={position} phase={position?.phase} />
      : <p>The map is not available for this order.</p>;
  }

  return (
    <section>
      <h2>Live tracking</h2>
      <p>
        {connectionLabel(available, connected)}
        {state === 'error' ? ` (${error})` : ''}
      </p>
      <p>{position ? PHASE_LABEL[position.phase] : 'Waiting for the rider position...'}</p>
      {mapView}
    </section>
  );
}

export default OrderTracking;