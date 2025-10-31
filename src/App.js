import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

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
import GeneralSettings from "./components/Settings/GeneralSettings";
import ConfirmedAppointments from "./components/AppointmentModule/Tables/ConfirmedAppointments";
import CancelledAppointment from "./components/AppointmentModule/Tables/CancelledAppointment";
import DoneAppointments from "./components/AppointmentModule/Tables/DoneAppointments";
import PendingAppointments from "./components/AppointmentModule/Tables/PendingAppointment";
import ChatbotModal from "./components/Chatbot/Chatbot";
import ClientWebsite from "./components/AppointmentModule/ClientSide/ClientWebsite";
import LoaderPage from "./components/StatusPages/LoaderPage";
import WebsiteDown from "./components/StatusPages/WebsiteDown";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("userID") !== null
  );

  const [showChatbot, setShowChatbot] = useState(
    localStorage.getItem("chatbotOpen") === "true"
  );

  const [triggerIntro, setTriggerIntro] = useState(false);

  const handleLogin = () => setIsAuthenticated(true);
  const [loading, setLoading] = useState(true);
  const [serverUp, setServerUp] = useState(true);
  const [publicContent, setPublicContent] = useState(null);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    localStorage.setItem("chatbotOpen", showChatbot);
  }, [showChatbot]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/ClientSide/get_public_content.php`
        );

        if (!res.data.success) throw new Error("Website down");

        setPublicContent(res.data);
        setServerUp(true);
      } catch (error) {
        setServerUp(false);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleOpenChatbot = () => {
    setShowChatbot(true);
    setTriggerIntro(true); 
  };

  if (loading) return <LoaderPage />;

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* ---------------- PUBLIC ROUTES ---------------- */}
          <Route
            path="/southpawsvet/*"
            element={
              serverUp ? (
                <ClientWebsite publicContent={publicContent} />
              ) : (
                <WebsiteDown />
              )
            }
          />

          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <Navigate to="/southpawsvet" />
              )
            }
          />

          {/* ---------------- AUTHENTICATION ROUTES ---------------- */}
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/verify" element={<VerificationAccount />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ---------------- PRIVATE SYSTEM ROUTES ---------------- */}
          {isAuthenticated && (
            <Route
              path="/*"
              element={
                <>
                  <Sidebar onOpenChatbot={handleOpenChatbot} />
                  <div className="content">
                    <Topbar />
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" />} />
                      <Route path="dashboard" element={<Dashboard />} />
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
                      <Route path="usermanagement" element={<UserManagement />} />
                      <Route path="history" element={<LogHistory />} />
                      <Route path="ImmunizationForm" element={<ImmunizationForm />} />
                      <Route path="SurgicalForm" element={<SurgicalForm />} />
                      <Route path="archive" element={<Archive />} />
                      <Route path="archived-suppliers" element={<ArchivedSupplierManagement />} />
                      <Route path="report-generation" element={<ReportGeneration />} />
                      <Route path="forecasting" element={<Forecasting />} />
                      <Route path="appointment" element={<Appointment />} />
                      <Route path="appointment/pending" element={<PendingAppointments />} />
                      <Route path="appointment/confirmed" element={<ConfirmedAppointments />} />
                      <Route path="appointment/cancelled" element={<CancelledAppointment />} />
                      <Route path="appointment/done" element={<DoneAppointments />} />
                      <Route path="settings" element={<GeneralSettings />} />
                      <Route path="information/clients" element={<ListClients />} />
                    </Routes>
                  </div>
                    {showChatbot && (
                      <ChatbotModal
                        triggerIntro={triggerIntro}
                        onClose={() => {
                          setShowChatbot(false);
                          setTriggerIntro(false);
                        }}
                      />
                    )}
                </>
              }
            />
          )}

          {/* ---------------- CATCH-ALL ROUTE ---------------- */}
          {!isAuthenticated && <Route path="*" element={<Navigate to="/login" />} />}
        </Routes>
      </BrowserRouter>
      <ToastContainer />
    </div>
  );
}

export default App;
