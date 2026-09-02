import { createContext, useContext, useState } from "react";
import {login as loginRequest} from '../api/userService';

const AuthContext = createContext(null);

export function AuthProvider({children}){
    const [user, setUser] = useState(()=>{
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });

    async function login(credentials) {
        const response = await loginRequest(credentials);
        const { token, email, role } = response.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({email, role}));
        setUser({email, role});
        return {email, role};
    }

    function logout(){
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{user, login, logout}}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(){
    return useContext(AuthContext);
}