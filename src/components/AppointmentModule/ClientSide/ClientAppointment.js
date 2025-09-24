import { useEffect, useState } from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import AddAppointments from "./ClientInfo";
import ReferenceTracking from "./ReferenceTracking";
import AppointmentUnavailable from "./AppointmentUnavailable";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

export default function ClientAppointment() {
  const [appointmentFormEnabled, setAppointmentFormEnabled] = useState(null);

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
      <div className="container-fluid p-0 text-center py-5" style={{ marginTop: '100px' }}>
        <div className="spinner-border text-primary" role="status">
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
      <div>
        <div className="text-center mb-4">
          <h1>Let's Get You Scheduled</h1>
          <p className="lead text-muted">Book an appointment or track your existing booking</p>
        </div>
        <div className="d-flex justify-content-center mb-4">
          <div className="btn-group">
            <NavLink
              to="/booking/add-appointment"
              className={({ isActive }) => 
                `btn ${isActive ? "btn-primary" : "btn-outline-primary"}`
              }
            >
              Book Appointment
            </NavLink>
            <NavLink
              to="/booking/track-appointment"
              className={({ isActive }) => 
                `btn ${isActive ? "btn-primary" : "btn-outline-primary"}`
              }
            >
              Track Appointment
            </NavLink>
          </div>
        </div>

        <div className="card shadow-sm mx-auto" style={{ maxWidth: "600px" }}>
          <div className="card-body">
            <Routes>
              <Route path="add-appointment" element={<AddAppointments />} />
              <Route path="track-appointment" element={<ReferenceTracking />} />
              <Route path="/" element={<Navigate to="add-appointment" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}
