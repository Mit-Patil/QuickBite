import { useState, useEffect } from "react";
import { getMe, updateDeliveryPartnerProfile, updateDeliveryPartnerLocation } from "../../api/userService";
import Input from "../../components/Input";
import Button from "../../components/Button";
import ErrorMessage from "../../components/ErrorMessage";
import Notice from "../../components/Notice";
import styles from '../../styles/ProfilePage.module.css';
import ImageUpload from "../../components/ImageUpload";
import { uploadDeliveryPartnerPicture } from "../../api/uploadService";
import CurrentLocationButton from "../../components/CurrentLocationButton";
import { MAP_CONFIG } from "../../config/map";
import MapPicker from "../../components/MapPicker";
import { Link } from 'react-router-dom';

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
    const [locationError, setLocationError] = useState('');
    const [locationSuccess, setLocationSuccess] = useState('');

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
        setLocationError('');
        setLocationSuccess('');

        if (position.accuracy > MAP_CONFIG.maxUsableAccuracyMeters) {
            setLocationError('We could only estimate your general area, so your location was not saved. Try on a phone or with GPS enabled.');
            return;
        }

        try {
            await updateDeliveryPartnerLocation({ latitude: position.lat, longitude: position.lng });
            setCurrentLocation({ lat: position.lat, lng: position.lng });
            setMapFocus({ lat: position.lat, lng: position.lng });
            setLocationSuccess('Location updated');
        } catch (err) {
            setLocationError(err.message);
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

    if(loading) return <p className={styles.loading}>Loading profile...</p>;

    return (
        <div className={styles.wrapper}>
            <header className={styles.header}>
                <h1 className={styles.title}>My Profile</h1>
                <p className={styles.subtitle}>Vehicle details and your last known location</p>
            </header>

            <div className={styles.layout}>
                <aside className={styles.sidebar}>
                    <ImageUpload
                        variant="stacked"
                        currentImageUrl={profilePicUrl}
                        uploadFn={uploadDeliveryPartnerPicture}
                        onUploaded={(updated) => setProfilePicUrl(updated.profilePicUrl)}
                    />
                    <p className={styles.summaryName}>{fullName || 'Your name'}</p>
                    <span className={styles.roleTag}>Delivery Partner</span>

                    <ul className={styles.navList}>
                        <li><Link to="/delivery" className={styles.navLink}>🏍️ Home</Link></li>
                    </ul>
                </aside>

                <div className={styles.main}>
                    <section className={styles.card}>
                        <ErrorMessage message={error} />
                        {success && <Notice variant="success">{success}</Notice>}

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <Input label="Full Name" name="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" required />
                            <Input label="Phone" name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
                            <Input label="Vehicle Type" name="vehicleType" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="e.g. Bike, Scooter" />
                            <Input label="Vehicle Number" name="vehicleNumber" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="e.g. GJ 05 AB 1234" />

                            <Button loading={submitting} loadingText="Saving...">Save Changes</Button>
                        </form>
                    </section>

                    <section className={styles.card}>
                        <h2 className={styles.cardTitle}>My Location</h2>
                        <ErrorMessage message={locationError} />
                        {locationSuccess && <Notice variant="success">{locationSuccess}</Notice>}

                        <p className={styles.locationStatus}>
                            {currentLocation
                                ? `Last saved: ${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}`
                                : 'No location saved yet.'}
                        </p>

                        {currentLocation && (
                            <div className={styles.mapBox}>
                                <MapPicker value={currentLocation} readOnly focus={mapFocus} height="240px" />
                            </div>
                        )}

                        <CurrentLocationButton className={styles.locationButton} onLocated={handleLocated} onError={setLocationError} />
                    </section>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;