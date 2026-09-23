import { useRef, useState } from 'react';
import LocationPicker from '../../components/LocationPicker';
import Input from '../../components/Input';

export default function MapTest() {
  const [pin, setPin] = useState(null);
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const touched = useRef({ city: false, pincode: false });

  function handleSuggestion(place) {
    if (!touched.current.city) setCity(place.city);
    if (!touched.current.pincode) setPincode(place.pincode);
  }

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <LocationPicker value={pin} onChange={setPin} onSuggestion={handleSuggestion} />
      <Input
        label="City"
        name="city"
        value={city}
        onChange={(e) => { touched.current.city = true; setCity(e.target.value); }}
      />
      <Input
        label="Pincode"
        name="pincode"
        value={pincode}
        onChange={(e) => { touched.current.pincode = true; setPincode(e.target.value); }}
      />
      {pin && <p>Pin: {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}</p>}
    </form>
  );
}