import { FaPhoneAlt, FaCalendarTimes } from "react-icons/fa";

function AppointmentUnavailable() {
  return (
    <div
      className="d-flex justify-content-center align-items-center text-center"
      style={{ minHeight: "80vh" }}
    >
      <div className="px-4">
        <FaCalendarTimes size={100} className="text-danger mb-4" />

        <h1 className="mb-4 fw-bold" style={{ fontSize: "2.5rem" }}>
          Online Appointments Currently Unavailable
        </h1>

        <p className="text-muted mb-4" style={{ fontSize: "1.25rem" }}>
          We’re not accepting online bookings right now.  
          But don’t worry — you can still schedule your pet’s visit!
        </p>

        <div className="p-3 bg-white shadow-sm rounded-3 d-inline-block">
          <FaPhoneAlt className="text-primary me-2" />
          <span style={{ fontSize: "1.25rem", fontWeight: "500" }}>
            Call us at <strong>0960 631 7128</strong>
          </span>
        </div>

        <p className="mt-4 text-muted">
          Thank you for your understanding. We look forward to caring for your pets!
        </p>
      </div>
    </div>
  );
}

export default AppointmentUnavailable;
