
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import IndexWrapper from './pages/IndexWrapper';
import BonDeLivraison from './pages/BonDeLivraison';
import Admin from './pages/Admin';
import History from './pages/History';
import NotFound from './pages/NotFound';
import { Toaster } from './components/ui/toaster';
import DeliveryDetails from './pages/DeliveryDetails';
import AddReceipt from './pages/AddReceipt';
import LoginPage from './pages/LoginPage';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <IndexWrapper />
            </ProtectedRoute>
          } />
          
          <Route path="/bondelivraison/:companyId" element={
            <ProtectedRoute>
              <BonDeLivraison />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/:companyId" element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          } />
          
          <Route path="/history" element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          } />
          
          <Route path="/details/:year" element={
            <ProtectedRoute>
              <DeliveryDetails />
            </ProtectedRoute>
          } />
          
          <Route path="/details/:year/:month" element={
            <ProtectedRoute>
              <DeliveryDetails />
            </ProtectedRoute>
          } />
          
          <Route path="/add-receipt" element={
            <ProtectedRoute>
              <AddReceipt />
            </ProtectedRoute>
          } />
          
          <Route path="/add-receipt/:companyId" element={
            <ProtectedRoute>
              <AddReceipt />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
