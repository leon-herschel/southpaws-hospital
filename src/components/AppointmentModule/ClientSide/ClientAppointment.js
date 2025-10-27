import { useEffect, useState } from "react";
import { Routes, Route, NavLink, Navigate, useLocation } from "react-router-dom";
import AddAppointments from "./ClientAddAppointment";
import ReferenceTracking from "./ReferenceTracking";
import AppointmentUnavailable from "./AppointmentUnavailable";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

export default function ClientAppointment() {
  const [appointmentFormEnabled, setAppointmentFormEnabled] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const appointmentSection = document.querySelector(".client-appointment");
    if (appointmentSection) {
      appointmentSection.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);

  useEffect(() => {
    axios
        .get("http://localhost/api/ClientSide/get-booking-status.php")
        .then((res) => setAppointmentFormEnabled(res.data.appointmentFormEnabled))
        .catch((err) => {
          console.error("Error fetching status", err);
          setAppointmentFormEnabled(false);
        });
    }, []);

  if (appointmentFormEnabled === null) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-grow text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!appointmentFormEnabled) {
    return (
      <div className="container-fluid p-0" style={{ marginTop: '100px' }}>
        <AppointmentUnavailable />
      </div>
    );
  }

  return (
    <div className="container-fluid client-appointment mb-5" style={{ marginTop: '100px', minHeight: '80vh' }}>
      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-8">
          {/* Header Section */}
          <div className="text-center mb-2">
            <h1 className="display-5 fw-bold mb-3">Schedule Your Visit</h1>
            <p className="lead text-muted">Book an appointment or track your existing booking with ease</p>
          </div>
          
          {/* Navigation Tabs */}
          <div className="card shadow-lg border-0 rounded-3">
            <div className="card-header bg-transparent border-bottom-0 pt-4">
              <ul className="nav nav-pills nav-fill gap-2" role="tablist">
                <li className="nav-item" role="presentation">
                  <NavLink
                    to="add-appointment"
                    className={({ isActive }) => 
                      `nav-link ${isActive ? "active btn-primary" : "text-muted"} fw-semibold py-3`
                    }
                  >
                    <i className="fas fa-calendar-plus me-2"></i>
                    Book Appointment
                  </NavLink>
                </li>
                <li className="nav-item" role="presentation">
                  <NavLink
                    to="track-appointment"
                    className={({ isActive }) => 
                      `nav-link ${isActive ? "active btn-primary" : "text-muted"} fw-semibold py-3`
                    }
                  >
                    <i className="fas fa-search me-2"></i>
                    Track Appointment
                  </NavLink>
                </li>
              </ul>
            </div>
            
            {/* Content Section */}
            <div className="card-body p-4 p-md-4 mt-3">
              <Routes>
                <Route path="add-appointment" element={<AddAppointments />} />
                <Route path="track-appointment" element={<ReferenceTracking />} />
                <Route path="/" element={<Navigate to="add-appointment" replace />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}