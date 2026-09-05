import { useEffect, useState } from "react";
import { getAddress, addAddress, deleteAddress, updateAddress } from "../../api/addressService";
import Input from "../../components/Input";
import Button from "../../components/Button";
import ErrorMessage from "../../components/ErrorMessage";
import styles from  './AddressesPage.module.css';

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
  }

  function startEdit(address){
    setEditingId(address.id);
    setAddressLine(address.addressLine);
    setLandmark(address.landmark);
    setCity(address.city);
    setPincode(address.pincode);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    const data = { addressLine, landmark, city, pincode };

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
    try {
        await deleteAddress(id);
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
  
  if(loading) return <p>Loading Addresses...</p>;

  return (
    <div>
        <h1>My Addresses</h1>
        <ErrorMessage message={error} />

        <ul className={styles.list}>
            {addresses.map((address) => (
                <li key={address.id} className={styles.item}>
                    <p>{address.addressLine}, {address.city} - {address.pincode}</p>
                    {address.landmark && <p>Landmark: {address.landmark}</p>}
                    {address.isDefault ? (
                        <span className={styles.defaultBadge}>default</span>
                    ):(
                        <button onClick={() => handleSetDefault(address.id)}>Set As Default</button>
                    )}
                    <button onClick={() => startEdit(address)}>Edit</button>
                    <button onClick={() => handleDelete(address.id)}>delete</button>
                </li>
            ))}
        </ul>

        <h2>{editingId ? 'Edit Address' : 'Add New Address'}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
            <ErrorMessage message={formError} />

            <Input label="Address Line" name="addressLine" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} required />
            <Input label="Landmark" name="landmark" value={landmark} onChange={(e) => setLandmark(e.target.value)} />
            <Input label="City" name="city" value={city} onChange={(e) => setCity(e.target.value)} required />
            <Input label="Pincode" name="pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} required />
        
            <Button loading={loading} loadingText={editingId ? 'Updating...' : 'Adding ...'}>
                {editingId ? 'Update Address' : 'Add Address'}
            </Button>

            {editingId && (
                <button type="button" onClick={resetForm}>Cancel</button>
            )}

        </form>
    </div>
  );

}

export default AddressesPage;