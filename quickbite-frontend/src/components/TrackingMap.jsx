import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CONFIG } from '../config/map';
import useAnimatedPosition from '../hooks/useAnimatedPosition';

const emojiIcon = (emoji) =>
  L.divIcon({
    html: `<span style="font-size:26px;line-height:1">${emoji}</span>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

const ICONS = {
  restaurant: emojiIcon('🍽️'),
  home: emojiIcon('🏠'),
  rider: emojiIcon('🏍️'),
};


function FitBounds({ points, fitKey }) {
  const map = useMap();
  const pointsRef = useRef(points);

  useEffect(() => {
    pointsRef.current = points;
  });

  useEffect(() => {
    if (pointsRef.current.length === 0) return;
    map.fitBounds(L.latLngBounds(pointsRef.current), { padding: [40, 40], maxZoom: 16 });
  }, [fitKey, map]);

  return null;
}

export default function TrackingMap({ restaurant, destination, rider, phase, height = '320px', className = '' }) {
  const animatedRider = useAnimatedPosition(rider);
  const target = phase === 'TO_RESTAURANT' ? restaurant : destination;

  const points = [restaurant, destination, rider]
    .filter(Boolean)
    .map((place) => [place.lat, place.lng]);
  const fitKey = `${phase ?? 'none'}:${rider ? 'rider' : 'no-rider'}`;

  return (
    <MapContainer
      center={points[0] ?? MAP_CONFIG.defaultCenter}
      zoom={MAP_CONFIG.defaultZoom}
      style={{ height, width: '100%' }}
      className={className}
    >
      <TileLayer attribution={MAP_CONFIG.attribution} url={MAP_CONFIG.tileUrl} />
      <FitBounds points={points} fitKey={fitKey} />

      {restaurant && (
        <Marker position={[restaurant.lat, restaurant.lng]} icon={ICONS.restaurant}>
          <Tooltip>Restaurant</Tooltip>
        </Marker>
      )}
      {destination && (
        <Marker position={[destination.lat, destination.lng]} icon={ICONS.home}>
          <Tooltip>Delivery address</Tooltip>
        </Marker>
      )}
      {animatedRider && (
        <>
          <Marker position={[animatedRider.lat, animatedRider.lng]} icon={ICONS.rider}>
            <Tooltip>Delivery partner</Tooltip>
          </Marker>
          {target && (
            <Polyline
              positions={[[animatedRider.lat, animatedRider.lng], [target.lat, target.lng]]}
              pathOptions={{ dashArray: '6 8' }}
            />
          )}
        </>
      )}
    </MapContainer>
  );
}