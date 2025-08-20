import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import LoginPage from './LoginPage';
import AppLayout from './Layout/AppLayout';

import Overview from './Pages/Overview/Overview';
import BatchPage from './Pages/BatchPages';
import StatePage from './Pages/StatePage';
import DistrictPage from './Pages/DistrictPage';
import CountryPage from './Pages/Countrypage';
import CategoryPage from './pages/CategoryPage';
import ProductPage from './Pages/ProductPage';
import SerialStockCheckPage from './pages/SerialStockCheckPage';


import SoldPage from './pages/SoldPage';
import SalesList from './Pages/SalesList';
import AddNewSalePage from './Pages/AddNewSalePage';
import EditSalePage from './Pages/EditSalePage';
import ViewSalePage from './Pages/ViewSalePage';
import SaleReturnPage from './Pages/SaleReturnPage';
import SaleReturns from './Pages/SaleReturns';
import EditSaleReturnPage from './Pages/EditSaleReturnPage';
import SaleInvoice from './Pages/SaleInvoice';

import PcbPurchaseList from './Pages/PcbPurchaseList';
import AddPurchasePage from './Pages/AddPurchasePage';
import EditPurchasePage from './Pages/EditPurchasePage';

import PcbPurchaseReturn from './Pages/PcbPurchaseReturn';
import AddPcbReturnPage from './Pages/AddPcbReturnPage';
import PcbPurchaseReturnEdit from './Pages/PcbPurchaseReturnEdit';

import SparepartsPage from './Pages/SpareParts';
import PurchaseSparepartsPage from './Pages/PurchaseSpareParts';
import ReturnSparePartsPage from './Pages/ReturnSpareParts';
import Vendor from './Pages/vendor';
import VciCustomer from './Pages/VciCustomer';
// import AddProduct from './Pages/AddProduct';
import UrgentVciListPage from "./Pages/ChnagedVci";
import ServiceList from './Pages/ServiceList';
  import AddServicePage from './Pages/AddServicePage';
    import EditService from './Pages/EditService';
import TrackingPage from "./Pages/TrackingPage";
import UrgentVci from './Pages/UrgentVci';
import ChangedVciPage from "./Pages/ChnagedVci"; 
import EditUrgentVci from "./Pages/EditUrgentVci"; 

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('authToken'));

  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem('authToken'));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authEmail');
    setIsLoggedIn(false);
    window.location.href = '/login'; // ✅ Force immediate navigation
  };

  return (
    <Router>
      <Routes>
        {/* Redirect /login to /overview if already logged in */}
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/overview" replace />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />

        {/* Protected routes wrapper */}
        <Route
          path="/"
          element={
            isLoggedIn ? (
              <AppLayout onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          {/* Default route inside layout */}
          <Route index element={<Navigate to="overview" replace />} />

          {/* Protected Pages */}
          <Route path="overview" element={<Overview />} />
          <Route path="batch" element={<BatchPage />} />
          <Route path="state" element={<StatePage />} />
          <Route path="district" element={<DistrictPage />} />
          <Route path="countries" element={<CountryPage />} />
          <Route path="category" element={<CategoryPage />} />
          <Route path="productTest" element={<ProductPage />} />
          <Route path="serialStock" element={<SerialStockCheckPage />} />
          <Route path="sold" element={<SoldPage />} />

          {/* Sales Routes */}
          <Route path="salesOrder" element={<SalesList />} />
          <Route path="sales/add" element={<AddNewSalePage />} />
          <Route path="sales/edit/:id" element={<EditSalePage />} />
          <Route path="sales/view/:id" element={<ViewSalePage />} />
          <Route path="salesReturn" element={<SaleReturnPage />} />
          <Route path="returns/add" element={<SaleReturns />} />
          <Route path="returns/edit/:id" element={<EditSaleReturnPage />} />
          <Route path="pdf" element={<SaleInvoice />} />

          {/* Purchase Routes */}
          <Route path="purchaseOrder" element={<PcbPurchaseList />} />
          <Route path="purchase/add" element={<AddPurchasePage />} />
          <Route path="purchase/:id/edit" element={<EditPurchasePage />} />

          {/* Purchase Return Routes */}
          <Route path="purchaseReturn" element={<PcbPurchaseReturn />} />
          <Route path="pcb-purchase-return/add" element={<AddPcbReturnPage />} />
          <Route path="pcb-purchase-return/edit/:id" element={<PcbPurchaseReturnEdit />} />

          {/* Spare Parts */}
          <Route path="spareparts" element={<SparepartsPage />} />
          <Route path="PurchaseSpareParts" element={<PurchaseSparepartsPage />} />
          <Route path="ReturnSpareParts" element={<ReturnSparePartsPage />} />
          {/* <Route path="AddProducts" element={<AddProduct />} /> */}

          {/* Other Master Pages */}
          <Route path="Vendor" element={<Vendor />} />
          <Route path="VciCustomer" element={<VciCustomer />} />
                    <Route path="serviceProduct" element={<ServiceList />} />
          <Route path="/service-vci/add" element={<AddServicePage />} />
<Route path="/service-vci/:id/edit" element={<EditService />} />
                          <Route path="/tracking-by-challan/:id" element={<TrackingPage />} />
<Route path="/urgentvci" element={<UrgentVci />} />
<Route path="/urgent-vci-list" element={<UrgentVciListPage />} />

      <Route path="/changedvci" element={<ChangedVciPage />} />
        <Route path="/changed-vci/edit/:id" element={<EditUrgentVci />} />

        </Route>

        {/* Fallback to default routes based on auth */}
        <Route
          path="*"
          element={<Navigate to={isLoggedIn ? '/overview' : '/login'} replace />}
        />
      </Routes>

      <ToastContainer position="top-right" autoClose={2000} />
    </Router>
  );
}
