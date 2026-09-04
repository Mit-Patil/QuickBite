import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerCustomer } from "../../api/userService";
import Input from "../../components/Input";
import ErrorMessage from "../../components/ErrorMessage";
import styles from '../../styles/AuthForm.module.css';
import Button from "../../components/Button";

function CustomerRegister(){
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await registerCustomer({fullName, email, phone, password});
            navigate('/login');
        } catch (err) {
            setError(err.message);
        }finally{
            setLoading(false);
        }
        
    }

    return (
        <div className={styles.wrapper}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <h1>Create a Customer Account</h1>

                <ErrorMessage message={error} />

                <Input 
                    label="Full Name"
                    name="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                />

                <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <Input 
                    label="Phone"
                    name="phone" 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    required 
                />

                <Input 
                    label="Password" 
                    name="password" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                />

                <Button loading={loading} loadingText="Creating Account...">Register</Button>

                <p>Already have an account? <Link to="/login">Login</Link></p>
            </form>
        </div>
    );

}

export default CustomerRegister;