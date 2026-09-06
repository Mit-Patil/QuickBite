import { useEffect, useState } from "react";
import { getMe, updateCustomerProfile } from "../../api/userService";
import Input from '../../components/Input';
import ErrorMessage from '../../components/ErrorMessage';
import Button from '../../components/Button';
import styles from '../../styles/ProfilePage.module.css';

function ProfilePage(){
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

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
            setSuccess('Profile upadated Successfully');
        }catch(err){
            setError(err.message);
        }finally{
            setSubmitting(false);
        }
    }

    if(loading) return <p>Loading Profile...</p>;

    return (
        <div className={styles.wrapper}>
            <h1>My Profile</h1>
            <ErrorMessage message={error}/>
            {success && <p className={styles.success}>{success}</p>}

            <form onSubmit={handleSubmit} className={styles.form}>

                <Input label="Full Name" name="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                <Input label="Phone" name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />

                <div className={styles.field}>
                    <label htmlFor="gender" className={styles.label}>Gender</label>
                    <select id = "gender" value={gender} onChange={(e) => setGender(e.target.value)} className={styles.select}>
                        <option value="PREFER_NOT_TO_SAY">Prefer not say</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value='OTHER'>Other</option>
                    </select>
                </div>

                <Input label="Date Of Birth" name="dateOfBirth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />

                <Button loading={submitting} loadingText="Saving....">Save Changes</Button>
            </form>
        </div>
    );

}

export default ProfilePage;