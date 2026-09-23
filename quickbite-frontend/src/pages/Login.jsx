import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import ErrorMessage from '../components/ErrorMessage';
import Input from "../components/Input";
import styles from '../styles/AuthForm.module.css';
import Button from "../components/Button";
import AuthLayout from "../components/AuthLayout";

function Login(){
    const [email,setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const {login} = useAuth();
    const navigate = useNavigate();

    async function  handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await login({email, password});
            if(user.role === 'CUSTOMER'){
                navigate('/customer');
            }else if(user.role === 'RESTAURANT_OWNER'){
                navigate('/restaurant');
            }
            else if(user.role === 'DELIVERY_PARTNER'){
                navigate('/delivery');
            }
        } catch (err) {
            setError(err.message);
        }finally{
            setLoading(false);
        }
    }

    return (
        <>
            <h2 className={styles.title}>Welcome back</h2>
            <p className={styles.subtitle}>Sign in to your account</p>

            <form onSubmit={handleSubmit} className={styles.form}>
                <ErrorMessage message={error} />

                <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                />

                <Input
                    label="Password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                />

                <Button loading={loading} loadingText="Signing in...">Sign In</Button>
            </form>

            <div className={styles.partnerRow}>
                Want to partner with us?
                <div className={styles.partnerLinks}>
                    <Link to="/register/restaurant">List your restaurant</Link>
                    <Link to="/register/delivery-partner">Deliver with us</Link>
                </div>
            </div>
        </>
    );
}

export default Login;