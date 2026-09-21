import { useMemo, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MAP_CONFIG } from '../config/map';

const pinIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function FocusHandler({ focus }) {
  const map = useMap();
  useEffect(() => {
    if (focus) {
      map.setView([focus.lat, focus.lng], focus.zoom ?? 16);
    }
  }, [focus, map]);
  return null;
}

export default function MapPicker({ value, onChange , focus = null, readOnly = false, height = '400px', className = '' }) {
  const markerRef = useRef(null);

  const dragHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker) {
          const { lat, lng } = marker.getLatLng();
          onChange?.({ lat, lng });
        }
      },
    }),
    [onChange]
  );

  
  const center = value ? [value.lat, value.lng] : MAP_CONFIG.defaultCenter;
  const zoom = value ? 16 : MAP_CONFIG.defaultZoom;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: '100%' }}
      className={className}
    >
      <TileLayer attribution={MAP_CONFIG.attribution} url={MAP_CONFIG.tileUrl} />
      {!readOnly && <ClickHandler onPick={onChange} />}
      <FocusHandler focus={focus} />
      {value && (
      <Marker
        position={[value.lat, value.lng]}
        draggable={!readOnly}
        icon={pinIcon}
        ref={markerRef}
        eventHandlers={readOnly ? {} : dragHandlers}
      />
      )}
    </MapContainer>
  );
}