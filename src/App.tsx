
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Index from './pages/Index';
import Admin from './pages/Admin';
import History from './pages/History';
import NotFound from './pages/NotFound';
import { Toaster } from './components/ui/toaster';
import DeliveryDetails from './pages/DeliveryDetails';
import AddReceipt from './pages/AddReceipt';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/history" element={<History />} />
        <Route path="/details/:year" element={<DeliveryDetails />} />
        <Route path="/details/:year/:month" element={<DeliveryDetails />} />
        <Route path="/add-receipt" element={<AddReceipt />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
