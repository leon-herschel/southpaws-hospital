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
    <div className="container-fluid px-5 mt-4">
      <h2 className="mb-3">Track Your Appointment</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="form-control mb-3"
          placeholder="Enter reference number"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
        />
        <div className="button-container mb-3">
          <button
            type="submit"
            className="button btn-gradient"
            disabled={loading}
          >
            {loading ? "Checking..." : "Submit"}
          </button>
        </div>
      </form>

      {appointmentDetails && (
        <div className="mt-4 p-3 border rounded shadow-sm">
          <h4 className="mb-3 text-primary">Appointment Info</h4>
          <section className="mb-3">
            <p><strong>Name:</strong> {appointmentDetails.name}</p>
            <p><strong>Pet Name:</strong> {appointmentDetails.pet_name}</p>
            <p>
              <strong>Date:</strong>{" "}
              {appointmentDetails.date
                ? format(new Date(appointmentDetails.date), "MMMM d, yyyy")
                : "—"}
            </p>
            <p>
              <strong>Time:</strong>{" "}
              {appointmentDetails.time
                ? appointmentDetails.end_time
                  ? `${format(new Date(`1970-01-01T${appointmentDetails.time}`), "hh:mm a")} to ${format(new Date(`1970-01-01T${appointmentDetails.end_time}`), "hh:mm a")}`
                  : format(new Date(`1970-01-01T${appointmentDetails.time}`), "hh:mm a")
                : "—"}
            </p>
            <p><strong>Service:</strong> {appointmentDetails.service || "TBD"}</p>
            <p><strong>Doctor:</strong> {appointmentDetails.doctor_name || "TBD"}</p>
            <p>
              <strong>Status:</strong>{" "}
              <span className={getStatusClass(appointmentDetails.status)}>
                {appointmentDetails.status || "Pending"}
              </span>
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

export default ReferenceTracking;
