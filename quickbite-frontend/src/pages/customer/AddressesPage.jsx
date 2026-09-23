import { useEffect, useRef, useState } from "react";
import { getAddress, addAddress, deleteAddress, updateAddress } from "../../api/addressService";
import Input from "../../components/Input";
import Button from "../../components/Button";
import ErrorMessage from "../../components/ErrorMessage";
import styles from  './AddressesPage.module.css';
import LocationPicker from "../../components/LocationPicker";
import Notice from "../../components/Notice";

function AddressesPage(){
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [addressLine, setAddressLine] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [pin, setPin] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const touched = useRef({ city: false, pincode: false });
  const formCardRef = useRef(null);
  
  useEffect(() =>{
    loadAddresses();
  }, []);

  async function loadAddresses() {
    try {
        const response = await getAddress();
        setAddresses(response.data);    
    } catch (err) {
        setError(err.message);
    }finally{
        setLoading(false);
    }
  }

    function resetForm(){
        setEditingId(null);
        setAddressLine('');
        setLandmark('');
        setCity('');
        setPincode('');
        setPin(null);
        setFormError('');
        touched.current = { city: false, pincode: false };
        setFormKey((k) => k + 1);
    }

    function startEdit(address){
        setEditingId(address.id);
        setAddressLine(address.addressLine);
        setLandmark(address.landmark || '');
        setCity(address.city);
        setPincode(address.pincode);
        setPin(
            address.latitude != null && address.longitude != null
                ? { lat: address.latitude, lng: address.longitude }
                : null
        );
        setFormError('');
        touched.current = { city: true, pincode: true };
        setFormKey((k) => k + 1);
        formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function handleSuggestion(place) {
        if (!touched.current.city) setCity(place.city);
        if (!touched.current.pincode) setPincode(place.pincode);
        }

    async function handleSubmit(e) {
        e.preventDefault();
        setFormError('');

        if (!pin) {
            setFormError('Please pin your location on the map');
            return;
        }

        setSubmitting(true);
        const data = { addressLine, landmark, city, pincode, latitude: pin.lat, longitude: pin.lng };

        try {
            if(editingId){
                await updateAddress(editingId, data);
            }else{
                await addAddress(data);
            }
            resetForm();
            await loadAddresses();
        } catch (err) {
            setFormError(err.message);
        }finally{
            setSubmitting(false);
        }
    }


    async function handleDelete(id) {
        if (!window.confirm('Delete this address?')) return;
        try {
            await deleteAddress(id);
            if (editingId === id) resetForm();
            await loadAddresses();
        } catch (err) {
            setError(err.message);
        }
    }

  async function handleSetDefault(id) {
    try {
        await updateAddress(id, {isDefault : true});
        await loadAddresses();
    } catch (err) {
        setError(err.message);
    }
  }
  
    if (loading) return <p className={styles.loading}>Loading addresses...</p>;

    return (
        <div>
            <header className={styles.header}>
                <h1 className={styles.title}>My Addresses</h1>
                <p className={styles.subtitle}>Saved delivery locations for faster checkout</p>
            </header>

            <ErrorMessage message={error} />

            <section>
                <h2 className={styles.sectionTitle}>Saved addresses</h2>

                {addresses.length === 0 ? (
                    <div className={styles.empty}>
                        <p className={styles.emptyTitle}>No saved addresses yet</p>
                        <p className={styles.emptyText}>Add one using the map below and it will be ready at checkout.</p>
                    </div>
                ) : (
                    <ul className={styles.list}>
                        {addresses.map((address) => (
                            <li
                                key={address.id}
                                className={`${styles.item} ${editingId === address.id ? styles.itemEditing : ''}`}
                            >
                                <div className={styles.itemHeader}>
                                    <p className={styles.line}>{address.addressLine}</p>
                                    {address.isDefault && <span className={styles.defaultBadge}>Default</span>}
                                </div>

                                <p className={styles.meta}>{address.city} - {address.pincode}</p>
                                {address.landmark && <p className={styles.meta}>Near {address.landmark}</p>}

                                {address.latitude == null && (
                                    <Notice variant="warning" className={styles.notice}>
                                        Location not pinned. Edit this address to add it.
                                    </Notice>
                                )}

                                <div className={styles.actions}>
                                    {!address.isDefault && (
                                        <button type="button" onClick={() => handleSetDefault(address.id)}>
                                            Set as default
                                        </button>
                                    )}
                                    <button type="button" onClick={() => startEdit(address)}>Edit</button>
                                    <button type="button" className={styles.dangerButton} onClick={() => handleDelete(address.id)}>
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section ref={formCardRef} className={styles.editorCard}>
                <h2 className={styles.sectionTitle}>{editingId ? 'Edit address' : 'Add new address'}</h2>

                <form onSubmit={handleSubmit} className={styles.editor}>
                    <ErrorMessage message={formError} className={styles.fullRow} />

                    <div className={styles.mapColumn}>
                        <LocationPicker
                            key={formKey}
                            value={pin}
                            onChange={setPin}
                            onSuggestion={handleSuggestion}
                            height="420px"
                        />
                    </div>

                    <div className={styles.fieldsColumn}>
                        <Notice>City and pincode are filled from the map. Please check them.</Notice>

                        <Input
                            label="Address Line"
                            name="addressLine"
                            value={addressLine}
                            onChange={(e) => setAddressLine(e.target.value)}
                            placeholder="House / flat no., building, street"
                            autoComplete="street-address"
                            required
                        />
                        <Input
                            label="Landmark"
                            name="landmark"
                            value={landmark}
                            onChange={(e) => setLandmark(e.target.value)}
                            placeholder="Optional, e.g. near City Mall"
                        />
                        <Input
                            label="City"
                            name="city"
                            value={city}
                            onChange={(e) => { touched.current.city = true; setCity(e.target.value); }}
                            autoComplete="address-level2"
                            required
                        />
                        <Input
                            label="Pincode"
                            name="pincode"
                            value={pincode}
                            onChange={(e) => { touched.current.pincode = true; setPincode(e.target.value); }}
                            maxLength={6}
                            inputMode="numeric"
                            autoComplete="postal-code"
                            required
                        />

                        <Button loading={submitting} loadingText={editingId ? 'Updating...' : 'Adding...'}>
                            {editingId ? 'Update Address' : 'Add Address'}
                        </Button>

                        {editingId && (
                            <button type="button" className={styles.cancel} onClick={resetForm}>Cancel</button>
                        )}
                    </div>
                </form>
            </section>
        </div>
    );

}

export default AddressesPage;