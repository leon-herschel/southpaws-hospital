import { Routes, Route, NavLink } from "react-router-dom";
import AddAppointments from "./ClientInfo";
import ReferenceTracking from "./ReferenceTracking";
import "bootstrap/dist/css/bootstrap.min.css";

function ClientAppointment() {
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
