import { useState, useEffect, use } from "react";
import { getMe, updateDeliveryPartnerProfile } from "../../api/userService";
import Input from "../../components/Input";
import Button from "../../components/Button";
import ErrorMessage from "../../components/ErrorMessage";
import styles from '../../styles/ProfilePage.module.css';
import ImageUpload from "../../components/ImageUpload";
import { uploadDeliveryPartnerPicture } from "../../api/uploadService";

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
        } catch (err) {
            setError(err.message);
        }finally{
            setLoading(false);
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
        </div>
    );

}

export default ProfilePage;