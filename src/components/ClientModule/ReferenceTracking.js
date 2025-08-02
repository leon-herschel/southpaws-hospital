import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

function ReferenceTracking() {
  const [referenceNumber, setReferenceNumber] = useState("");
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted!");

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

      setAppointmentDetails(detailsRes.data);
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
    <div className="container mt-4">
      <h2 className="mb-3">Track Your Appointment</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="form-control mb-3"
          placeholder="Enter reference number"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
        />
        <div className="button-container">
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
          <h4>Appointment Information</h4>
          <p>
            <strong>Name:</strong> {appointmentDetails.name}
          </p>
          <p>
            <strong>Contact:</strong> {appointmentDetails.contact}
          </p>
          <p>
            <strong>Email:</strong> {appointmentDetails.email || "N/A"}
          </p>
          <p>
            <strong>Status:</strong> {appointmentDetails.status}
          </p>
          <p>
            <strong>Date:</strong> {appointmentDetails.date}
          </p>
          <p>
            <strong>Service:</strong> {appointmentDetails.service}
          </p>
          <p>
            <strong>Reference Number:</strong>{" "}
            {appointmentDetails.reference_number}
          </p>

          <h5 className="mt-3">Pet Information</h5>
          <p>
            <strong>Name:</strong> {appointmentDetails.pet_name}
          </p>
          <p>
            <strong>Breed:</strong> {appointmentDetails.pet_breed}
          </p>
          <p>
            <strong>Species:</strong> {appointmentDetails.pet_species}
          </p>
        </div>
      )}
    </div>
  );
}

export default ReferenceTracking;
