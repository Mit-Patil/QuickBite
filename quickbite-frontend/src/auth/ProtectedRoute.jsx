import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute({ allowedRoles, children}){
    const {user} = useAuth();

    if(!user){
        return <Navigate to="/login" replace />;
    }

    if(allowedRoles && !allowedRoles.includes(user.role)){
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
}