import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { format } from "date-fns";

function ReferenceTracking() {
  const [referenceNumber, setReferenceNumber] = useState("");
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const getStatusClass = (status) => {
    switch (status) {
      case "Confirmed":
        return "badge badge-lg bg-success";
      case "Cancelled":
        return "badge badge-lg bg-danger";
      default:
        return "badge badge-lg bg-secondary"; 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!referenceNumber.trim()) {
      toast.error("Reference number is required.");
      return;
    }

    setLoading(true);
    setAppointmentDetails(null);

    try {
      // Step 1: Check if reference number is valid
      const checkRes = await axios.post(
        "http://localhost/api/ClientSide/check-reference.php",
        { reference_number: referenceNumber }
      );

      if (!checkRes.data.valid) {
        toast.error("Invalid reference number.");
        return;
      }

      // Step 2: Fetch appointment details
      const detailsRes = await axios.post(
        "http://localhost/api/ClientSide/get-client-info.php",
        { reference_number: referenceNumber }
      );

      const details = detailsRes.data;

      // Disallow tracking for Arrived and Done
      if (details.status === "Arrived" || details.status === "Done") {
        toast.error("Appointment not found.");
        return;
      }

      setAppointmentDetails(details);
      toast.success("Appointment details fetched!");
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error(error.response.data?.error || "Appointment not found.");
      } else {
        toast.error("Server error while fetching appointment.");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tracking-container">
      <div className="text-center mb-4">
        <i className="fas fa-search text-primary mb-3" style={{ fontSize: '3rem' }}></i>
        <h3 className="fw-bold">Track Your Appointment</h3>
        <p className="text-muted">Enter your reference number to check your appointment status</p>
      </div>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="row g-2 align-items-center justify-content-center"> 
          <div className="col-md-8 col-lg-6"> 
            <input
              type="text"
              className="form-control form-control-lg"
              placeholder="Enter your reference number (e.g., ABC-1234)"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </div>
          <div className="col-md-auto"> 
            <button
              type="submit"
              className="btn btn-primary btn-lg w-100" 
              disabled={loading}
              style={{ minWidth: "120px" }} 
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Checking...
                </>
              ) : (
                <>
                  <i className="fas fa-search me-2"></i>
                  Track
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {appointmentDetails && (
        <div className="appointment-details-card mt-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white py-3">
              <h5 className="mb-0">
                <i className="fas fa-calendar-check me-2"></i>
                Appointment Details
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="row">
                <div className="col-md-6">
                  <div className="detail-item mb-3">
                    <strong className="text-primary">Name:</strong>
                    <p className="mb-0">{appointmentDetails.name}</p>
                  </div>
                  <div className="detail-item mb-3">
                    <strong className="text-primary">Pet Name:</strong>
                    <p className="mb-0">{appointmentDetails.pet_name}</p>
                  </div>
                  <div className="detail-item mb-3">
                    <strong className="text-primary">Date:</strong>
                    <p className="mb-0">
                      {appointmentDetails.date
                        ? format(new Date(appointmentDetails.date), "MMMM d, yyyy")
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="detail-item mb-3">
                    <strong className="text-primary">Time:</strong>
                    <p className="mb-0">
                      {appointmentDetails.time
                        ? appointmentDetails.end_time
                          ? `${format(new Date(`1970-01-01T${appointmentDetails.time}`), "hh:mm a")} - ${format(new Date(`1970-01-01T${appointmentDetails.end_time}`), "hh:mm a")}`
                          : format(new Date(`1970-01-01T${appointmentDetails.time}`), "hh:mm a")
                        : "—"}
                    </p>
                  </div>
                  <div className="detail-item mb-3">
                    <strong className="text-primary">Service:</strong>
                    <p className="mb-0">{appointmentDetails.service || "TBD"}</p>
                  </div>
                  <div className="detail-item mb-3">
                    <strong className="text-primary">Status:</strong>
                    <div className="mt-1">
                      <span className={getStatusClass(appointmentDetails.status)}>
                        {appointmentDetails.status || "Pending"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReferenceTracking;
