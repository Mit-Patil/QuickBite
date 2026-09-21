import { useState } from 'react';
import Button from './Button';
import { getCurrentPosition } from '../utils/geolocation';

function CurrentLocationButton({ onLocated, onError, className = '' }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const position = await getCurrentPosition();
      onLocated(position);
    } catch (err) {
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      loading={loading}
      loadingText="Finding your location..."
      onClick={handleClick}
      className={className}
    >
      Use my current location
    </Button>
  );
}

export default CurrentLocationButton;