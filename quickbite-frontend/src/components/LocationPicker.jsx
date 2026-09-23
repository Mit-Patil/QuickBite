import { useRef, useState } from 'react';
import MapPicker from './MapPicker';
import CurrentLocationButton from './CurrentLocationButton';
import { searchPlaces, reverseGeocode } from '../api/geocodingService';
import Input from './Input';
import Button from './Button';
import ErrorMessage from './ErrorMessage';
import styles from './LocationPicker.module.css';
import { MAP_CONFIG } from '../config/map';

const APPROX_WARNING_METERS = 500;
const UNUSABLE_METERS = MAP_CONFIG.maxUsableAccuracyMeters;

export default function LocationPicker({ value, onChange, onSuggestion, height = '350px', className = '' }) {
  const [focus, setFocus] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [accuracy, setAccuracy] = useState(null);
  const [message, setMessage] = useState('');
  const [searching, setSearching] = useState(false);
  const latestRequest = useRef(0);

  async function suggestFor(pin) {
    const requestId = ++latestRequest.current;
    try {
      const place = await reverseGeocode(pin.lat, pin.lng);
      if (requestId !== latestRequest.current) return; 
      if (place) {
        onSuggestion?.({ city: place.city, pincode: place.pincode, displayName: place.displayName });
      }
    } catch (err) {
      if (requestId === latestRequest.current) setMessage(err.message);
    }
  }

  function handlePinChange(pin) {
    setAccuracy(null);
    setMessage('');
    onChange(pin);
    suggestFor(pin);
  }

  async function handleSearch() {
    setMessage('');
    setSearching(true);
    try {
      const found = await searchPlaces(query);
      setResults(found);
      if (found.length === 0) setMessage('No matching place found. Try a nearby area name.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSearching(false);
    }
  }

  function handleSelectResult(result) {
    latestRequest.current++; 
    const pin = { lat: result.lat, lng: result.lng };
    setResults([]);
    setAccuracy(null);
    setMessage('');
    setFocus({ ...pin });
    onChange(pin);
    onSuggestion?.({ city: result.city, pincode: result.pincode, displayName: result.displayName });
  }

  function handleLocated(position) {
    const pin = { lat: position.lat, lng: position.lng };
    if (position.accuracy > UNUSABLE_METERS) {
      setFocus({ ...pin, zoom: 12 });
      setAccuracy(position.accuracy);
      setMessage('We could only estimate your general area. Search for your area or tap the map to place the pin.');
      return;
    }
    setFocus({ ...pin });
    handlePinChange(pin);
    setAccuracy(position.accuracy); 
  }

  function handleSearchKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      handleSearch();
    }
  }

 const showApproxWarning =
    accuracy !== null && accuracy > APPROX_WARNING_METERS && accuracy <= UNUSABLE_METERS;

  return (
    <div className={`${styles.picker} ${className}`}>
      <div className={styles.searchRow}>
        <Input
          label="Search your area"
          name="locationSearch"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="e.g. Bopal Ahmedabad"
        />
        <Button type="button" className={styles.searchButton} loading={searching} loadingText="Searching..." onClick={handleSearch}>
          Search
        </Button>
      </div>

      {results.length > 0 && (
        <ul className={styles.results}>
          {results.map((r, i) => (
            <li key={i}>
              <button type="button" className={styles.resultItem} onClick={() => handleSelectResult(r)}>
                {r.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}

      <CurrentLocationButton className={styles.gpsButton} onLocated={handleLocated} onError={setMessage} />

      <MapPicker value={value} onChange={handlePinChange} focus={focus} height={height} />

      <p className={styles.hint}>Tap the map or drag the pin to your exact delivery spot.</p>
      {showApproxWarning && (
        <p className={styles.hint}>
          Location may be approximate (about {Math.round(accuracy)} m). Please adjust the pin.
        </p>
      )}
      <ErrorMessage message={message} />
    </div>
  );
}