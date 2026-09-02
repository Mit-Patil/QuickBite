// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import Login from './pages/Login';
import CustomerHome from './pages/customer/CustomerHome';
import RestaurantDashboard from './pages/restaurant-owner/RestaurantDashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace/>}/>
      <Route path="/login" element={<Login />} />

      <Route
        path="/customer/*"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <CustomerHome />
          </ProtectedRoute>
        }
      />

      <Route
        path="/restaurant/*"
        element={
          <ProtectedRoute allowedRoles={['RESTAURANT_OWNER']}>
            <RestaurantDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;