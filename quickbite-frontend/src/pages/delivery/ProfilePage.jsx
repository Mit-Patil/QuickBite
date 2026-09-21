import { useState, useEffect, use } from "react";
import { getMe, updateDeliveryPartnerProfile, updateDeliveryPartnerLocation } from "../../api/userService";
import Input from "../../components/Input";
import Button from "../../components/Button";
import ErrorMessage from "../../components/ErrorMessage";
import styles from '../../styles/ProfilePage.module.css';
import ImageUpload from "../../components/ImageUpload";
import { uploadDeliveryPartnerPicture } from "../../api/uploadService";
import CurrentLocationButton from "../../components/CurrentLocationButton";
import { MAP_CONFIG } from "../../config/map";
import MapPicker from "../../components/MapPicker";

function ProfilePage(){
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [profilePicUrl, setProfilePicUrl] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [vehicleType, setVehicleType] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [currentLocation, setCurrentLocation] = useState(null);
    const [mapFocus, setMapFocus] = useState(null);

    useEffect(()=>{
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            const response = await getMe();
            const data = response.data;

            setFullName(data.fullName || '');
            setPhone(data.phone || '');
            setVehicleType(data.vehicleType || '');
            setVehicleNumber(data.vehicleNumber || '');
            setProfilePicUrl(data.profilePicUrl || '');
            setCurrentLocation(
                data.currentLat != null && data.currentLng != null
                    ? { lat: data.currentLat, lng: data.currentLng }
                    : null
            );
        } catch (err) {
            setError(err.message);
        }finally{
            setLoading(false);
        }
    }

    async function handleLocated(position) {
        setError('');
        setSuccess('');

        if (position.accuracy > MAP_CONFIG.maxUsableAccuracyMeters) {
            setError('We could only estimate your general area, so your location was not saved. Try on a phone or with GPS enabled.');
            return;
        }

        try {
            await updateDeliveryPartnerLocation({ latitude: position.lat, longitude: position.lng });
            setCurrentLocation({ lat: position.lat, lng: position.lng });
            setMapFocus({ lat: position.lat, lng: position.lng });
            setSuccess('Location updated');
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            await updateDeliveryPartnerProfile({fullName, phone, vehicleType, vehicleNumber});
            setSuccess('Profile updated successfully');
        } catch (err) {
            setError(err.message);
        }finally{
            setSubmitting(false);
        }
    }

    if(loading) return <p>Loading profile....</p>;

    return (
        <div className={styles.wrapper}>
            <h1>My Profile</h1>
            <ErrorMessage message={error} />
            {success && <p className={styles.success}>{success}</p>}

            <form onSubmit={handleSubmit} className={styles.form}>

                <ImageUpload
                    currentImageUrl={profilePicUrl}
                    uploadFn={uploadDeliveryPartnerPicture}
                    onUploaded={(updated) => setProfilePicUrl(updated.profilePicUrl)}
                />    

                <Input label="Full Name" name="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                <Input label="Phone" name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <Input label="Vehicle Type" name="vehicleType" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} />
                <Input label="Vehicle Number" name="vehicleNumber" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} />

                <Button loading={submitting} loadingText="Saving...">Save Changes</Button>
            </form>

            <h2>My Location</h2>
            <p>
                {currentLocation
                    ? `Last saved: ${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}`
                    : 'No location saved yet.'}
            </p>
            {currentLocation && (
                <MapPicker value={currentLocation} readOnly focus={mapFocus} height="250px" />
            )}
            <CurrentLocationButton onLocated={handleLocated} onError={setError} />
        </div>
    );

}

export default ProfilePage;