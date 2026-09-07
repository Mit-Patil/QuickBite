// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import Login from './pages/Login';
import CustomerHome from './pages/customer/CustomerHome';
import RestaurantDashboard from './pages/restaurant-owner/RestaurantDashboard';
import CustomerRegister from './pages/customer/CustomerRegister';
import RestaurantOwnerRegister from './pages/restaurant-owner/RestaurantOwnerRegister';
import DeliveryPartnerRegister from './pages/delivery/DeliveryPartnerRegister';
import DeliveryHome from './pages/delivery/DeliveryHome';
import CustomerLayout from './pages/customer/CustomerLayout';
import AddressesPage from './pages/customer/AddressesPage';
import ProfilePage from './pages/customer/ProfilePage';
import RestaurantLayout from './pages/restaurant-owner/RestaurantLayout';
import RestaurantProfilePage from './pages/restaurant-owner/ProfilePage';
import DeliveryLayout from './pages/delivery/DeliveryLayout';
import DeliveryProfilePage from './pages/delivery/ProfilePage';
import RestaurantDetailPage from './pages/customer/RestaurantDetailPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace/>}/>
      <Route path="/login" element={<Login />} />

      <Route path="/register/customer" element={<CustomerRegister />} />
      <Route path="/register/restaurant" element={<RestaurantOwnerRegister />} />
      <Route path="/register/delivery-partner" element={ <DeliveryPartnerRegister /> } />

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

      <Route 
        path = "/delivery/*"
        element={
          <ProtectedRoute allowedRoles={['DELIVERY_PARTNER']}>
            <DeliveryHome />
          </ProtectedRoute>
        }
      />

      <Route
        path = "/customer"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
      <Route index element={<CustomerHome />} />
      <Route path="addresses" element={<AddressesPage />} /> 
      <Route path="profile" element={<ProfilePage />} />
      <Route path="restaurant/:id" element={<RestaurantDetailPage />} />
      </Route>

      <Route 
        path='/restaurant'
        element={
          <ProtectedRoute allowedRoles={['RESTAURANT_OWNER']}>
            <RestaurantLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RestaurantDashboard />} />
        <Route path='profile' element={<RestaurantProfilePage />} />
      </Route>  

      <Route 
        path="/delivery"
        element={
          <ProtectedRoute allowedRoles={['DELIVERY_PARTNER']}>
            <DeliveryLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DeliveryHome />}/>
        <Route path='profile' element={<DeliveryProfilePage />}/>
      </Route>

    </Routes>
  );
}

export default App;