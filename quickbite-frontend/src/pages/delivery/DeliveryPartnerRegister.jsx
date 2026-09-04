import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerDeliveryPartner } from "../../api/userService";
import styles from '../../styles/AuthForm.module.css';
import ErrorMessage from "../../components/ErrorMessage";
import Input from "../../components/Input";
import Button from "../../components/Button";

function DeliveryPartnerRegister(){
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [vehicleType, setVehicleType] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const naviagte = useNavigate();

    async function handleSubmit(e){
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await registerDeliveryPartner({fullName, email, phone, password, vehicleType, vehicleNumber});
            naviagte('/login');
        } catch (err) {
            setError(err.message);
        }finally{
            setLoading(false);
        }
    }

    return (
        <div className={styles.wrapper}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <h1>Register as a Delivery Partner</h1>

                <ErrorMessage message={error}/>

                <Input label="Full Name" name="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                <Input label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <Input label="Phone" name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                <Input label="Password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <Input label="Vehicle Type" name="vehicleType" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} required />
                <Input label="Vehicle Number" name="vehicleNumber" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} required />

                <Button loading={loading} loadingText="Creating account...">Register</Button>

                <p>Already have an account? <Link to="/login">Login</Link></p>
            </form>
        </div>
    );
}

export default DeliveryPartnerRegister;