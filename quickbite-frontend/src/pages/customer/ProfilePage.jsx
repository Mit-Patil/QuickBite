import { useEffect, useState } from "react";
import { getMe, updateCustomerProfile } from "../../api/userService";
import Input from '../../components/Input';
import ErrorMessage from '../../components/ErrorMessage';
import Notice from '../../components/Notice';
import Button from '../../components/Button';
import styles from '../../styles/ProfilePage.module.css';
import Select from "../../components/Select";
import ImageUpload from "../../components/ImageUpload";
import { uploadCustomerProfilePicture } from "../../api/uploadService";
import { Link } from 'react-router-dom';

function ProfilePage(){
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [profilePicUrl, setProfilePicUrl] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');

    useEffect(() =>{
        loadprofile();
    }, []);

    async function loadprofile() {
        try {
            const response = await getMe();
            const data = response.data;
            setFullName(data.fullName || '');
            setPhone(data.phone || '');
            setGender(data.gender || '');
            setDateOfBirth(data.dateOfBirth || '');
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

        try{
            await updateCustomerProfile({ fullName, phone, gender, dateOfBirth});
            setSuccess('Profile updated successfully');
        }catch(err){
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
                <p className={styles.subtitle}>Manage your account details</p>
            </header>

            <div className={styles.layout}>
                <aside className={styles.sidebar}>
                    <ImageUpload
                        variant="stacked"
                        currentImageUrl={profilePicUrl}
                        uploadFn={uploadCustomerProfilePicture}
                        onUploaded={(updated) => setProfilePicUrl(updated.profilePicUrl)}
                    />
                    <p className={styles.summaryName}>{fullName || 'Your name'}</p>
                    <span className={styles.roleTag}>Customer</span>

                    <ul className={styles.navList}>
                        <li><Link to="/customer" className={styles.navLink}>🍽️ Browse restaurants</Link></li>
                        <li><Link to="/customer/cart" className={styles.navLink}>🛒 My cart</Link></li>
                        <li><Link to="/customer/orders" className={styles.navLink}>📋 My orders</Link></li>
                        <li><Link to="/customer/addresses" className={styles.navLink}>📍 Addresses</Link></li>
                    </ul>
                </aside>

                <div className={styles.main}>
                    <section className={styles.card}>
                        <ErrorMessage message={error} />
                        {success && <Notice variant="success">{success}</Notice>}

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <Input label="Full Name" name="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                            <Input label="Phone" name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />

                            <Select
                                label="Gender"
                                name="gender"
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                options={[
                                    { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
                                    { value: 'MALE', label: 'Male' },
                                    { value: 'FEMALE', label: 'Female' },
                                    { value: 'OTHER', label: 'Other'},
                                ]}
                            />

                            <Input label="Date Of Birth" name="dateOfBirth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />

                            <Button loading={submitting} loadingText="Saving...">Save Changes</Button>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;