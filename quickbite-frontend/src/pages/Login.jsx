import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import ErrorMessage from '../components/ErrorMessage';

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
        } catch (err) {
            setError(err.message);
        }finally{
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <h1>Login</h1>

            <ErrorMessage message={error}/>

            <input 
                type="email"
                placeholder="Enter Your Email"
                value={email}
                onChange={(e)=> setEmail(e.target.value)}
                required
            />

            <input 
                type="password"
                placeholder="Enter Password"
                value = {password}
                onChange={(e) => setPassword(e.target.value)}
                required    
            />

            <button type="submit" disabled = {loading}>
                {loading ? 'Logging in ..' : 'Login'}
            </button>
        </form>
    );

}

export default Login;