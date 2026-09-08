import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRestaurantById, createRestaurant, updateRestaurant } from '../../api/restaurantService';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import styles from '../../styles/ProfilePage.module.css';

function RestaurantFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() =>{
    if(isEditMode) loadRestaurant();
  },[id]);

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
        setTwentyFourSeven(r.twentyFourSeven);
        setOpeningTime(r.openingTime || '');
        setClosingTime(r.closingTime || '');
        setIsOpen(r.isOpen);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }


  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const data = {
      name, description, cuisineType, restaurantType,
      addressLine, city, pincode, twentyFourSeven,
      openingTime: twentyFourSeven ? null : openingTime,
      closingTime: twentyFourSeven ? null : closingTime,
    };

    if(isEditMode) data.isOpen = isOpen;

    try {
        if(isEditMode){
            await updateRestaurant(id, data);
        }else{
            await createRestaurant(data);
        }
        navigate("/restaurant");
    } catch (err) {
        setError(err.message);
    }finally{
        setSubmitting(false);
    }
  }

  if(loading) return <p>Loading Restaurant...</p>;

  return (
    <div className={styles.wrapper}>
        <h1>{isEditMode ? 'Edit Restaurant' : 'Add New Restaurant'}</h1>
        <ErrorMessage message={error} />

        <form onSubmit={handleSubmit} className={styles.form}>
            <Input label="Name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <Input label="Cuisine Type" name="cuisineType" value={cuisineType} onChange={(e) => setCuisineType(e.target.value)} />

            <div className={styles.field}>
            <label>Restaurant Type</label>
            <select value={restaurantType} onChange={(e) => setRestaurantType(e.target.value)}>
                <option value="RESTAURANT">Restaurant</option>
                <option value="CLOUD_KITCHEN">Cloud Kitchen</option>
            </select>
            </div>

            <Input label="Address Line" name="addressLine" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} required />
            <Input label="City" name="city" value={city} onChange={(e) => setCity(e.target.value)} required />
            <Input label="Pincode" name="pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} required />

            <label>
            <input type="checkbox" checked={twentyFourSeven} onChange={(e) => setTwentyFourSeven(e.target.checked)} />
            Open 24/7
            </label>

            {!twentyFourSeven && (
            <>
                <Input label="Opening Time" name="openingTime" type="time" value={openingTime} onChange={(e) => setOpeningTime(e.target.value)} />
                <Input label="Closing Time" name="closingTime" type="time" value={closingTime} onChange={(e) => setClosingTime(e.target.value)} />
            </>
            )}

            {isEditMode && (
            <label>
                <input type="checkbox" checked={isOpen} onChange={(e) => setIsOpen(e.target.checked)} />
                Currently Open
            </label>
            )}

            <Button loading={submitting} loadingText="Saving...">
            {isEditMode ? 'Save Changes' : 'Create Restaurant'}
            </Button>
        </form>
    </div>
  );
}

export default RestaurantFormPage;