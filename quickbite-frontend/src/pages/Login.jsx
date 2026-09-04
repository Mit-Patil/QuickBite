import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import ErrorMessage from '../components/ErrorMessage';
import Input from "../components/Input";
import styles from '../styles/AuthForm.module.css';
import Button from "../components/Button";

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
        <div className={styles.wrapper}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <h1>Login</h1>

                <ErrorMessage message={error}/>

                <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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

                <Button loading={loading} loadingText="Logging in...">Login</Button>

                <p>Don't have an account? <Link to="/register/customer">Register</Link></p>
                <p>Own a restaurant? <Link to="/register/restaurant">Register here</Link></p>
                <p>Want to deliver? <Link to="/register/delivery-partner">Register here</Link></p>
            </form>
        </div>
    );

}

export default Login;