import { useEffect, useState } from "react";
import { getMe, updateRestaurantOwnerProfile } from "../../api/userService";
import Input from "../../components/Input";
import Button from "../../components/Button";
import ErrorMessage from "../../components/ErrorMessage";
import Notice from "../../components/Notice";
import styles from '../../styles/ProfilePage.module.css';
import ImageUpload from "../../components/ImageUpload";
import { uploadRestaurantLogo } from "../../api/uploadService";
import { Link } from 'react-router-dom';

function ProfilePage(){
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [logoUrl, setLogoUrl] = useState('');
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
            setLogoUrl(data.logoUrl || '');
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
                <p className={styles.subtitle}>Business details owners see across their restaurants</p>
            </header>

            <div className={styles.layout}>
                <aside className={styles.sidebar}>
                    <ImageUpload
                        variant="stacked"
                        currentImageUrl={logoUrl}
                        uploadFn={uploadRestaurantLogo}
                        onUploaded={(updated) => setLogoUrl(updated.logoUrl)}
                    />
                    <p className={styles.summaryName}>{businessName || 'Your business'}</p>
                    <span className={styles.roleTag}>Restaurant Owner</span>

                    <ul className={styles.navList}>
                        <li><Link to="/restaurant" className={styles.navLink}>🍴 Dashboard</Link></li>
                    </ul>
                </aside>

                <div className={styles.main}>
                    <section className={styles.card}>
                        <ErrorMessage message={error} />
                        {success && <Notice variant="success">{success}</Notice>}

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <Input label="Business Name" name="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} autoComplete="organization" required />
                            <Input label="Full Name" name="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" required />
                            <Input label="Phone" name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />

                            <Button loading={submitting} loadingText="Saving...">Save Changes</Button>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;