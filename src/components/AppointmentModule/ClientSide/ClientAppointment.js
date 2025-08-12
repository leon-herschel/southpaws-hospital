import { useEffect, useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import AddAppointments from "./ClientInfo";
import ReferenceTracking from "./ReferenceTracking";
import ErrorPage from "./ErrorPage";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import ClientTopBar from "./ClientTopBar";
import { FaFacebook, FaMapMarkerAlt, FaPhoneAlt } from "react-icons/fa";

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
    <>
      <ClientTopBar />
      <div className="container py-4 mt-5">
        <div className="text-center mb-4">
          <h1>Let’s Get You Scheduled</h1>
        </div>

        <div className="d-flex justify-content-center mb-4">
          <div className="btn-group">
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
        </div>


        <div className="card shadow-sm mx-auto" style={{ maxWidth: "600px" }}>
          <div className="card-body">
            <Routes>
              <Route path="add-appointment" element={<AddAppointments />} />
              <Route path="track-appointment" element={<ReferenceTracking />} />
            </Routes>
          </div>
        </div>

        <footer className="text-center py-4 mt-5 bg-light border-top rounded">
          <p className="mb-1 flex justify-center items-center gap-2">
            <FaMapMarkerAlt /> Urgello, Cebu City, Philippines
          </p>
          <p className="mb-1 flex justify-center items-center gap-2">
            <FaPhoneAlt /> 0960 631 7128
          </p>
          <p className="mb-1">
            <a
              href="https://www.facebook.com/swusouthpaws/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary d-inline-flex align-items-center gap-1"
              style={{ textDecoration: "none" }}
            >
              <FaFacebook size={20} />
              South Paws Veterinary Hospital
            </a>
          </p>
          <small className="text-muted">
            &copy; {new Date().getFullYear()} South Paws Veterinary Hospital
          </small>
        </footer>
      </div>
    </>
  );
}

export default ClientAppointment;
