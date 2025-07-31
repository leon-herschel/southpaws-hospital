import React, { useState } from "react";
import axios from "axios";
import { Alert, Button } from "react-bootstrap";

function TagArrived({ onClose }) {
  const [referenceNumber, setReferenceNumber] = useState("REF-");
  const [error, setError] = useState("");
  const [promptVisible, setPromptVisible] = useState(false);
  const [clientInfo, setClientInfo] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [step, setStep] = useState("input");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!referenceNumber.trim()) {
      setError("Reference number is required.");
      return;
    }

    try {
      const res = await axios.post("http://localhost/api/check-reference.php", {
        reference_number: referenceNumber,
      });

      if (res.data.valid) {
        setPromptVisible(true);
        setStep("prompt");
      } else {
        setError("Invalid reference number.");
      }
    } catch (err) {
      setError("Server error while checking reference number.");
    }
  };

  const handleExistingClient = async () => {
    try {
      const res = await axios.post("http://localhost/api/get-client-info.php", {
        reference_number: referenceNumber,
      });

      if (res.data.client) {
        setClientInfo({
          ...res.data.client,
          service: res.data.appointment_service,
          pets: res.data.pets || [],
        });
        setStep("client");
      } else {
        setError("Client info not found.");
      }
    } catch (err) {
      setError("Error fetching client information.");
    }
  };

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}

      {step === "input" && (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Enter reference number"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
          />
          <button type="submit" className="btn btn-success w-100">
            Submit
          </button>
        </form>
      )}

      {step === "prompt" && (
        <div className="text-center">
          <p>Is the client existing or new?</p>
          <Button
            variant="primary"
            className="me-2"
            onClick={handleExistingClient}
          >
            Existing
          </Button>
          <Button variant="secondary" onClick={onClose}>
            New
          </Button>
        </div>
      )}

      {step === "client" && clientInfo && (
        <div>
          <h5>Client Information</h5>
          <p>
            <strong>Name:</strong> {clientInfo.name}
          </p>
          <p>
            <strong>Contact:</strong> {clientInfo.contact}
          </p>
          <p>
            <strong>Service:</strong> {clientInfo.service}
          </p>

          {clientInfo.pets && clientInfo.pets.length > 0 && (
            <div className="mt-3">
              <h6>Pet(s) Information:</h6>
              <ul className="list-group">
                {clientInfo.pets.map((pet, index) => (
                  <li key={index} className="list-group-item">
                    <strong>Name:</strong> {pet.name} <br />
                    <strong>Species:</strong> {pet.species} <br />
                    <strong>Breed:</strong> {pet.breed}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button
            variant="success"
            className="mt-3"
            onClick={async () => {
              setUpdating(true);
              try {
                const res = await axios.post(
                  "http://localhost/api/mark-done.php",
                  {
                    reference_number: referenceNumber,
                  }
                );

                if (res.data.success) {
                  onClose();
                } else {
                  setError(res.data.message || "Failed to update status.");
                }
              } catch (err) {
                setError("Server error while updating status.");
              } finally {
                setUpdating(false);
              }
            }}
            disabled={updating}
          >
            {updating ? "Updating..." : "Confirm Arrival"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default TagArrived;
