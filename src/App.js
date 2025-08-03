import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "./App.css";
import Appointment from "./components/AppointmentModule/Appointment";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import Dashboard from "./components/Dashboard";
import Category from "./components/Category";
import Brand from "./components/Brand";
import Unit from "./components/UnitOfMeasurement";
import Inventory from "./components/Inventory";
import Product from "./components/Product";
import Supplier from "./components/Supplier";
import Sales from "./components/Sales";
import PointofSales from "./components/PointofSales";
import Orders from "./components/Orders";
import Services from "./components/Services";
import UserManagement from "./components/UserManagement";
import UserProfile from "./components/UserProfile";
import ListClients from "./components/ListClients";
import LogHistory from "./components/LogHistory";
import ImmunizationForm from "./components/ImmunizationForm";
import SurgicalForm from "./components/SurgicalForm";
import Archive from "./components/ArchiveManager";
import VerificationAccount from "./components/VerificationAccount";
import ArchivedSupplierManagement from "./components/Archive/ArchivedSupplierManagement";
import Generic from "./components/Generic";
import ReportGeneration from "./components/ReportGeneration";
import Forecasting from "./components/Forecasting";
import PendingAppointments from "./components/AppointmentModule/PendingAppointment";
import ClientAppointment from "./components/ClientModule/ClientAppointment";
import ClientAppointmentForm from "./components/ClientModule/ClientInfo";
import ReferenceTracking from "./components/ClientModule/ReferenceTracking";
import GeneralSettings from "./components/Settings/GeneralSettings";

function App() {
  // Manage the authentication state in App.js
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("userID") !== null
  );

  // Handle login function, which updates the authentication state
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Public routes (client-side) */}
          <Route path="/southpaws-booking/*" element={<ClientAppointment />} />
          <Route
            path="/southpaws-booking/appointment-form"
            element={<ClientAppointmentForm />}
          />
          <Route
            path="/southpaws-booking/reference-tracking"
            element={<ReferenceTracking />}
          />

          {/* Authenticated routes */}
          {isAuthenticated ? (
            <>
              <Route
                path="/*"
                element={
                  <>
                    <Sidebar />
                    <div className="content">
                      <Topbar />
                      <Routes>
                        <Route path="/" element={<Navigate to="/home" />} />
                        <Route
                          path="information/clients"
                          element={<ListClients />}
                        />
                        <Route path="home" element={<Dashboard />} />
                        <Route path="category" element={<Category />} />
                        <Route path="brand" element={<Brand />} />
                        <Route path="generic" element={<Generic />} />
                        <Route path="unitofmeasurement" element={<Unit />} />
                        <Route path="inventory" element={<Inventory />} />
                        <Route path="products" element={<Product />} />
                        <Route path="suppliers" element={<Supplier />} />
                        <Route path="sales" element={<Sales />} />
                        <Route path="pointofsales" element={<PointofSales />} />
                        <Route path="orders" element={<Orders />} />
                        <Route path="services" element={<Services />} />
                        <Route path="profile" element={<UserProfile />} />
                        <Route
                          path="usermanagement"
                          element={<UserManagement />}
                        />
                        <Route path="history" element={<LogHistory />} />
                        <Route
                          path="ImmunizationForm"
                          element={<ImmunizationForm />}
                        />
                        <Route path="SurgicalForm" element={<SurgicalForm />} />
                        <Route path="archive" element={<Archive />} />
                        <Route
                          path="archived-suppliers"
                          element={<ArchivedSupplierManagement />}
                        />
                        <Route
                          path="report-generation"
                          element={<ReportGeneration />}
                        />
                        <Route path="forecasting" element={<Forecasting />} />
                        <Route path="appointment" element={<Appointment />} />
                        <Route
                          path="appointment/pending"
                          element={<PendingAppointments />}
                        />
                        <Route path="settings" element={<GeneralSettings />} />
                      </Routes>
                    </div>
                  </>
                }
              />
            </>
          ) : (
            <>
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/verify" element={<VerificationAccount />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          )}
        </Routes>
      </BrowserRouter>
      <ToastContainer />
    </div>
  );
}

export default App;
