import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

    const navigate = useNavigate();

    async function handleSubmit(e){
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await registerDeliveryPartner({fullName, email, phone, password, vehicleType, vehicleNumber});
            navigate('/login');
        } catch (err) {
            setError(err.message);
        }finally{
            setLoading(false);
        }
    }

    return (
        <>
            <h2 className={styles.title}>Deliver with us</h2>
            <p className={styles.subtitle}>Join our delivery network</p>

            <form onSubmit={handleSubmit} className={styles.form}>
                <ErrorMessage message={error}/>

                <Input label="Full Name" name="fullName" value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name" autoComplete="name" required />

                <Input label="Email" name="email" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" autoComplete="email" required />

                <Input label="Phone" name="phone" type="tel" value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Mobile number" autoComplete="tel" required />

                <Input label="Password" name="password" type="password" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters" autoComplete="new-password" required />

                <Input label="Vehicle Type" name="vehicleType" value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    placeholder="e.g. Bike, Scooter" required />

                <Input label="Vehicle Number" name="vehicleNumber" value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="e.g. GJ 05 AB 1234" autoComplete="off" required />

                <Button loading={loading} loadingText="Creating account...">Create Delivery Account</Button>
            </form>
        </>
    );
}

export default DeliveryPartnerRegister;