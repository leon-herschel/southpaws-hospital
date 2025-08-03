import { useEffect, useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import AddAppointments from "./ClientInfo";
import ReferenceTracking from "./ReferenceTracking";
import ErrorPage from "./ErrorPage";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

function ClientAppointment() {
  const [appointmentFormEnabled, setAppointmentFormEnabled] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost/api/ClientSide/get-booking-status.php")
      .then((res) => setAppointmentFormEnabled(res.data.appointmentFormEnabled))
      .catch((err) => {
        console.error("Error fetching status", err);
        setAppointmentFormEnabled(false); // fallback to error page
      });
  }, []);

  if (appointmentFormEnabled === null) return <p>Loading...</p>;

  if (!appointmentFormEnabled) return <ErrorPage />;

  return (
    <div className="container py-4">
      <div className="text-center mb-4">
        <h2>South Paws Veterinary Hospital</h2>
        <p className="lead">Book your appointment with us!</p>
      </div>

      <div className="d-flex justify-content-center gap-4 mb-4">
        <NavLink
          to="/southpaws-booking/add-appointment"
          className={({ isActive }) =>
            `btn ${isActive ? "btn-primary" : "btn-outline-primary"}`
          }
        >
          Book Appointment
        </NavLink>
        <NavLink
          to="/southpaws-booking/track-appointment"
          className={({ isActive }) =>
            `btn ${isActive ? "btn-primary" : "btn-outline-primary"}`
          }
        >
          Track Appointment
        </NavLink>
      </div>

      <div className="card shadow-sm mx-auto" style={{ maxWidth: "600px" }}>
        <div className="card-body">
          <Routes>
            <Route path="add-appointment" element={<AddAppointments />} />
            <Route path="track-appointment" element={<ReferenceTracking />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default ClientAppointment;
