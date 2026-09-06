import { useEffect, useState } from "react";
import { getMe, updateRestaurantOwnerProfile } from "../../api/userService";
import Input from "../../components/Input";
import Button from "../../components/Button";
import ErrorMessage from "../../components/ErrorMessage";
import styles from '../../styles/ProfilePage.module.css';

function ProfilePage(){
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [businessName, setBusinessName] = useState('');

    useEffect(()=>{
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            const response = await getMe();
            const data = response.data;

            setFullName(data.fullName || '');
            setPhone(data.phone || '');
            setBusinessName(data.businessName || '');
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
            await updateRestaurantOwnerProfile({fullName, phone, businessName})
            setSuccess('Profile Updated Successfully');
        } catch (err) {
            setError(err.message);
        }finally{
            setSubmitting(false);
        }
    }

    if(loading) return <p>Loading profile.....</p>;

    return (
        <div className={styles.wrapper}>
            <h1>My Profile</h1>
            <ErrorMessage message={error} />
            {success && <p className={styles.success}>{success}</p>}

            <form onSubmit={handleSubmit} className={styles.form}>
                <Input label="Business Name" name="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
                <Input label="Full Name" name="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                <Input label="Phone" name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />

                <Button loading={submitting} loadingText="Saving....">Save Changes</Button>
            </form>
        </div>

    );


}

export default ProfilePage;