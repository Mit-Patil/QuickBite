import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getRestaurantById, createRestaurant, updateRestaurant } from '../../api/restaurantService';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import Notice from '../../components/Notice';
import styles from './RestaurantFormPage.module.css';
import Select from '../../components/Select';
import Checkbox from '../../components/Checkbox';
import LocationPicker from '../../components/LocationPicker';
import ImageUpload from '../../components/ImageUpload';
import { uploadRestaurantImage } from '../../api/uploadService';

function RestaurantFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [restaurantType, setRestaurantType] = useState('RESTAURANT');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [twentyFourSeven, setTwentyFourSeven] = useState(false);
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [imageUrl, setImageUrl] = useState('');

  const [pin, setPin] = useState(null);
  const touched = useRef({ city: isEditMode, pincode: isEditMode });

  useEffect(() => {
    if (isEditMode) loadRestaurant();
  }, [id]);

  async function loadRestaurant() {
    try {
      const response = await getRestaurantById(id);
      const r = response.data;
      setName(r.name);
      setDescription(r.description || '');
      setCuisineType(r.cuisineType || '');
      setRestaurantType(r.restaurantType);
      setAddressLine(r.addressLine);
      setCity(r.city);
      setPincode(r.pincode);
      setPin(
        r.latitude != null && r.longitude != null
          ? { lat: r.latitude, lng: r.longitude }
          : null
      );
      setTwentyFourSeven(r.twentyFourSeven);
      setOpeningTime(r.openingTime || '');
      setClosingTime(r.closingTime || '');
      setIsOpen(r.isOpen);
      setImageUrl(r.imageUrl || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSuggestion(place) {
    if (!touched.current.city) setCity(place.city);
    if (!touched.current.pincode) setPincode(place.pincode);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!pin) {
      setError('Please pin the restaurant location on the map');
      return;
    }

    setSubmitting(true);

    const data = {
      name, description, cuisineType, restaurantType,
      addressLine, city, pincode, twentyFourSeven,
      latitude: pin.lat,
      longitude: pin.lng,
      openingTime: twentyFourSeven ? null : openingTime,
      closingTime: twentyFourSeven ? null : closingTime,
    };

    if (isEditMode) data.isOpen = isOpen;

    try {
      if (isEditMode) {
        await updateRestaurant(id, data);
        setSuccess('Restaurant updated successfully');
      } else {
        await createRestaurant(data);
        navigate('/restaurant');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className={styles.loading}>Loading restaurant...</p>;

  return (
    <div className={styles.wrapper}>
      <Link to="/restaurant" className={styles.back}>← All restaurants</Link>

      <header className={styles.header}>
        <h1 className={styles.title}>{isEditMode ? 'Edit Restaurant' : 'Add New Restaurant'}</h1>
      </header>

      <ErrorMessage message={error} />
      {success && <Notice variant="success">{success}</Notice>}

      <form onSubmit={handleSubmit} className={styles.layout}>
        <div className={styles.mapColumn}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Location</h2>
            <Notice>City and pincode are filled from the map. Please check them.</Notice>
            <LocationPicker value={pin} onChange={setPin} onSuggestion={handleSuggestion} />
          </section>
        </div>

        <div className={styles.fieldsColumn}>
          {isEditMode ? (
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Cover Photo</h2>
              <ImageUpload
                variant="inline"
                currentImageUrl={imageUrl}
                uploadFn={(file) => uploadRestaurantImage(id, file)}
                onUploaded={(updated) => setImageUrl(updated.imageUrl)}
              />
            </section>
          ) : (
            <Notice>Save the restaurant first, then edit it to add a cover photo.</Notice>
          )}

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Details</h2>

            <Input label="Name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} />

            <div className={styles.fieldRow}>
              <Input label="Cuisine Type" name="cuisineType" value={cuisineType} onChange={(e) => setCuisineType(e.target.value)} placeholder="e.g. North Indian" />
              <Select
                label="Restaurant Type"
                name="restaurantType"
                value={restaurantType}
                onChange={(e) => setRestaurantType(e.target.value)}
                options={[
                  { value: 'RESTAURANT', label: 'Restaurant' },
                  { value: 'CLOUD_KITCHEN', label: 'Cloud Kitchen' },
                ]}
              />
            </div>

            <Input label="Address Line" name="addressLine" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} required />

            <div className={styles.fieldRow}>
              <Input
                label="City"
                name="city"
                value={city}
                onChange={(e) => { touched.current.city = true; setCity(e.target.value); }}
                required
              />
              <Input
                label="Pincode"
                name="pincode"
                value={pincode}
                onChange={(e) => { touched.current.pincode = true; setPincode(e.target.value); }}
                maxLength={6}
                inputMode="numeric"
                required
              />
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Hours</h2>

            <Checkbox label="Open 24/7" name="twentyFourSeven" checked={twentyFourSeven} onChange={(e) => setTwentyFourSeven(e.target.checked)} />

            {!twentyFourSeven && (
              <div className={styles.fieldRow}>
                <Input label="Opening Time" name="openingTime" type="time" value={openingTime} onChange={(e) => setOpeningTime(e.target.value)} />
                <Input label="Closing Time" name="closingTime" type="time" value={closingTime} onChange={(e) => setClosingTime(e.target.value)} />
              </div>
            )}

            {isEditMode && (
              <Checkbox label="Currently Open" name="isOpen" checked={isOpen} onChange={(e) => setIsOpen(e.target.checked)} />
            )}
          </section>

          <Button loading={submitting} loadingText="Saving...">
            {isEditMode ? 'Save Changes' : 'Create Restaurant'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default RestaurantFormPage;